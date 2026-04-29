import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/common/Header';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { getMyOrders } from '../../api/marketplace';

const STATUS_COLORS: Record<string, string> = {
  paid: '#10b981',
  shipped: '#3b82f6',
  delivered: '#22c55e',
  completed: '#06b6d4',
  pending: '#f59e0b',
  refunded: '#ef4444',
};

const OrdersScreen: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      setOrders(await getMyOrders());
    } catch {
      setOrders([]);
    }
  };

  useEffect(() => { load().finally(() => setLoading(false)); }, []);

  const refresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  if (loading) return <LoadingSpinner message="Loading orders..." />;

  return (
    <SafeAreaView style={styles.safe}>
      <Header title="My Orders" subtitle="Marketplace history" showBack />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#a855f7" />}
        showsVerticalScrollIndicator={false}
      >
        {orders.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="bag-handle-outline" size={32} color="#4b5563" />
            <Text style={styles.emptyText}>No orders yet.</Text>
          </View>
        ) : (
          orders.map((order: any) => (
            <View key={String(order.id)} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.title} numberOfLines={1}>{order.product?.title ?? order.product?.name ?? 'Order'}</Text>
                  <Text style={styles.meta}>{new Date(order.createdAt).toLocaleDateString()}</Text>
                </View>
                <View style={[styles.statusBadge, { borderColor: (STATUS_COLORS[order.status] ?? '#6b7280') + '88', backgroundColor: (STATUS_COLORS[order.status] ?? '#6b7280') + '22' }]}>
                  <Text style={[styles.statusText, { color: STATUS_COLORS[order.status] ?? '#9ca3af' }]}>{order.status ?? 'pending'}</Text>
                </View>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Amount</Text>
                <Text style={styles.amount}>${Number(order.total ?? order.amount ?? 0).toFixed(2)}</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0a0a0f' },
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  empty: { alignItems: 'center', padding: 32, gap: 8 },
  emptyText: { color: '#6b7280', fontSize: 13 },
  card: { backgroundColor: '#12121a', borderRadius: 16, borderWidth: 1, borderColor: '#1f1f2e', padding: 14, gap: 10 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { color: '#fff', fontSize: 14, fontWeight: '900' },
  meta: { color: '#6b7280', fontSize: 11, marginTop: 2 },
  statusBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1 },
  statusText: { fontSize: 11, fontWeight: '900', textTransform: 'uppercase' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { color: '#6b7280', fontSize: 12 },
  amount: { color: '#10b981', fontSize: 16, fontWeight: '900' },
});

export default OrdersScreen;
