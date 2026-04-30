import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import PageHeader from '../../components/layout/PageHeader';
import FAB from '../../components/layout/FAB';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Avatar from '../../components/common/Avatar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import Snackbar from '../../components/common/Snackbar';
import { getVenueDeals, createVenueDeal } from '../../api/events';
import { getMyVenues } from '../../api/rankings';
import { getDJs, getDjDisplayName } from '../../api/dj';
import { BookingDeal, DJProfile } from '../../types';

const dealStatusColors: Record<string, string> = {
  proposed: '#3b82f6', negotiating: '#f59e0b', accepted: '#10b981',
  rejected: '#ef4444', completed: '#a855f7', cancelled: '#6b7280',
};

const VenueDealsScreen: React.FC = () => {
  const navigation = useNavigation();
  const [deals, setDeals] = useState<BookingDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [snackbar, setSnackbar] = useState('');
  const [snackType, setSnackType] = useState<'default' | 'success' | 'error'>('default');
  const [modalVisible, setModalVisible] = useState(false);
  const [venues, setVenues] = useState<Array<{ id: string; name: string; city?: string | null }>>([]);
  const [selectedVenueId, setSelectedVenueId] = useState('');
  const [djSearch, setDjSearch] = useState('');
  const [djs, setDjs] = useState<DJProfile[]>([]);
  const [selectedDj, setSelectedDj] = useState<DJProfile | null>(null);
  const [proposedFee, setProposedFee] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const loadVenues = async () => {
    try {
      const data = await getMyVenues();
      setVenues(data);
      if (data.length === 1) setSelectedVenueId(String(data[0].id));
    } catch {
      setVenues([]);
    }
  };

  const searchDjs = async (q: string) => {
    setDjSearch(q);
    if (q.trim().length < 2) { setDjs([]); return; }
    try {
      const data = await getDJs(q.trim());
      setDjs(data.slice(0, 10));
    } catch {
      setDjs([]);
    }
  };

  const submitDeal = async () => {
    if (saving) return; // re-entrancy guard
    if (!selectedDj) {
      Alert.alert('Pick a DJ', 'Search and select a DJ to propose to.');
      return;
    }
    if (!selectedVenueId) {
      Alert.alert('Pick a venue', 'Select one of your venues.');
      return;
    }
    setSaving(true);
    try {
      await createVenueDeal({
        djId: String(selectedDj.id),
        venueId: selectedVenueId,
        proposedFee: proposedFee.trim() ? Number(proposedFee) : undefined,
        eventDate: eventDate.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      setSelectedDj(null); setDjSearch(''); setDjs([]); setProposedFee(''); setEventDate(''); setNotes('');
      setModalVisible(false);
      await fetchDeals();
      setSnackbar('Proposal sent');
      setSnackType('success');
    } catch (err: any) {
      setSnackbar(err?.response?.data?.error ?? 'Could not propose deal');
      setSnackType('error');
    } finally {
      setSaving(false);
    }
  };

  const openModal = () => {
    if (venues.length === 0) loadVenues();
    setModalVisible(true);
  };

  const fetchDeals = useCallback(async () => {
    try {
      const data = await getVenueDeals();
      setDeals(data);
    } catch {
      setSnackbar('Failed to load deals');
      setSnackType('error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchDeals(); loadVenues(); }, [fetchDeals]);

  const filteredDeals = filter === 'all' ? deals : deals.filter((d) => d.status === filter);

  const FILTERS = ['all', 'proposed', 'accepted', 'completed', 'rejected'];

  if (loading) return <LoadingSpinner fullScreen />;

  const TableHeader = () => (
    <View style={styles.tableHeader}>
      <Text style={[styles.headerCell, styles.djCol]}>DJ</Text>
      <Text style={[styles.headerCell, styles.dateCol]}>Event Date</Text>
      <Text style={[styles.headerCell, styles.proposedCol]}>Proposed</Text>
      <Text style={[styles.headerCell, styles.agreedCol]}>Agreed</Text>
      <Text style={[styles.headerCell, styles.statusCol]}>Status</Text>
      <Text style={[styles.headerCell, styles.actionsCol]}>Actions</Text>
    </View>
  );

  return (
    <View style={styles.root}>
      <PageHeader
        title="Booking Deals"
        subtitle={`${deals.length} deals`}
        showBack
        onBack={() => navigation.goBack()}
      />

      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
            onPress={() => setFilter(f)}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {filteredDeals.length === 0 ? (
        <EmptyState icon="handshake-outline" title="No deals found" message="Propose a booking to get started" />
      ) : (
        <View style={styles.tableContainer}>
          <TableHeader />
          <FlatList
            data={filteredDeals}
            keyExtractor={(d) => d.id}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchDeals(); }} tintColor="#a855f7" />
            }
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
            renderItem={({ item }) => (
              <View style={styles.tableRow}>
                <View style={[styles.cell, styles.djCol]}>
                  <Avatar name={item.djName} size={32} />
                  <View style={styles.djInfo}>
                    <Text style={styles.djName} numberOfLines={1}>{item.djName}</Text>
                    {item.eventTitle && (
                      <Text style={styles.eventTitle} numberOfLines={1}>{item.eventTitle}</Text>
                    )}
                  </View>
                </View>
                <Text style={[styles.cellText, styles.dateCol]}>
                  {new Date(item.eventDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                </Text>
                <Text style={[styles.cellText, styles.proposedCol, styles.amountText]}>
                  ${item.proposedAmount.toLocaleString()}
                </Text>
                <Text style={[styles.cellText, styles.agreedCol, styles.agreedText]}>
                  {item.agreedAmount ? `$${item.agreedAmount.toLocaleString()}` : '—'}
                </Text>
                <View style={[styles.cell, styles.statusCol]}>
                  <Badge
                    label={item.status.toUpperCase()}
                    color={dealStatusColors[item.status] || '#6b7280'}
                    small
                  />
                </View>
                <View style={[styles.cell, styles.actionsCol, styles.actionsWrap]}>
                  {item.status === 'proposed' && (
                    <TouchableOpacity style={styles.negotiateBtn} activeOpacity={0.7}>
                      <Text style={styles.negotiateText}>Counter</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={styles.menuBtn} activeOpacity={0.7}>
                    <MaterialCommunityIcons name="dots-vertical" size={18} color="#6b7280" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        </View>
      )}

      <FAB
        icon="plus"
        label="New Deal"
        onPress={openModal}
        color="#10b981"
      />

      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Propose Deal</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <MaterialCommunityIcons name="close" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.modalBody}>
              {venues.length > 1 && (
                <>
                  <Text style={styles.modalLabel}>Venue</Text>
                  <View style={styles.modalChipRow}>
                    {venues.map((v) => (
                      <TouchableOpacity
                        key={v.id}
                        style={[styles.modalChip, String(v.id) === selectedVenueId && styles.modalChipActive]}
                        onPress={() => setSelectedVenueId(String(v.id))}
                      >
                        <Text style={[styles.modalChipText, String(v.id) === selectedVenueId && styles.modalChipTextActive]}>{v.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              <Text style={styles.modalLabel}>DJ</Text>
              {selectedDj ? (
                <View style={styles.selectedDj}>
                  <Avatar uri={selectedDj.avatarUrl} name={getDjDisplayName(selectedDj)} size={36} />
                  <Text style={styles.selectedDjName}>{getDjDisplayName(selectedDj)}</Text>
                  <TouchableOpacity onPress={() => setSelectedDj(null)}>
                    <MaterialCommunityIcons name="close-circle" size={20} color="#6b7280" />
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <TextInput
                    style={styles.modalInput}
                    value={djSearch}
                    onChangeText={searchDjs}
                    placeholder="Search DJs..."
                    placeholderTextColor="#4b5563"
                  />
                  {djs.map((dj) => (
                    <TouchableOpacity key={String(dj.id)} style={styles.djRow} onPress={() => { setSelectedDj(dj); setDjs([]); setDjSearch(''); }}>
                      <Avatar uri={dj.avatarUrl} name={getDjDisplayName(dj)} size={32} />
                      <Text style={styles.djRowName}>{getDjDisplayName(dj)}</Text>
                    </TouchableOpacity>
                  ))}
                </>
              )}

              <Text style={styles.modalLabel}>Proposed Fee</Text>
              <TextInput style={styles.modalInput} value={proposedFee} onChangeText={setProposedFee} placeholder="e.g. 800" placeholderTextColor="#4b5563" keyboardType="decimal-pad" />

              <Text style={styles.modalLabel}>Event Date</Text>
              <TextInput style={styles.modalInput} value={eventDate} onChangeText={setEventDate} placeholder="YYYY-MM-DD" placeholderTextColor="#4b5563" />

              <Text style={styles.modalLabel}>Notes</Text>
              <TextInput style={[styles.modalInput, { minHeight: 80 }]} value={notes} onChangeText={setNotes} placeholder="Set length, equipment..." placeholderTextColor="#4b5563" multiline textAlignVertical="top" />

              <Button label={saving ? 'Sending...' : 'Send Proposal'} onPress={submitDeal} loading={saving} fullWidth color="#10b981" />
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Snackbar message={snackbar} visible={!!snackbar} onDismiss={() => setSnackbar('')} type={snackType} />
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0a0a0f' },
  filterRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 6,
    paddingHorizontal: 14, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#1e1e2e',
  },
  filterChip: { paddingVertical: 5, paddingHorizontal: 14, borderRadius: 20, backgroundColor: '#12121a', borderWidth: 1, borderColor: '#1e1e2e' },
  filterChipActive: { backgroundColor: 'rgba(168,85,247,0.15)', borderColor: '#a855f7' },
  filterText: { color: '#6b7280', fontSize: 12, fontWeight: '500' },
  filterTextActive: { color: '#a855f7', fontWeight: '600' },
  tableContainer: { flex: 1 },
  tableHeader: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 14,
    backgroundColor: '#12121a', borderBottomWidth: 1, borderBottomColor: '#1e1e2e',
  },
  headerCell: { color: '#4b5563', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  tableRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 14,
    borderBottomWidth: 1, borderBottomColor: '#1a1a2e',
  },
  cell: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cellText: { color: '#9ca3af', fontSize: 13 },
  djCol: { flex: 3 },
  dateCol: { flex: 2 },
  proposedCol: { flex: 1 },
  agreedCol: { flex: 1 },
  statusCol: { flex: 2 },
  actionsCol: { flex: 2 },
  djInfo: { flex: 1 },
  djName: { color: '#f3f4f6', fontSize: 13, fontWeight: '600' },
  eventTitle: { color: '#6b7280', fontSize: 11, marginTop: 1 },
  amountText: { color: '#f59e0b', fontWeight: '600' },
  agreedText: { color: '#10b981', fontWeight: '600' },
  actionsWrap: { gap: 6 },
  negotiateBtn: {
    paddingVertical: 5, paddingHorizontal: 10, borderRadius: 8,
    backgroundColor: 'rgba(59,130,246,0.2)', borderWidth: 1, borderColor: '#3b82f640',
  },
  negotiateText: { color: '#3b82f6', fontSize: 11, fontWeight: '600' },
  menuBtn: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', justifyContent: 'center', padding: 24 },
  modalCard: { maxHeight: '88%', backgroundColor: '#12121a', borderRadius: 18, borderWidth: 1, borderColor: '#263241', padding: 18, maxWidth: 540, alignSelf: 'center', width: '100%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: '900' },
  closeBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#1f1f2e', alignItems: 'center', justifyContent: 'center' },
  modalBody: { gap: 10 },
  modalLabel: { color: '#9ca3af', fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 4 },
  modalInput: { backgroundColor: '#0a0a0f', borderWidth: 1, borderColor: '#2d2d3d', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: '#fff', fontSize: 14 },
  modalChipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  modalChip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, borderWidth: 1, borderColor: '#2d2d3d', backgroundColor: '#0a0a0f' },
  modalChipActive: { borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.12)' },
  modalChipText: { color: '#9ca3af', fontSize: 12, fontWeight: '700' },
  modalChipTextActive: { color: '#10b981' },
  selectedDj: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, backgroundColor: 'rgba(16,185,129,0.08)', borderWidth: 1, borderColor: '#10b98155', borderRadius: 12 },
  selectedDjName: { flex: 1, color: '#fff', fontSize: 14, fontWeight: '700' },
  djRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 8, borderRadius: 10, backgroundColor: '#0a0a0f' },
  djRowName: { color: '#e5e7eb', fontSize: 13, fontWeight: '600' },
});

export default VenueDealsScreen;
