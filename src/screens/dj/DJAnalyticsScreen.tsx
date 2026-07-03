import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import PageHeader from '../../components/layout/PageHeader';
import Card from '../../components/common/Card';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Snackbar from '../../components/common/Snackbar';
import { getDJAnalytics } from '../../api/dj';
import { DJAnalytics } from '../../types';

const PERIODS = ['7d', '30d', '90d', '1y'];

const AnalyticCard: React.FC<{ label: string; value: string; icon: string; color: string; change?: string }> = ({
  label, value, icon, color, change,
}) => {
  const isPositive = change ? change.startsWith('+') : true;
  const showChange = Boolean(change) && change !== '—' && change !== '0%';
  return (
    <Card style={[styles.analyticCard, { borderColor: `${color}25` }]}>
      <View style={styles.cardTop}>
        <View style={[styles.cardIcon, { backgroundColor: `${color}20` }]}>
          <MaterialCommunityIcons name={icon as any} size={20} color={color} />
        </View>
        {showChange && (
          <View style={[styles.changeBadge, { backgroundColor: isPositive ? '#064e3b50' : '#7f1d1d50' }]}>
            <MaterialCommunityIcons
              name={isPositive ? 'trending-up' : 'trending-down'}
              size={12}
              color={isPositive ? '#10b981' : '#ef4444'}
            />
            <Text style={[styles.changeText, { color: isPositive ? '#10b981' : '#ef4444' }]}>
              {change}
            </Text>
          </View>
        )}
      </View>
      <Text style={[styles.cardValue, { color }]}>{value}</Text>
      <Text style={styles.cardLabel}>{label}</Text>
    </Card>
  );
};

