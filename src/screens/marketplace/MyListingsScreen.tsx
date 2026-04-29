import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/common/Header';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { getMyListings } from '../../api/marketplace';

const MyListingsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      setListings(await getMyListings());
    } catch {
      setListings([]);
    }
  };

  useEffect(() => { load().finally(() => setLoading(false)); }, []);

  const refresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  if (loading) return <LoadingSpinner message="Loading listings..." />;

  return (
    <SafeAreaView style={styles.safe}>
      <Header title="My Listings" subtitle="Products you sell" showBack />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#a855f7" />}
        showsVerticalScrollIndicator={false}
      >
        {listings.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="storefront-outline" size={32} color="#4b5563" />
            <Text style={styles.emptyText}>No listings yet.</Text>
            <Text style={styles.emptyHint}>Create products from the web app to see them here.</Text>
          </View>
        ) : (
          listings.map((item: any) => (
            <TouchableOpacity
              key={String(item.id)}
              style={styles.card}
              onPress={() => navigation.navigate('ProductDetail', { productId: String(item.id) })}
              activeOpacity={0.85}
            >
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.title} numberOfLines={1}>{item.title ?? item.name}</Text>
                  <Text style={styles.meta}>{item.category ?? 'Product'} · {new Date(item.createdAt).toLocaleDateString()}</Text>
                </View>
                <Text style={styles.price}>${Number(item.price ?? 0).toFixed(2)}</Text>
              </View>
              {item.description ? <Text style={styles.desc} numberOfLines={2}>{item.description}</Text> : null}
              <View style={styles.statsRow}>
                <Stat label="Sold" value={item.salesCount ?? 0} />
                <Stat label="Inventory" value={item.inventory ?? '∞'} />
                <Stat label="Status" value={item.status ?? 'active'} />
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const Stat = ({ label, value }: { label: string; value: any }) => (
  <View style={styles.stat}>
    <Text style={styles.statValue}>{String(value)}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0a0a0f' },
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  empty: { alignItems: 'center', padding: 32, gap: 8 },
  emptyText: { color: '#6b7280', fontSize: 13 },
  emptyHint: { color: '#4b5563', fontSize: 12, textAlign: 'center', maxWidth: 240 },
  card: { backgroundColor: '#12121a', borderRadius: 16, borderWidth: 1, borderColor: '#1f1f2e', padding: 14, gap: 10 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { color: '#fff', fontSize: 14, fontWeight: '900' },
  meta: { color: '#6b7280', fontSize: 11, marginTop: 2 },
  price: { color: '#10b981', fontSize: 15, fontWeight: '900' },
  desc: { color: '#9ca3af', fontSize: 13, lineHeight: 18 },
  statsRow: { flexDirection: 'row', gap: 8 },
  stat: { flex: 1, backgroundColor: '#0a0a0f', borderRadius: 10, borderWidth: 1, borderColor: '#1f1f2e', padding: 8, alignItems: 'center' },
  statValue: { color: '#fff', fontSize: 14, fontWeight: '900' },
  statLabel: { color: '#6b7280', fontSize: 10, marginTop: 2 },
});

export default MyListingsScreen;
