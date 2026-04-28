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
import { DJStackParamList } from '../../navigation/stacks/DJStack';
import PageHeader from '../../components/layout/PageHeader';
import FAB from '../../components/layout/FAB';
import TwoPane from '../../components/layout/TwoPane';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Snackbar from '../../components/common/Snackbar';
import { getDJDeals, getDJAnalytics, getMyDJProfile } from '../../api/dj';
import { BookingDeal, DJProfile } from '../../types';

type NavProp = NativeStackNavigationProp<DJStackParamList, 'DJDashboard'>;

const dealStatusColors: Record<string, string> = {
  proposed: '#3b82f6', negotiating: '#f59e0b', accepted: '#10b981',
  rejected: '#ef4444', completed: '#a855f7', cancelled: '#6b7280',
};

const StatCard: React.FC<{ label: string; value: string; icon: string; color: string; sub?: string }> = ({
  label, value, icon, color, sub,
}) => (
  <Card style={[styles.statCard, { borderColor: `${color}30` }]}>
    <View style={[styles.statIcon, { backgroundColor: `${color}20` }]}>
      <MaterialCommunityIcons name={icon as any} size={18} color={color} />
    </View>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
    {sub && <Text style={styles.statSub}>{sub}</Text>}
  </Card>
);

const DJDashboardScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const [profile, setProfile] = useState<DJProfile | null>(null);
  const [deals, setDeals] = useState<BookingDeal[]>([]);
  const [analytics, setAnalytics] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [snackbar, setSnackbar] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [profileData, dealData, analyticsData] = await Promise.all([
        getMyDJProfile(),
        getDJDeals(),
        getDJAnalytics(),
      ]);
      setProfile(profileData);
      setDeals(dealData);
      setAnalytics(analyticsData);
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
    { label: 'Ranking', value: `#${profile?.rankingPosition || '--'}`, icon: 'trophy', color: '#f59e0b', sub: 'Global position' },
    { label: 'Followers', value: `${((profile?.followersCount || 0) / 1000).toFixed(1)}k`, icon: 'account-multiple', color: '#3b82f6', sub: 'Total followers' },
    { label: 'Total Gifts', value: String(profile?.totalGiftsReceived || 0), icon: 'gift', color: '#a855f7', sub: 'All time' },
    { label: 'Earnings', value: `$${(profile?.totalEarnings || 0).toFixed(0)}`, icon: 'cash', color: '#10b981', sub: 'Total earned' },
  ];

  const leftContent = (
    <View style={styles.leftContainer}>
      <Text style={styles.panelTitle}>Recent Deals</Text>
      <TouchableOpacity
        style={styles.viewAllBtn}
        onPress={() => navigation.navigate('DJDeals')}
        activeOpacity={0.7}
      >
        <Text style={styles.viewAllText}>View All</Text>
        <MaterialCommunityIcons name="chevron-right" size={16} color="#a855f7" />
      </TouchableOpacity>
      <FlatList
        data={deals.slice(0, 8)}
        keyExtractor={(d) => d.id}
        scrollEnabled={false}
        renderItem={({ item }) => (
          <Card style={styles.dealCard} outlined>
            <View style={styles.dealRow}>
              <View style={styles.dealInfo}>
                <Text style={styles.dealVenue} numberOfLines={1}>{item.venueName}</Text>
                <Text style={styles.dealDate}>{new Date(item.eventDate).toLocaleDateString()}</Text>
              </View>
              <View style={styles.dealRight}>
                <Text style={styles.dealAmount}>${item.proposedAmount}</Text>
                <Badge
                  label={item.status.toUpperCase()}
                  color={dealStatusColors[item.status] || '#6b7280'}
                  small
                />
              </View>
            </View>
          </Card>
        )}
        ListEmptyComponent={
          <View style={styles.emptyDeals}>
            <Text style={styles.emptyText}>No deals yet</Text>
          </View>
        }
        contentContainerStyle={{ gap: 6, paddingTop: 12 }}
      />
    </View>
  );

  const rightContent = (
    <View style={styles.rightContainer}>
      <Text style={styles.panelTitle}>Analytics Overview</Text>
      <TouchableOpacity
        style={styles.viewAllBtn}
        onPress={() => navigation.navigate('DJAnalytics')}
        activeOpacity={0.7}
      >
        <Text style={styles.viewAllText}>Full Analytics</Text>
        <MaterialCommunityIcons name="chevron-right" size={16} color="#a855f7" />
      </TouchableOpacity>
      <View style={styles.analyticsChart}>
        <MaterialCommunityIcons name="chart-line" size={48} color="#a855f730" />
        <Text style={styles.chartPlaceholder}>Analytics chart visualization</Text>
        <Text style={styles.chartSub}>Tap "Full Analytics" for detailed data</Text>
      </View>
      <View style={styles.quickStats}>
        {Object.entries(analytics).slice(0, 4).map(([key, val]) => (
          <View key={key} style={styles.quickStat}>
            <Text style={styles.quickStatValue}>{String(val)}</Text>
            <Text style={styles.quickStatLabel}>{key.replace(/_/g, ' ')}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.root}>
      <PageHeader
        title="DJ Dashboard"
        subtitle={profile?.stageName}
        actions={[
          { icon: 'home', onPress: () => navigation.dispatch(DrawerActions.jumpTo('HomeStack' as any)) },
          { icon: 'cog', onPress: () => {} },
        ]}
      />

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor="#a855f7" />}
        stickyHeaderIndices={[0]}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Grid - 2x2 */}
        <View style={styles.statsGrid}>
          <View style={styles.statsRow}>
            <StatCard {...stats[0]} />
            <StatCard {...stats[1]} />
          </View>
          <View style={styles.statsRow}>
            <StatCard {...stats[2]} />
            <StatCard {...stats[3]} />
          </View>
        </View>

        {/* Quick Nav Buttons */}
        <View style={styles.quickNav}>
          {[
            { label: 'Analytics', icon: 'chart-bar', screen: 'DJAnalytics' as const },
            { label: 'My Sets', icon: 'music-box', screen: 'DJSets' as const },
            { label: 'Deals', icon: 'handshake', screen: 'DJDeals' as const },
          ].map((item) => (
            <TouchableOpacity
              key={item.label}
              style={styles.quickNavBtn}
              onPress={() => navigation.navigate(item.screen)}
              activeOpacity={0.75}
            >
              <MaterialCommunityIcons name={item.icon as any} size={22} color="#a855f7" />
              <Text style={styles.quickNavLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* TwoPane */}
        <View style={styles.twoPane}>
          <TwoPane
            leftContent={leftContent}
            rightContent={rightContent}
            leftFlex={2}
            rightFlex={3}
            scrollLeft={false}
            scrollRight={false}
          />
        </View>
      </ScrollView>

      <FAB
        icon="broadcast"
        label="Go Live"
        onPress={() => {}}
        color="#ef4444"
      />

      <Snackbar message={snackbar} visible={!!snackbar} onDismiss={() => setSnackbar('')} type="error" />
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0a0a0f' },
  content: { flex: 1 },
  statsGrid: {
    gap: 8, padding: 12, paddingBottom: 6,
    backgroundColor: '#0a0a0f',
  },
  statsRow: { flexDirection: 'row', gap: 8 },
  statCard: { flex: 1, gap: 4, alignItems: 'flex-start', borderWidth: 1, padding: 10 },
  statIcon: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '800' },
  statLabel: { color: '#9ca3af', fontSize: 11, fontWeight: '600' },
  statSub: { color: '#4b5563', fontSize: 10 },
  quickNav: {
    flexDirection: 'row', gap: 10, paddingHorizontal: 16,
    paddingBottom: 12, paddingTop: 4,
  },
  quickNavBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#12121a', borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: '#1e1e2e',
  },
  quickNavLabel: { color: '#e5e7eb', fontSize: 13, fontWeight: '600' },
  twoPane: { minHeight: 400 },
  leftContainer: { padding: 4 },
  rightContainer: { padding: 4 },
  panelTitle: { color: '#f3f4f6', fontSize: 16, fontWeight: '700' },
  viewAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 4 },
  viewAllText: { color: '#a855f7', fontSize: 12, fontWeight: '600' },
  dealCard: { padding: 12 },
  dealRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dealInfo: { flex: 1, gap: 2 },
  dealVenue: { color: '#f3f4f6', fontSize: 13, fontWeight: '600' },
  dealDate: { color: '#6b7280', fontSize: 11 },
  dealRight: { alignItems: 'flex-end', gap: 4 },
  dealAmount: { color: '#10b981', fontSize: 14, fontWeight: '700' },
  emptyDeals: { paddingVertical: 24, alignItems: 'center' },
  emptyText: { color: '#4b5563', fontSize: 13 },
  analyticsChart: {
    height: 180, backgroundColor: '#12121a', borderRadius: 14,
    justifyContent: 'center', alignItems: 'center', gap: 8,
    marginTop: 16, borderWidth: 1, borderColor: '#1e1e2e',
  },
  chartPlaceholder: { color: '#374151', fontSize: 14 },
  chartSub: { color: '#4b5563', fontSize: 12 },
  quickStats: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 },
  quickStat: { flex: 1, minWidth: 100, backgroundColor: '#12121a', borderRadius: 10, padding: 12, gap: 4 },
  quickStatValue: { color: '#f3f4f6', fontSize: 16, fontWeight: '700' },
  quickStatLabel: { color: '#6b7280', fontSize: 10, textTransform: 'capitalize' },
});

export default DJDashboardScreen;
