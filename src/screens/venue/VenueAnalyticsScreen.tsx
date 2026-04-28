import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getVenueAnalytics } from '../../api/rankings';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Header from '../../components/common/Header';

const PERIODS = ['7d', '30d', '90d', '1y'];

interface AnalyticCardProps {
  label: string;
  value: string;
  iconName: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
  change?: string;
}

const AnalyticCard: React.FC<AnalyticCardProps> = ({ label, value, iconName, color, change }) => {
  const isPositive = change ? !change.startsWith('-') : true;
  return (
    <View style={[styles.statCard, { borderColor: color + '25' }]}>
      <View style={styles.cardTop}>
        <View style={[styles.cardIcon, { backgroundColor: color + '20' }]}>
          <Ionicons name={iconName} size={18} color={color} />
        </View>
        {change && change !== '0%' && (
          <View style={[styles.changeBadge, { backgroundColor: isPositive ? '#064e3b50' : '#7f1d1d50' }]}>
            <Ionicons
              name={isPositive ? 'trending-up' : 'trending-down'}
              size={11}
              color={isPositive ? '#10b981' : '#ef4444'}
            />
            <Text style={[styles.changeText, { color: isPositive ? '#10b981' : '#ef4444' }]}>
              {change}
            </Text>
          </View>
        )}
      </View>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
};

const VenueAnalyticsScreen: React.FC = () => {
  const [analytics, setAnalytics] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [error, setError] = useState('');

  const fetchAnalytics = async (period: string) => {
    try {
      const data = await getVenueAnalytics(period);
      setAnalytics(data);
      setError('');
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 404) {
        setAnalytics({});
        setError('');
      } else if (status === 401) {
        setError('Session expired. Please log in again.');
      } else {
        setError(`Failed to load analytics (${status ?? 'network error'})`);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchAnalytics(selectedPeriod); }, [selectedPeriod]);

  if (loading) return <LoadingSpinner message="Loading analytics..." />;

  const ch = (analytics.changes as Record<string, string>) ?? {};

  const analyticsCards: AnalyticCardProps[] = [
    { label: 'Check-ins',      value: String(analytics.totalCheckIns ?? 0),  iconName: 'checkmark-circle-outline', color: '#10b981', change: ch.totalCheckIns },
    { label: 'RSVPs',          value: String(analytics.totalRsvps ?? 0),      iconName: 'ticket-outline',            color: '#3b82f6', change: ch.totalRsvps },
    { label: 'Events Created', value: String(analytics.eventsCreated ?? 0),   iconName: 'calendar-outline',          color: '#a855f7', change: ch.eventsCreated },
    { label: 'Active Deals',   value: String(analytics.activeDeals ?? 0),     iconName: 'briefcase-outline',         color: '#f59e0b', change: ch.activeDeals },
    { label: 'New Followers',  value: String(analytics.newFollowers ?? 0),    iconName: 'people-outline',            color: '#ef4444', change: ch.newFollowers },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <Header title="Venue Analytics" showBack />
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchAnalytics(selectedPeriod); }}
            tintColor="#a855f7"
            colors={['#a855f7']}
          />
        }
      >
        {error ? (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle-outline" size={16} color="#ef4444" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

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

        <View style={styles.statsGrid}>
          {analyticsCards.map((card) => (
            <AnalyticCard key={card.label} {...card} />
          ))}
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="calendar-outline" size={16} color="#f59e0b" />
            <Text style={styles.cardTitle}>Top Events by Check-ins</Text>
          </View>
          {analytics.topEvents && (analytics.topEvents as any[]).length > 0 ? (
            (analytics.topEvents as any[]).map((e: any, i: number) => (
              <View key={i} style={styles.eventRow}>
                <View style={styles.eventRank}>
                  <Text style={styles.eventRankNum}>{i + 1}</Text>
                </View>
                <View style={styles.eventInfo}>
                  <Text style={styles.eventName}>{e.name || `Event ${i + 1}`}</Text>
                  <Text style={styles.eventDate}>{e.date || 'Recent'}</Text>
                </View>
                <Text style={styles.eventRevenue}>{e.revenue ?? 0} check-ins</Text>
              </View>
            ))
          ) : (
            <Text style={styles.noDataText}>No event data for this period</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0a0a0f' },
  container: { padding: 16, paddingBottom: 40, gap: 14 },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#2d0a0a',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#7f1d1d',
  },
  errorText: { color: '#fca5a5', fontSize: 13 },
  periodRow: { flexDirection: 'row', gap: 8 },
  periodBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#12121a',
    borderWidth: 1,
    borderColor: '#1f1f2e',
  },
  periodBtnActive: { backgroundColor: 'rgba(168,85,247,0.2)', borderColor: '#a855f7' },
  periodText: { color: '#6b7280', fontSize: 13, fontWeight: '600' },
  periodTextActive: { color: '#a855f7' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: {
    width: '47%',
    flexGrow: 1,
    backgroundColor: '#12121a',
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 6,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  changeText: { fontSize: 11, fontWeight: '700' },
  statValue: { fontSize: 20, fontWeight: '800' },
  statLabel: { color: '#6b7280', fontSize: 12 },
  card: {
    backgroundColor: '#12121a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1f1f2e',
    padding: 16,
    gap: 12,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { color: '#e5e7eb', fontSize: 15, fontWeight: '700' },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a2e',
  },
  eventRank: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventRankNum: { color: '#9ca3af', fontSize: 13, fontWeight: '700' },
  eventInfo: { flex: 1 },
  eventName: { color: '#f3f4f6', fontSize: 13, fontWeight: '600' },
  eventDate: { color: '#6b7280', fontSize: 11, marginTop: 2 },
  eventRevenue: { color: '#10b981', fontSize: 14, fontWeight: '700' },
  noDataText: { color: '#4b5563', fontSize: 13, textAlign: 'center', paddingVertical: 12 },
});

export default VenueAnalyticsScreen;