const DJAnalyticsScreen: React.FC = () => {
  const navigation = useNavigation();
  const [analytics, setAnalytics] = useState<DJAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [snackbar, setSnackbar] = useState('');

  const fetchAnalytics = async (period: string) => {
    try {
      const data = await getDJAnalytics(period);
      setAnalytics(data);
    } catch {
      setSnackbar('Failed to load analytics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchAnalytics(selectedPeriod); }, [selectedPeriod]);

  if (loading) return <LoadingSpinner fullScreen />;

  const ch = analytics?.changes ?? {};
  const analyticsCards = [
    { label: 'Total Streams',  value: String(analytics?.totalStreams ?? 0),                          icon: 'broadcast',    color: '#ef4444', change: ch.totalStreams },
    { label: 'Total Views',    value: Number(analytics?.totalViews ?? 0).toLocaleString(),            icon: 'eye',          color: '#3b82f6', change: ch.totalViews },
    { label: 'Earnings',       value: `$${Number(analytics?.earnings ?? 0).toFixed(2)}`,              icon: 'cash',         color: '#a855f7', change: ch.earnings },
    { label: 'New Followers',  value: String(analytics?.newFollowers ?? 0),                          icon: 'account-plus', color: '#10b981', change: ch.newFollowers },
    { label: 'Set Sales',      value: String(analytics?.setsSold ?? 0),                              icon: 'music-note',   color: '#f59e0b', change: ch.setsSold },
    { label: 'Booking Deals',  value: String(analytics?.bookingDeals ?? 0),                          icon: 'handshake',    color: '#06b6d4', change: ch.bookingDeals },
  ];

  return (
    <View style={styles.root}>
      <PageHeader
        title="Analytics"
        subtitle="Performance metrics"
        showBack
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAnalytics(selectedPeriod); }} tintColor="#a855f7" />}
        showsVerticalScrollIndicator={false}
      >
        {/* Period Selector */}
        <View style={styles.periodRow}>
          {PERIODS.map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.periodBtn, selectedPeriod === p && styles.periodBtnActive]}
              onPress={() => setSelectedPeriod(p)}
              activeOpacity={0.7}
            >
              <Text style={[styles.periodText, selectedPeriod === p && styles.periodTextActive]}>
                {p}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 3x2 Stats Grid */}
        <View style={styles.statsGrid}>
          {analyticsCards.map((card) => (
            <View key={card.label} style={styles.cardWrap}>
              <AnalyticCard {...card} />
            </View>
          ))}
        </View>

        {/* Ranking History Chart */}
        <Card style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <MaterialCommunityIcons name="chart-timeline-variant" size={18} color="#a855f7" />
            <Text style={styles.chartTitle}>Ranking History</Text>
          </View>
          <View style={styles.chartArea}>
            <MaterialCommunityIcons name="chart-line" size={40} color="#a855f720" />
            <Text style={styles.chartPlaceholder}>Ranking trend visualization</Text>
            <Text style={styles.chartSub}>Showing {selectedPeriod} period data</Text>
          </View>
        </Card>

        {/* Top Events */}
        <Card style={styles.topEventsCard}>
          <View style={styles.chartHeader}>
            <MaterialCommunityIcons name="calendar-star" size={18} color="#f59e0b" />
            <Text style={styles.chartTitle}>Top Performing Events</Text>
          </View>
          {analytics?.topEvents && analytics.topEvents.length > 0 ? (
            analytics.topEvents.map((e, i) => (
              <View key={i} style={styles.eventRow}>
                <View style={styles.eventRank}>
                  <Text style={styles.eventRankNum}>{i + 1}</Text>
                </View>
                <View style={styles.eventInfo}>
                  <Text style={styles.eventName}>{e.name || `Event ${i + 1}`}</Text>
                  <Text style={styles.eventDate}>{e.date || 'Recent'}</Text>
                </View>
                <Text style={styles.eventRevenue}>{e.checkIns ?? e.revenue ?? 0} check-ins</Text>
              </View>
            ))
          ) : (
            <Text style={styles.noDataText}>No event data for this period</Text>
          )}
        </Card>
      </ScrollView>

      <Snackbar message={snackbar} visible={!!snackbar} onDismiss={() => setSnackbar('')} type="error" />
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0a0a0f' },
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  periodRow: { flexDirection: 'row', gap: 8 },
  periodBtn: {
    paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20,
    backgroundColor: '#12121a', borderWidth: 1, borderColor: '#1e1e2e',
  },
  periodBtnActive: { backgroundColor: 'rgba(168,85,247,0.2)', borderColor: '#a855f7' },
  periodText: { color: '#6b7280', fontSize: 13, fontWeight: '600' },
  periodTextActive: { color: '#a855f7' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  cardWrap: { width: '31%', flexGrow: 1 },
  analyticCard: { borderWidth: 1, gap: 8 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardIcon: { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  changeBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3 },
  changeText: { fontSize: 11, fontWeight: '700' },
  cardValue: { fontSize: 22, fontWeight: '800' },
  cardLabel: { color: '#6b7280', fontSize: 12, fontWeight: '500' },
  chartCard: { gap: 12 },
  chartHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  chartTitle: { color: '#e5e7eb', fontSize: 15, fontWeight: '700' },
  chartArea: {
    height: 160, backgroundColor: '#0a0a0f', borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', gap: 6,
    borderWidth: 1, borderColor: '#1a1a2e',
  },
  chartPlaceholder: { color: '#374151', fontSize: 14 },
  chartSub: { color: '#4b5563', fontSize: 12 },
  topEventsCard: { gap: 12 },
  eventRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#1a1a2e',
  },
  eventRank: { width: 28, height: 28, borderRadius: 8, backgroundColor: '#1a1a2e', justifyContent: 'center', alignItems: 'center' },
  eventRankNum: { color: '#9ca3af', fontSize: 13, fontWeight: '700' },
  eventInfo: { flex: 1 },
  eventName: { color: '#f3f4f6', fontSize: 13, fontWeight: '600' },
  eventDate: { color: '#6b7280', fontSize: 11, marginTop: 2 },
  eventRevenue: { color: '#10b981', fontSize: 14, fontWeight: '700' },
  noDataText: { color: '#4b5563', fontSize: 13, textAlign: 'center', paddingVertical: 16 },
});

export default DJAnalyticsScreen;
