import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import PageHeader from '../../components/layout/PageHeader';
import FAB from '../../components/layout/FAB';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Avatar from '../../components/common/Avatar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import Snackbar from '../../components/common/Snackbar';
import ProductDetailScreen from './ProductDetailScreen';
import { getProducts } from '../../api/marketplace';
import { MarketplaceProduct } from '../../types';
import { useAuth } from '../../context/AuthContext';

const CATEGORIES = [
  { id: 'all', label: 'All', icon: 'view-grid' },
  { id: 'digital_set', label: 'DJ Sets', icon: 'music-note' },
  { id: 'sample_pack', label: 'Samples', icon: 'waveform' },
  { id: 'tutorial', label: 'Tutorials', icon: 'school' },
  { id: 'merchandise', label: 'Merch', icon: 'tshirt-crew' },
  { id: 'equipment', label: 'Equipment', icon: 'speaker' },
  { id: 'ticket', label: 'Tickets', icon: 'ticket' },
];

const categoryColors: Record<string, string> = {
  digital_set: '#a855f7', sample_pack: '#3b82f6', tutorial: '#10b981',
  merchandise: '#f59e0b', equipment: '#ec4899', ticket: '#06b6d4',
};

const ProductCard: React.FC<{
  product: MarketplaceProduct;
  onPress: () => void;
  isSelected?: boolean;
}> = ({ product, onPress, isSelected }) => (
  <TouchableOpacity
    style={[styles.productCard, isSelected && styles.productCardSelected]}
    onPress={onPress}
    activeOpacity={0.75}
  >
    <View style={[styles.productImage, { backgroundColor: `${categoryColors[product.category] || '#a855f7'}15` }]}>
      <MaterialCommunityIcons
        name={(CATEGORIES.find((c) => c.id === product.category)?.icon || 'package') as any}
        size={32}
        color={categoryColors[product.category] || '#a855f7'}
      />
    </View>
    <View style={styles.productInfo}>
      <Badge
        label={product.category.replace('_', ' ').toUpperCase()}
        color={categoryColors[product.category] || '#a855f7'}
        small
      />
      <Text style={styles.productTitle} numberOfLines={2}>{product.title}</Text>
      <View style={styles.productMeta}>
        <Avatar uri={product.sellerAvatarUrl} name={product.sellerName} size={18} />
        <Text style={styles.sellerName} numberOfLines={1}>{product.sellerName}</Text>
      </View>
      <View style={styles.productBottom}>
        <Text style={styles.productPrice}>${product.price.toFixed(2)}</Text>
        {product.rating !== undefined && (
          <View style={styles.ratingRow}>
            <MaterialCommunityIcons name="star" size={12} color="#f59e0b" />
            <Text style={styles.ratingText}>{product.rating.toFixed(1)}</Text>
          </View>
        )}
        <Text style={styles.salesText}>{product.totalSales} sold</Text>
      </View>
    </View>
    {isSelected && <View style={styles.selectedBar} />}
  </TouchableOpacity>
);

const MarketplaceScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<MarketplaceProduct | null>(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [snackbar, setSnackbar] = useState('');

  const fetchProducts = useCallback(async () => {
    try {
      const data = await getProducts(
        1, 30,
        activeCategory !== 'all' ? activeCategory : undefined,
        searchQuery || undefined
      );
      setProducts(data);
      if (data.length > 0 && !selectedProduct) setSelectedProduct(data[0]);
    } catch {
      setSnackbar('Failed to load marketplace');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeCategory, searchQuery]);

  useEffect(() => {
    setLoading(true);
    fetchProducts();
  }, [fetchProducts]);

  if (loading) return <LoadingSpinner fullScreen />;

  const leftContent = (
    <View style={styles.leftContainer}>
      {/* Search */}
      <View style={styles.searchBar}>
        <MaterialCommunityIcons name="magnify" size={18} color="#6b7280" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          placeholderTextColor="#4b5563"
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={fetchProducts}
          returnKeyType="search"
        />
      </View>

      {/* Categories */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.catRow}
      >
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[styles.catChip, activeCategory === cat.id && styles.catChipActive]}
            onPress={() => setActiveCategory(cat.id)}
            activeOpacity={0.75}
          >
            <MaterialCommunityIcons
              name={cat.icon as any}
              size={14}
              color={activeCategory === cat.id ? '#a855f7' : '#6b7280'}
            />
            <Text style={[styles.catLabel, activeCategory === cat.id && styles.catLabelActive]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Products Grid (3 cols) */}
      <FlatList
        data={products}
        keyExtractor={(p) => p.id}
        numColumns={3}
        columnWrapperStyle={styles.productRow}
        scrollEnabled={false}
        contentContainerStyle={{ paddingBottom: 20 }}
        renderItem={({ item }) => (
          <View style={styles.productWrap}>
            <ProductCard
              product={item}
              onPress={() => setSelectedProduct(item)}
              isSelected={selectedProduct?.id === item.id}
            />
          </View>
        )}
        ListEmptyComponent={
          <EmptyState icon="store-outline" title="No products found" />
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchProducts(); }} tintColor="#a855f7" />
        }
      />
    </View>
  );

  const rightContent = selectedProduct ? (
    <ProductDetailScreen productId={selectedProduct.id} productData={selectedProduct} />
  ) : (
    <EmptyState icon="package-variant" title="Select a product" message="Tap a product to view details" />
  );

  return (
    <View style={styles.root}>
      <PageHeader
        title="Marketplace"
        subtitle={`${products.length} products`}
        actions={[{ icon: 'home', onPress: () => navigation.dispatch(DrawerActions.jumpTo('HomeStack' as any)) }]}
      />
      <View style={styles.body}>
        <View style={styles.listPane}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchProducts(); }} tintColor="#a855f7" />}
          >
            {leftContent}
          </ScrollView>
        </View>
        <View style={styles.detailPane}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {rightContent}
          </ScrollView>
        </View>
      </View>

      {(user?.role === 'dj' || user?.role === 'venue_manager') && (
        <FAB icon="plus" label="New Listing" onPress={() => setSnackbar('Create listing coming soon')} />
      )}

      <Snackbar message={snackbar} visible={!!snackbar} onDismiss={() => setSnackbar('')} type="error" />
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0a0a0f' },
  body: { flex: 1, flexDirection: 'row' },
  listPane: { flex: 3, borderRightWidth: 1, borderRightColor: '#1e1e2e' },
  listContent: { padding: 12 },
  detailPane: { flex: 2 },
  leftContainer: { gap: 10 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#12121a', borderRadius: 10, borderWidth: 1, borderColor: '#1e1e2e',
    paddingHorizontal: 12, paddingVertical: 9,
  },
  searchInput: { flex: 1, color: '#f3f4f6', fontSize: 14 },
  catRow: { gap: 6, paddingBottom: 4 },
  catChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20,
    backgroundColor: '#1a1a2e', borderWidth: 1, borderColor: '#1e1e2e',
  },
  catChipActive: { backgroundColor: 'rgba(168,85,247,0.15)', borderColor: '#a855f7' },
  catLabel: { color: '#6b7280', fontSize: 12, fontWeight: '500' },
  catLabelActive: { color: '#a855f7', fontWeight: '600' },
  productRow: { gap: 8, marginBottom: 8 },
  productWrap: { flex: 1 },
  productCard: {
    backgroundColor: '#12121a', borderRadius: 12, overflow: 'hidden',
    borderWidth: 1, borderColor: '#1e1e2e', position: 'relative',
  },
  productCardSelected: { borderColor: '#a855f7', backgroundColor: '#12101f' },
  productImage: { height: 80, justifyContent: 'center', alignItems: 'center' },
  productInfo: { padding: 10, gap: 4 },
  productTitle: { color: '#f3f4f6', fontSize: 12, fontWeight: '600', lineHeight: 16 },
  productMeta: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  sellerName: { color: '#6b7280', fontSize: 10, flex: 1 },
  productBottom: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  productPrice: { color: '#10b981', fontSize: 13, fontWeight: '700', flex: 1 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  ratingText: { color: '#f59e0b', fontSize: 10, fontWeight: '600' },
  salesText: { color: '#4b5563', fontSize: 10 },
  selectedBar: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, backgroundColor: '#a855f7' },
});

export default MarketplaceScreen;
