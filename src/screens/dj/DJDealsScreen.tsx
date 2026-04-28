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
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import Snackbar from '../../components/common/Snackbar';
import { getDJDeals, respondToDeal } from '../../api/dj';
import { BookingDeal } from '../../types';

const dealStatusColors: Record<string, string> = {
  proposed: '#3b82f6', negotiating: '#f59e0b', accepted: '#10b981',
  rejected: '#ef4444', completed: '#a855f7', cancelled: '#6b7280',
};

const DJDealsScreen: React.FC = () => {
  const navigation = useNavigation();
  const [deals, setDeals] = useState<BookingDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState('');
  const [snackType, setSnackType] = useState<'default' | 'success' | 'error'>('default');
  const [filter, setFilter] = useState<string>('all');

  const fetchDeals = useCallback(async () => {
    try {
      const data = await getDJDeals();
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

  const handleRespond = async (dealId: string, action: 'accept' | 'reject') => {
    setActionLoading(dealId + action);
    try {
      const updated = await respondToDeal(dealId, action);
      setDeals((prev) => prev.map((d) => d.id === dealId ? updated : d));
      setSnackbar(`Deal ${action === 'accept' ? 'accepted' : 'rejected'} successfully`);
      setSnackType('success');
    } catch {
      setSnackbar('Action failed');
      setSnackType('error');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredDeals = filter === 'all' ? deals : deals.filter((d) => d.status === filter);

  const FILTERS = ['all', 'proposed', 'negotiating', 'accepted', 'completed', 'rejected'];

  if (loading) return <LoadingSpinner fullScreen />;

  const TableHeader = () => (
    <View style={styles.tableHeader}>
      <Text style={[styles.headerCell, styles.venueCol]}>Venue</Text>
      <Text style={[styles.headerCell, styles.dateCol]}>Event Date</Text>
      <Text style={[styles.headerCell, styles.amountCol]}>Amount</Text>
      <Text style={[styles.headerCell, styles.statusCol]}>Status</Text>
      <Text style={[styles.headerCell, styles.actionsCol]}>Actions</Text>
    </View>
  );

  return (
    <View style={styles.root}>
      <PageHeader
        title="Booking Deals"
        subtitle={`${deals.length} total deals`}
        showBack
        onBack={() => navigation.goBack()}
      />

      {/* Filter chips */}
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
        <EmptyState
          icon="handshake-outline"
          title="No deals found"
          message={filter !== 'all' ? `No ${filter} deals` : 'No booking deals yet'}
        />
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
            contentContainerStyle={{ paddingBottom: 80 }}
            renderItem={({ item }) => (
              <View style={styles.tableRow}>
                <View style={[styles.cell, styles.venueCol]}>
                  <View style={styles.venueIcon}>
                    <MaterialCommunityIcons name="office-building" size={16} color="#6b7280" />
                  </View>
                  <View style={styles.venueInfo}>
                    <Text style={styles.venueName} numberOfLines={1}>{item.venueName}</Text>
                    {item.eventTitle && (
                      <Text style={styles.eventTitle} numberOfLines={1}>{item.eventTitle}</Text>
                    )}
                  </View>
                </View>
                <Text style={[styles.cellText, styles.dateCol]}>
                  {new Date(item.eventDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </Text>
                <View style={[styles.cell, styles.amountCol]}>
                  <Text style={styles.amount}>
                    ${(item.agreedAmount || item.proposedAmount).toLocaleString()}
                  </Text>
                  {item.agreedAmount && item.agreedAmount !== item.proposedAmount && (
                    <Text style={styles.originalAmount}>${item.proposedAmount.toLocaleString()}</Text>
                  )}
                </View>
                <View style={[styles.cell, styles.statusCol]}>
                  <Badge
                    label={item.status.toUpperCase()}
                    color={dealStatusColors[item.status] || '#6b7280'}
                    small
                  />
                </View>
                <View style={[styles.cell, styles.actionsCol, styles.actionsWrap]}>
                  {item.status === 'proposed' && (
                    <>
                      <TouchableOpacity
                        style={styles.acceptBtn}
                        onPress={() => handleRespond(item.id, 'accept')}
                        disabled={actionLoading === item.id + 'accept'}
                        activeOpacity={0.75}
                      >
                        <MaterialCommunityIcons name="check" size={16} color="#10b981" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.rejectBtn}
                        onPress={() => handleRespond(item.id, 'reject')}
                        disabled={actionLoading === item.id + 'reject'}
                        activeOpacity={0.75}
                      >
                        <MaterialCommunityIcons name="close" size={16} color="#ef4444" />
                      </TouchableOpacity>
                    </>
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
  filterChip: {
    paddingVertical: 5, paddingHorizontal: 14, borderRadius: 20,
    backgroundColor: '#12121a', borderWidth: 1, borderColor: '#1e1e2e',
  },
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
  venueCol: { flex: 3 },
  dateCol: { flex: 2 },
  amountCol: { flex: 1 },
  statusCol: { flex: 2 },
  actionsCol: { flex: 2 },
  venueIcon: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#1a1a2e', justifyContent: 'center', alignItems: 'center' },
  venueInfo: { flex: 1 },
  venueName: { color: '#f3f4f6', fontSize: 13, fontWeight: '600' },
  eventTitle: { color: '#6b7280', fontSize: 11, marginTop: 1 },
  amount: { color: '#10b981', fontSize: 14, fontWeight: '700' },
  originalAmount: { color: '#4b5563', fontSize: 11, textDecorationLine: 'line-through' },
  actionsWrap: { gap: 6 },
  acceptBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#064e3b30', justifyContent: 'center', alignItems: 'center' },
  rejectBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#7f1d1d30', justifyContent: 'center', alignItems: 'center' },
  menuBtn: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },
});

export default DJDealsScreen;
