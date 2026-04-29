import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/common/Header';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
  getAdminReports,
  getAdminCommissions,
  getAdminPayouts,
  getAdCampaigns,
  updatePayoutRequest,
  moderateItem,
  AdminReports,
  CommissionEntry,
  PayoutRequest,
  AdCampaign,
} from '../../api/admin';
import { useAuth } from '../../context/AuthContext';

type Tab = 'reports' | 'commissions' | 'payouts' | 'ads';

const TAB_LABELS: Record<Tab, string> = {
  reports: 'Moderation',
  commissions: 'Commissions',
  payouts: 'Payouts',
  ads: 'Ads',
};

const AdminScreen: React.FC = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('reports');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reports, setReports] = useState<AdminReports | null>(null);
  const [commissions, setCommissions] = useState<CommissionEntry[]>([]);
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [ads, setAds] = useState<AdCampaign[]>([]);

  const isAdmin = user?.role === 'admin';

  const load = async () => {
    if (!isAdmin) return;
    try {
      const [r, c, p, a] = await Promise.all([
        getAdminReports().catch(() => null),
        getAdminCommissions().catch(() => ({ commissions: [] })),
        getAdminPayouts('pending').catch(() => []),
        getAdCampaigns().catch(() => []),
      ]);
      setReports(r);
      setCommissions(c.commissions ?? []);
      setPayouts(p);
      setAds(a);
    } catch {
      // noop
    }
  };

  useEffect(() => { load().finally(() => setLoading(false)); }, []);

  const refresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleUnhide = async (itemId: string, itemType: 'comment' | 'forumPost' | 'review') => {
    try {
      await moderateItem(itemId, itemType, false);
      await load();
      Alert.alert('Restored', 'Item is now visible again.');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error ?? 'Could not restore item.');
    }
  };

  const handlePayoutAction = async (id: string, action: 'approve' | 'reject' | 'mark_paid') => {
    try {
      await updatePayoutRequest(id, action);
      await load();
      Alert.alert('Updated', `Payout ${action.replace('_', ' ')}.`);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error ?? 'Could not update payout.');
    }
  };

  if (!isAdmin) {
    return (
      <SafeAreaView style={styles.safe}>
        <Header title="Admin" showBack />
        <View style={styles.empty}>
          <Ionicons name="lock-closed-outline" size={32} color="#4b5563" />
          <Text style={styles.emptyText}>Admin access required.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) return <LoadingSpinner message="Loading admin..." />;

  return (
    <SafeAreaView style={styles.safe}>
      <Header title="Admin" subtitle="Platform tools" showBack />

      <View style={styles.tabs}>
        {(Object.keys(TAB_LABELS) as Tab[]).map((t) => (
          <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{TAB_LABELS[t]}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#a855f7" />}
        showsVerticalScrollIndicator={false}
      >
        {tab === 'reports' && reports && (
          <>
            <View style={styles.statsRow}>
              <Stat label="Hidden Comments" value={reports.summary.totalHiddenComments} />
              <Stat label="Hidden Posts" value={reports.summary.totalHiddenForumPosts} />
              <Stat label="Hidden Reviews" value={reports.summary.totalHiddenReviews} />
            </View>

            <Section title="Hidden Comments" data={reports.hiddenComments} renderItem={(item: any) => (
              <ItemRow
                key={item.id}
                title={item.content?.slice(0, 80) ?? 'Comment'}
                subtitle={item.user?.name ?? item.user?.email ?? 'User'}
                action="Restore"
                onPress={() => handleUnhide(item.id, 'comment')}
              />
            )} />

            <Section title="Hidden Forum Posts" data={reports.hiddenForumPosts} renderItem={(item: any) => (
              <ItemRow
                key={item.id}
                title={item.content?.slice(0, 80) ?? 'Post'}
                subtitle={`${item.thread?.title ?? 'Thread'} · ${item.user?.name ?? item.user?.email ?? 'User'}`}
                action="Restore"
                onPress={() => handleUnhide(item.id, 'forumPost')}
              />
            )} />

            <Section title="Hidden Reviews" data={reports.hiddenReviews} renderItem={(item: any) => (
              <ItemRow
                key={item.id}
                title={item.content?.slice(0, 80) ?? 'Review'}
                subtitle={`${item.rating ?? 0}★ · ${item.user?.name ?? item.user?.email ?? 'User'}`}
                action="Restore"
                onPress={() => handleUnhide(item.id, 'review')}
              />
            )} />
          </>
        )}

        {tab === 'commissions' && (
          <>
            {commissions.length === 0 ? (
              <EmptyPanel text="No commission data." />
            ) : (
              commissions.map((c) => (
                <View key={c.type} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.title}>{c.type.replace('_', ' ')}</Text>
                    <Text style={styles.amount}>{(c.rate * 100).toFixed(1)}%</Text>
                  </View>
                  <Text style={styles.meta}>Effective {new Date(c.effectiveAt).toLocaleDateString()}</Text>
                  {c.commissionTotal !== undefined ? (
                    <Text style={styles.meta}>Total earned: ${c.commissionTotal.toFixed(2)} ({c.transactionCount ?? 0} tx)</Text>
                  ) : null}
                </View>
              ))
            )}
          </>
        )}

        {tab === 'payouts' && (
          <>
            {payouts.length === 0 ? (
              <EmptyPanel text="No pending payout requests." />
            ) : (
              payouts.map((p) => (
                <View key={p.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.title}>{p.user?.name ?? p.user?.email ?? p.userId}</Text>
                      <Text style={styles.meta}>{new Date(p.createdAt).toLocaleDateString()} · {p.status}</Text>
                    </View>
                    <Text style={styles.amount}>{p.currency} {p.amount.toFixed(2)}</Text>
                  </View>
                  <View style={styles.actionRow}>
                    <TouchableOpacity style={[styles.actionBtn, styles.approveBtn]} onPress={() => handlePayoutAction(p.id, 'approve')}>
                      <Text style={styles.approveText}>Approve</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionBtn, styles.rejectBtn]} onPress={() => handlePayoutAction(p.id, 'reject')}>
                      <Text style={styles.rejectText}>Reject</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionBtn, styles.paidBtn]} onPress={() => handlePayoutAction(p.id, 'mark_paid')}>
                      <Text style={styles.paidText}>Mark Paid</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </>
        )}

        {tab === 'ads' && (
          <>
            {ads.length === 0 ? (
              <EmptyPanel text="No ad campaigns yet." />
            ) : (
              ads.map((ad) => (
                <View key={ad.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.title}>{ad.title}</Text>
                      <Text style={styles.meta}>{ad.status}</Text>
                    </View>
                    <Text style={styles.amount}>${ad.spent.toFixed(0)} / ${ad.budget.toFixed(0)}</Text>
                  </View>
                  {ad.description ? <Text style={styles.desc} numberOfLines={2}>{ad.description}</Text> : null}
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const Stat = ({ label, value }: { label: string; value: number }) => (
  <View style={styles.stat}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const Section = ({ title, data, renderItem }: { title: string; data: any[]; renderItem: (item: any) => React.ReactNode }) => (
  <View style={{ gap: 8 }}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {data.length === 0 ? <EmptyPanel text="Nothing here." /> : data.map(renderItem)}
  </View>
);

const ItemRow = ({ title, subtitle, action, onPress }: { title: string; subtitle: string; action: string; onPress: () => void }) => (
  <View style={styles.card}>
    <View style={{ flex: 1 }}>
      <Text style={styles.title} numberOfLines={2}>{title}</Text>
      <Text style={styles.meta}>{subtitle}</Text>
    </View>
    <TouchableOpacity style={styles.restoreBtn} onPress={onPress}>
      <Text style={styles.restoreText}>{action}</Text>
    </TouchableOpacity>
  </View>
);

const EmptyPanel = ({ text }: { text: string }) => (
  <View style={styles.empty}>
    <Ionicons name="checkmark-circle-outline" size={28} color="#4b5563" />
    <Text style={styles.emptyText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0a0a0f' },
  tabs: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, gap: 8, borderBottomWidth: 1, borderBottomColor: '#1f1f2e' },
  tab: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: '#12121a', borderWidth: 1, borderColor: '#1f1f2e' },
  tabActive: { borderColor: '#a855f7', backgroundColor: 'rgba(168,85,247,0.12)' },
  tabText: { color: '#9ca3af', fontSize: 12, fontWeight: '700' },
  tabTextActive: { color: '#a855f7' },
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  empty: { alignItems: 'center', padding: 32, gap: 8 },
  emptyText: { color: '#6b7280', fontSize: 13 },
  statsRow: { flexDirection: 'row', gap: 8 },
  stat: { flex: 1, backgroundColor: '#12121a', borderRadius: 12, borderWidth: 1, borderColor: '#1f1f2e', padding: 12, alignItems: 'center' },
  statValue: { color: '#fff', fontSize: 22, fontWeight: '900' },
  statLabel: { color: '#6b7280', fontSize: 11, marginTop: 2, textAlign: 'center' },
  sectionTitle: { color: '#fff', fontSize: 13, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 6 },
  card: { backgroundColor: '#12121a', borderRadius: 14, borderWidth: 1, borderColor: '#1f1f2e', padding: 14, gap: 8, flexDirection: 'row', alignItems: 'flex-start' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  title: { color: '#fff', fontSize: 14, fontWeight: '700', flex: 1 },
  meta: { color: '#6b7280', fontSize: 11, marginTop: 2 },
  amount: { color: '#10b981', fontSize: 14, fontWeight: '900' },
  desc: { color: '#9ca3af', fontSize: 12, lineHeight: 17 },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  actionBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', borderWidth: 1 },
  approveBtn: { borderColor: '#10b98155', backgroundColor: 'rgba(16,185,129,0.1)' },
  approveText: { color: '#10b981', fontSize: 12, fontWeight: '900' },
  rejectBtn: { borderColor: '#ef444455', backgroundColor: 'rgba(239,68,68,0.1)' },
  rejectText: { color: '#ef4444', fontSize: 12, fontWeight: '900' },
  paidBtn: { borderColor: '#3b82f655', backgroundColor: 'rgba(59,130,246,0.1)' },
  paidText: { color: '#3b82f6', fontSize: 12, fontWeight: '900' },
  restoreBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: '#06b6d455', backgroundColor: 'rgba(6,182,212,0.1)' },
  restoreText: { color: '#67e8f9', fontSize: 11, fontWeight: '900' },
});

export default AdminScreen;
