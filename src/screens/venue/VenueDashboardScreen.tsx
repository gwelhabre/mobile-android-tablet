import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { VenueStackParamList } from '../../navigation/stacks/VenueStack';
import PageHeader from '../../components/layout/PageHeader';
import TwoPane from '../../components/layout/TwoPane';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Snackbar from '../../components/common/Snackbar';
import { getVenueDashboard, getVenueDeals } from '../../api/events';
import { BookingDeal } from '../../types';

type NavProp = NativeStackNavigationProp<VenueStackParamList, 'VenueDashboard'>;

const dealStatusColors: Record<string, string> = {
  proposed: '#3b82f6', negotiating: '#f59e0b', accepted: '#10b981',
  rejected: '#ef4444', completed: '#a855f7', cancelled: '#6b7280',
};

const VenueDashboardScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const [dashboard, setDashboard] = useState<Record<string, any>>({});
  const [deals, setDeals] = useState<BookingDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [snackbar, setSnackbar] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [dashData, dealData] = await Promise.all([
        getVenueDashboard(),
        getVenueDeals(),
      ]);
      setDashboard(dashData);
      setDeals(dealData);
    } catch {
      setSnackbar('Failed to load dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <LoadingSpinner fullScreen />;

  const stats = [
    { label: 'Total Events', value: String(dashboard.totalEvents || 0), icon: 'calendar-check', color: '#3b82f6' },
    { label: 'Active Deals', value: String(deals.filter((d) => ['proposed', 'negotiating', 'accepted'].includes(d.status)).length), icon: 'handshake', color: '#f59e0b' },
    { label: 'Revenue', value: `$${(dashboard.revenue || 0).toLocaleString()}`, icon: 'cash', color: '#10b981' },
    { label: 'DJs Booked', value: String(dashboard.djsBooked || 0), icon: 'account-music', color: '#a855f7' },
  ];

  const upcomingEvents = (dashboard.upcomingEvents || []) as any[];
  const activeDeals = deals.filter((d) => ['proposed', 'negotiating', 'accepted'].includes(d.status));

  const leftContent = (
    <View style={styles.leftContainer}>
      <Text style={styles.panelTitle}>Upcoming Events</Text>
      {upcomingEvents.length === 0 ? (
        <View style={styles.emptyPanel}>
          <MaterialCommunityIcons name="calendar-blank" size={32} color="#374151" />
          <Text style={styles.emptyText}>No upcoming events</Text>
        </View>
      ) : (
        upcomingEvents.map((event: any, idx: number) => (
          <Card key={idx} style={styles.eventCard} outlined>
            <View style={styles.eventRow}>
              <View style={styles.dateBadge}>
                <Text style={styles.dateMonth}>
                  {new Date(event.date).toLocaleString('default', { month: 'short' }).toUpperCase()}
                </Text>
                <Text style={styles.dateDay}>{new Date(event.date).getDate()}</Text>
              </View>
              <View style={styles.eventInfo}>
                <Text style={styles.eventName} numberOfLines={1}>{event.title}</Text>
                <Text style={styles.eventDJ} numberOfLines={1}>{event.djName}</Text>
              </View>
              <Badge label={event.status || 'upcoming'} color="#3b82f6" small />
            </View>
          </Card>
        ))
      )}
    </View>
  );

  const rightContent = (
    <View style={styles.rightContainer}>
      <View style={styles.rightHeader}>
        <Text style={styles.panelTitle}>Active Deals</Text>
        <TouchableOpacity onPress={() => navigation.navigate('VenueDeals')} activeOpacity={0.7}>
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      </View>
      {activeDeals.length === 0 ? (
        <View style={styles.emptyPanel}>
          <MaterialCommunityIcons name="handshake-outline" size={32} color="#374151" />
          <Text style={styles.emptyText}>No active deals</Text>
        </View>
      ) : (
        activeDeals.map((deal) => (
          <Card key={deal.id} style={styles.dealCard} outlined>
            <View style={styles.dealRow}>
              <View style={styles.dealInfo}>
                <Text style={styles.dealDJ} numberOfLines={1}>{deal.djName}</Text>
                <Text style={styles.dealDate}>
                  {new Date(deal.eventDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </Text>
              </View>
              <Text style={styles.dealAmount}>${deal.proposedAmount.toLocaleString()}</Text>
              <Badge label={deal.status.toUpperCase()} color={dealStatusColors[deal.status] || '#6b7280'} small />
            </View>
          </Card>
        ))
      )}
    </View>
  );

  return (
    <View style={styles.root}>
      <PageHeader
          title="Venue Dashboard"
          subtitle="Manage your venue"
          actions={[{ icon: 'home', onPress: () => navigation.dispatch(DrawerActions.jumpTo('HomeStack' as any)) }]}
        />
      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor="#a855f7" />}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats */}
        <View style={styles.statsGrid}>
          {stats.map((s) => (
            <Card key={s.label} style={[styles.statCard, { borderColor: `${s.color}30` }]}>
              <View style={[styles.statIcon, { backgroundColor: `${s.color}20` }]}>
                <MaterialCommunityIcons name={s.icon as any} size={22} color={s.color} />
              </View>
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </Card>
          ))}
        </View>

        {/* Go Live */}
        <TouchableOpacity style={styles.goLiveBtn} onPress={() => navigation.navigate('VenueBroadcast')} activeOpacity={0.85}>
          <View style={styles.goLiveDot} />
          <View style={{ flex: 1 }}>
            <Text style={styles.goLiveText}>Go Live</Text>
            <Text style={styles.goLiveSubtext}>Stream your venue ambiance</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#fff" />
        </TouchableOpacity>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          {[
            { label: 'New Deal', icon: 'handshake-outline', color: '#10b981' },
            { label: 'Create Event', icon: 'calendar-plus', color: '#3b82f6', onPress: () => navigation.navigate('VenuePostEvent') },
            { label: 'Find DJs', icon: 'account-search', color: '#a855f7', onPress: () => navigation.navigate('VenueFindDJs') },
            { label: 'View Deals', icon: 'format-list-bulleted', color: '#f59e0b', onPress: () => navigation.navigate('VenueDeals') },
            { label: 'Analytics', icon: 'chart-bar', color: '#ec4899', onPress: () => navigation.navigate('VenueAnalytics') },
          ].map((action) => (
            <TouchableOpacity
              key={action.label}
              style={styles.quickBtn}
              onPress={(action as any).onPress}
              activeOpacity={0.75}
            >
              <View style={[styles.quickIcon, { backgroundColor: `${action.color}20` }]}>
                <MaterialCommunityIcons name={action.icon as any} size={20} color={action.color} />
              </View>
              <Text style={styles.quickLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* TwoPane */}
        <View style={styles.twoPane}>
          <TwoPane
            leftContent={leftContent}
            rightContent={rightContent}
            scrollLeft={false}
            scrollRight={false}
          />
        </View>
      </ScrollView>

      <Snackbar message={snackbar} visible={!!snackbar} onDismiss={() => setSnackbar('')} type="error" />
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0a0a0f' },
  content: { flex: 1 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, padding: 16 },
  statCard: { flex: 1, minWidth: 140, borderWidth: 1, gap: 6 },
  statIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '800' },
  statLabel: { color: '#9ca3af', fontSize: 12 },
  goLiveBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#2d0a0a', borderWidth: 1, borderColor: '#ef4444',
    borderRadius: 14, padding: 16, marginHorizontal: 16, marginBottom: 12,
  },
  goLiveDot: {
    width: 12, height: 12, borderRadius: 6, backgroundColor: '#ef4444',
  },
  goLiveText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  goLiveSubtext: { color: '#fca5a5', fontSize: 12, marginTop: 2 },
  quickActions: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingBottom: 12 },
  quickBtn: {
    flex: 1, alignItems: 'center', gap: 8, backgroundColor: '#12121a',
    borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#1e1e2e',
  },
  quickIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  quickLabel: { color: '#e5e7eb', fontSize: 12, fontWeight: '600', textAlign: 'center' },
  twoPane: { minHeight: 300 },
  leftContainer: { gap: 8 },
  rightContainer: { gap: 8 },
  rightHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  panelTitle: { color: '#f3f4f6', fontSize: 16, fontWeight: '700' },
  viewAllText: { color: '#a855f7', fontSize: 12, fontWeight: '600' },
  emptyPanel: { alignItems: 'center', paddingVertical: 32, gap: 8 },
  emptyText: { color: '#4b5563', fontSize: 13 },
  eventCard: { padding: 10 },
  eventRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dateBadge: { width: 44, alignItems: 'center', backgroundColor: '#1a1a2e', borderRadius: 8, paddingVertical: 6 },
  dateMonth: { color: '#a855f7', fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  dateDay: { color: '#f3f4f6', fontSize: 18, fontWeight: '800' },
  eventInfo: { flex: 1 },
  eventName: { color: '#f3f4f6', fontSize: 13, fontWeight: '600' },
  eventDJ: { color: '#a855f7', fontSize: 11 },
  dealCard: { padding: 10 },
  dealRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dealInfo: { flex: 1 },
  dealDJ: { color: '#f3f4f6', fontSize: 13, fontWeight: '600' },
  dealDate: { color: '#6b7280', fontSize: 11, marginTop: 2 },
  dealAmount: { color: '#10b981', fontSize: 14, fontWeight: '700' },
});

export default VenueDashboardScreen;
