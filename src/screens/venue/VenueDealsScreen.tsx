import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import PageHeader from '../../components/layout/PageHeader';
import FAB from '../../components/layout/FAB';
import Badge from '../../components/common/Badge';
import Avatar from '../../components/common/Avatar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import Snackbar from '../../components/common/Snackbar';
import { getVenueDeals } from '../../api/events';
import { BookingDeal } from '../../types';

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

  useEffect(() => { fetchDeals(); }, [fetchDeals]);

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
        onPress={() => setSnackbar('Create deal coming soon')}
        color="#10b981"
      />

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
});

export default VenueDealsScreen;
