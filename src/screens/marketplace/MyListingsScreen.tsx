import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/common/Header';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { getMyListings, createMarketplaceProduct } from '../../api/marketplace';

const CATEGORIES = ['music', 'merch', 'service', 'other'];
const PRODUCT_TYPES: Array<'digital' | 'physical' | 'service'> = ['digital', 'physical', 'service'];

const MyListingsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [category, setCategory] = useState('music');
  const [productType, setProductType] = useState<'digital' | 'physical' | 'service'>('digital');
  const [saving, setSaving] = useState(false);

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

  const submit = async () => {
    if (saving) return; // re-entrancy guard
    const priceNum = Number(price);
    if (!title.trim() || !Number.isFinite(priceNum) || priceNum < 0) {
      Alert.alert('Invalid input', 'Title and a non-negative price are required.');
      return;
    }
    setSaving(true);
    try {
      await createMarketplaceProduct({
        title: title.trim(),
        price: priceNum,
        description: description.trim() || undefined,
        coverImage: coverImage.trim() || undefined,
        category,
        productType,
      });
      setTitle(''); setPrice(''); setDescription(''); setCoverImage(''); setCategory('music'); setProductType('digital');
      setModalVisible(false);
      await load();
      Alert.alert('Listed', 'Your product is now live.');
    } catch (err: any) {
      Alert.alert('Could not create product', err?.response?.data?.error ?? 'Please try again.');
    } finally {
      setSaving(false);
    }
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
        <TouchableOpacity style={styles.createBtn} onPress={() => setModalVisible(true)}>
          <Ionicons name="add-circle-outline" size={20} color="#fff" />
          <Text style={styles.createBtnText}>Create Product</Text>
        </TouchableOpacity>

        {listings.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="storefront-outline" size={32} color="#4b5563" />
            <Text style={styles.emptyText}>No listings yet.</Text>
            <Text style={styles.emptyHint}>Tap Create Product to add your first listing.</Text>
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

      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Product</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.modalBody}>
              <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Title" placeholderTextColor="#4b5563" />
              <TextInput style={styles.input} value={price} onChangeText={setPrice} placeholder="Price" placeholderTextColor="#4b5563" keyboardType="decimal-pad" />
              <TextInput style={[styles.input, { minHeight: 80 }]} value={description} onChangeText={setDescription} placeholder="Description" placeholderTextColor="#4b5563" multiline textAlignVertical="top" />
              <TextInput style={styles.input} value={coverImage} onChangeText={setCoverImage} placeholder="Cover image URL (optional)" placeholderTextColor="#4b5563" autoCapitalize="none" />
              <Text style={styles.label}>Category</Text>
              <View style={styles.chipRow}>
                {CATEGORIES.map((c) => (
                  <TouchableOpacity key={c} style={[styles.chip, category === c && styles.chipActive]} onPress={() => setCategory(c)}>
                    <Text style={[styles.chipText, category === c && styles.chipTextActive]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.label}>Type</Text>
              <View style={styles.chipRow}>
                {PRODUCT_TYPES.map((t) => (
                  <TouchableOpacity key={t} style={[styles.chip, productType === t && styles.chipActive]} onPress={() => setProductType(t)}>
                    <Text style={[styles.chipText, productType === t && styles.chipTextActive]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={submit} disabled={saving}>
                <Text style={styles.saveBtnText}>{saving ? 'Listing...' : 'List Product'}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  createBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#a855f7', borderRadius: 14, paddingVertical: 14 },
  createBtnText: { color: '#fff', fontSize: 14, fontWeight: '900' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', justifyContent: 'center', padding: 18 },
  modalCard: { maxHeight: '88%', backgroundColor: '#12121a', borderRadius: 18, borderWidth: 1, borderColor: '#263241', padding: 16 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: '900' },
  closeBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#1f1f2e', alignItems: 'center', justifyContent: 'center' },
  modalBody: { gap: 10 },
  input: { backgroundColor: '#0a0a0f', borderWidth: 1, borderColor: '#2d2d3d', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: '#fff', fontSize: 14 },
  label: { color: '#9ca3af', fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 4 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: '#2d2d3d', backgroundColor: '#0a0a0f' },
  chipActive: { borderColor: '#a855f7', backgroundColor: 'rgba(168,85,247,0.12)' },
  chipText: { color: '#9ca3af', fontSize: 12, fontWeight: '700' },
  chipTextActive: { color: '#a855f7' },
  saveBtn: { backgroundColor: '#a855f7', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 6 },
  saveBtnText: { color: '#fff', fontSize: 14, fontWeight: '900' },
});

export default MyListingsScreen;
