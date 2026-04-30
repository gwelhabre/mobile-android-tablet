import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Avatar from '../../components/common/Avatar';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Snackbar from '../../components/common/Snackbar';
import { getProductById, purchaseProduct } from '../../api/marketplace';
import { MarketplaceProduct } from '../../types';

interface ProductDetailProps {
  productId: string;
  productData?: MarketplaceProduct;
}

const categoryColors: Record<string, string> = {
  digital_set: '#a855f7', sample_pack: '#3b82f6', tutorial: '#10b981',
  merchandise: '#f59e0b', equipment: '#ec4899', ticket: '#06b6d4',
};

const ProductDetailScreen: React.FC<ProductDetailProps> = ({ productId, productData }) => {
  const [product, setProduct] = useState<MarketplaceProduct | null>(productData || null);
  const [loading, setLoading] = useState(!productData);
  const [purchasing, setPurchasing] = useState(false);
  const [purchased, setPurchased] = useState(false);
  const [snackbar, setSnackbar] = useState('');
  const [snackType, setSnackType] = useState<'default' | 'success' | 'error'>('default');

  useEffect(() => {
    if (!productData) {
      getProductById(productId)
        .then(setProduct)
        .catch(() => setSnackbar('Failed to load product'))
        .finally(() => setLoading(false));
    }
  }, [productId, productData]);

  const handlePurchase = async () => {
    if (!product || purchasing) return;
    Alert.alert(
      'Confirm Purchase',
      `Buy "${product.title}" for $${product.price.toFixed(2)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Buy Now',
          onPress: async () => {
            setPurchasing(true);
            try {
              await purchaseProduct(product.id);
              setPurchased(true);
              setSnackbar('Purchase successful! Check your downloads.');
              setSnackType('success');
            } catch (err: any) {
              setSnackbar(err?.response?.data?.error || err?.response?.data?.message || 'Purchase failed. Check your wallet balance.');
              setSnackType('error');
            } finally {
              setPurchasing(false);
            }
          },
        },
      ],
    );
  };

  if (loading) return <LoadingSpinner message="Loading product..." />;
  if (!product) return null;

  const catColor = categoryColors[product.category] || '#a855f7';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Product Image */}
      <View style={[styles.imageArea, { backgroundColor: `${catColor}12` }]}>
        <MaterialCommunityIcons
          name="package-variant"
          size={72}
          color={`${catColor}60`}
        />
        <Badge
          label={product.category.replace('_', ' ').toUpperCase()}
          color={catColor}
          style={styles.categoryBadge}
        />
      </View>

      {/* Title & Price */}
      <View style={styles.titleSection}>
        <Text style={styles.title}>{product.title}</Text>
        <Text style={styles.price}>${product.price.toFixed(2)}</Text>
      </View>

      {/* Seller */}
      <Card style={styles.sellerCard} outlined>
        <View style={styles.sellerRow}>
          <Avatar uri={product.sellerAvatarUrl} name={product.sellerName} size={44} />
          <View style={styles.sellerInfo}>
            <Text style={styles.sellerLabel}>Sold by</Text>
            <Text style={styles.sellerName}>{product.sellerName}</Text>
          </View>
          <TouchableOpacity style={styles.viewSellerBtn} activeOpacity={0.7}>
            <Text style={styles.viewSellerText}>View Profile</Text>
            <MaterialCommunityIcons name="chevron-right" size={16} color="#a855f7" />
          </TouchableOpacity>
        </View>
      </Card>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{product.totalSales.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Sales</Text>
        </View>
        {product.rating !== undefined && (
          <>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <View style={styles.ratingWrap}>
                <MaterialCommunityIcons name="star" size={14} color="#f59e0b" />
                <Text style={styles.statValue}>{product.rating.toFixed(1)}</Text>
              </View>
              <Text style={styles.statLabel}>{product.reviewCount || 0} reviews</Text>
            </View>
          </>
        )}
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: product.isActive ? '#10b981' : '#ef4444' }]}>
            {product.isActive ? 'Active' : 'Inactive'}
          </Text>
          <Text style={styles.statLabel}>Status</Text>
        </View>
      </View>

      {/* Description */}
      {product.description && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{product.description}</Text>
        </View>
      )}

      {/* Tags */}
      {product.tags && product.tags.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tags</Text>
          <View style={styles.tags}>
            {product.tags.map((tag) => (
              <Badge key={tag} label={tag} color="#374151" outlined />
            ))}
          </View>
        </View>
      )}

      {/* Purchase */}
      {purchased ? (
        <Card style={styles.purchasedCard}>
          <MaterialCommunityIcons name="check-circle" size={24} color="#10b981" />
          <Text style={styles.purchasedText}>Purchased! Access in your Downloads</Text>
          <Button
            label="Download"
            onPress={() => {}}
            icon="download"
            variant="tonal"
            color="#10b981"
            size="sm"
          />
        </Card>
      ) : (
        <Button
          label={`Buy Now · $${product.price.toFixed(2)}`}
          onPress={handlePurchase}
          loading={purchasing}
          fullWidth
          size="lg"
          icon="cart"
          color={catColor}
          style={styles.buyBtn}
        />
      )}

      <Snackbar message={snackbar} visible={!!snackbar} onDismiss={() => setSnackbar('')} type={snackType} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 60 },
  imageArea: {
    height: 180, justifyContent: 'center', alignItems: 'center',
    position: 'relative',
  },
  categoryBadge: { position: 'absolute', top: 12, left: 12 },
  titleSection: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    padding: 16, gap: 12,
  },
  title: { color: '#f3f4f6', fontSize: 20, fontWeight: '800', flex: 1, lineHeight: 26 },
  price: { color: '#10b981', fontSize: 24, fontWeight: '800' },
  sellerCard: { marginHorizontal: 16, marginBottom: 12, padding: 12 },
  sellerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sellerInfo: { flex: 1 },
  sellerLabel: { color: '#4b5563', fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8 },
  sellerName: { color: '#f3f4f6', fontSize: 14, fontWeight: '600', marginTop: 1 },
  viewSellerBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  viewSellerText: { color: '#a855f7', fontSize: 12, fontWeight: '500' },
  statsRow: {
    flexDirection: 'row', marginHorizontal: 16, backgroundColor: '#12121a',
    borderRadius: 12, borderWidth: 1, borderColor: '#1e1e2e',
    padding: 12, marginBottom: 16,
  },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  statValue: { color: '#f3f4f6', fontSize: 15, fontWeight: '700' },
  statLabel: { color: '#6b7280', fontSize: 11 },
  statDivider: { width: 1, backgroundColor: '#1e1e2e', marginHorizontal: 4 },
  ratingWrap: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  section: { paddingHorizontal: 16, marginBottom: 16 },
  sectionTitle: { color: '#9ca3af', fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 },
  description: { color: '#9ca3af', fontSize: 14, lineHeight: 22 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  purchasedCard: {
    marginHorizontal: 16, flexDirection: 'row', alignItems: 'center',
    gap: 12, backgroundColor: '#064e3b30', borderWidth: 1, borderColor: '#10b98130',
  },
  purchasedText: { color: '#10b981', fontSize: 13, fontWeight: '600', flex: 1 },
  buyBtn: { margin: 16, borderRadius: 14 },
});

export default ProductDetailScreen;
