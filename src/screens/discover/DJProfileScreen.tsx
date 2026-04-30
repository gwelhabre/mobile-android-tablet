import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Avatar from '../../components/common/Avatar';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Snackbar from '../../components/common/Snackbar';
import { getDJById, followDJ, unfollowDJ } from '../../api/dj';
import { getGiftCatalog, getReceivedGifts, sendGiftToDJ } from '../../api/gifts';
import { DJProfile, GiftCatalogItem } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface DJProfileDetailProps {
  djId: string;
  djData?: DJProfile;
}

const DJProfileDetail: React.FC<DJProfileDetailProps> = ({ djId, djData }) => {
  const { user } = useAuth();
  const [dj, setDJ] = useState<DJProfile | null>(djData || null);
  const [gifts, setGifts] = useState<GiftCatalogItem[]>([]);
  const [loading, setLoading] = useState(!djData);
  const [following, setFollowing] = useState(false);
  const [sendingGiftId, setSendingGiftId] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState('');
  const [snackType, setSnackType] = useState<'default' | 'success' | 'error'>('default');

  useEffect(() => {
    const load = async () => {
      try {
        const [djData_, giftData] = await Promise.all([
          getDJById(djId),
          getGiftCatalog(),
        ]);
        setDJ(djData_);
        setFollowing(Boolean(djData_.isFollowing));
        if (!djData_.giftShowcase) {
          getReceivedGifts(djData_.id)
            .then((giftShowcase) => setDJ((current) => current ? { ...current, giftShowcase } : current))
            .catch(() => {});
        }
        setGifts(giftData.slice(0, 6));
      } catch {
        setSnackbar('Failed to load DJ profile');
        setSnackType('error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [djId]);

  const handleFollow = async () => {
    if (!dj) return;
    try {
      const result = following ? await unfollowDJ(dj.id) : await followDJ(dj.id);
      setFollowing(result.following);
      setSnackbar(result.following ? `Now following ${dj.stageName}` : `Unfollowed ${dj.stageName}`);
      setSnackType('success');
    } catch {
      setSnackbar('Action failed');
      setSnackType('error');
    }
  };

  const handleSendGift = async (gift: GiftCatalogItem) => {
    if (!dj) return;
    setSendingGiftId(gift.id);
    try {
      const result = await sendGiftToDJ(dj.id, gift.id);
      const giftShowcase = await getReceivedGifts(dj.id).catch(() => dj.giftShowcase);
      setDJ({ ...dj, giftShowcase });
      setSnackbar(`Sent ${gift.name}. Platform $${result.platformAmount.toFixed(2)}, DJ $${result.sellerAmount.toFixed(2)}`);
      setSnackType('success');
    } catch (err: any) {
      setSnackbar(err?.response?.data?.error || err?.response?.data?.message || 'Could not send gift');
      setSnackType('error');
    } finally {
      setSendingGiftId(null);
    }
  };

  if (loading) return <LoadingSpinner message="Loading profile..." />;
  if (!dj) return null;

  return (
    <View style={styles.container}>
      {/* Banner */}
      <View style={styles.banner}>
        <View style={styles.bannerBg} />
        <View style={styles.profileRow}>
          <Avatar uri={dj.avatarUrl} name={dj.stageName} size={80} borderColor="#a855f7" />
          <View style={styles.profileInfo}>
            <Text style={styles.stageName}>{dj.stageName}</Text>
            <Text style={styles.realName}>{dj.user?.displayName}</Text>
            <Text style={styles.location}>
              <MaterialCommunityIcons name="map-marker" size={13} color="#6b7280" />
              {' '}{dj.city}, {dj.country}
            </Text>
          </View>
          <View style={styles.rankBadge}>
            <MaterialCommunityIcons name="trophy" size={16} color="#f59e0b" />
            <Text style={styles.rankText}>#{dj.rankingPosition}</Text>
          </View>
        </View>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{(dj.followersCount / 1000).toFixed(1)}k</Text>
          <Text style={styles.statLabel}>Followers</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>{dj.rankingScore.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Score</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>{dj.totalGiftsReceived.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Gifts</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: '#10b981' }]}>
            {dj.isAvailableForBooking ? 'Open' : 'Closed'}
          </Text>
          <Text style={styles.statLabel}>Bookings</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsRow}>
        <Button
          label={following ? 'Following' : 'Follow'}
          onPress={handleFollow}
          variant={following ? 'tonal' : 'filled'}
          icon={following ? 'account-check' : 'account-plus'}
          size="md"
          style={styles.actionBtn}
        />
        {dj.isAvailableForBooking && user?.role === 'venue_manager' && (
          <Button
            label="Book DJ"
            onPress={() => setSnackbar('Booking request sent!')}
            variant="outlined"
            icon="calendar-plus"
            size="md"
            color="#10b981"
            style={styles.actionBtn}
          />
        )}
        <Button
          label="Send Gift"
          onPress={() => setSnackbar('Gift panel opening...')}
          variant="outlined"
          icon="gift"
          size="md"
          color="#f59e0b"
          style={styles.actionBtn}
        />
      </View>

      {/* Genres */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Genres</Text>
        <View style={styles.genreChips}>
          {dj.genres.map((g) => (
            <Badge key={g} label={g} color="#a855f7" />
          ))}
        </View>
      </View>

      {/* Bio */}
      {dj.bio && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.bio}>{dj.bio}</Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Gift Showcase</Text>
        {dj.giftShowcase && dj.giftShowcase.totalCount > 0 ? (
          <>
            <View style={styles.showcaseStats}>
              <View>
                <Text style={styles.showcaseValue}>{dj.giftShowcase.totalCount}</Text>
                <Text style={styles.showcaseLabel}>Gifts</Text>
              </View>
              <View>
                <Text style={styles.showcaseValue}>${dj.giftShowcase.grossAmount.toFixed(2)}</Text>
                <Text style={styles.showcaseLabel}>Fan support</Text>
              </View>
              <View>
                <Text style={styles.showcaseValue}>${dj.giftShowcase.djAmount.toFixed(2)}</Text>
                <Text style={styles.showcaseLabel}>DJ net</Text>
              </View>
            </View>
            {dj.giftShowcase.notableSenders.slice(0, 3).map((sender) => (
              <View key={sender.userId} style={styles.showcaseSenderRow}>
                <Text style={styles.showcaseSenderName}>{sender.name}</Text>
                <Text style={styles.showcaseSenderMeta}>{sender.giftCount} gifts</Text>
              </View>
            ))}
          </>
        ) : (
          <Text style={styles.bio}>No gifts received yet.</Text>
        )}
      </View>

      {/* Sets */}
      {dj.sets && dj.sets.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Digital Sets</Text>
          {dj.sets.slice(0, 4).map((s) => (
            <Card key={s.id} style={styles.setCard} outlined>
              <View style={styles.setRow}>
                <View style={styles.setIcon}>
                  <MaterialCommunityIcons name="music-note" size={18} color="#a855f7" />
                </View>
                <View style={styles.setInfo}>
                  <Text style={styles.setTitle}>{s.title}</Text>
                  <Text style={styles.setGenre}>{s.genre}</Text>
                </View>
                <Text style={styles.setPrice}>${s.price}</Text>
              </View>
            </Card>
          ))}
        </View>
      )}

      {/* Gifts */}
      {gifts.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Send a Gift</Text>
          <View style={styles.giftsGrid}>
            {gifts.map((gift) => (
              <TouchableOpacity
                key={gift.id}
                style={styles.giftItem}
                onPress={() => handleSendGift(gift)}
                disabled={sendingGiftId === gift.id}
                activeOpacity={0.75}
              >
                <Text style={styles.giftEmoji}>{gift.emoji ?? '🎁'}</Text>
                <Text style={styles.giftName} numberOfLines={1}>{gift.name}</Text>
                <Text style={styles.giftCost}>${Number(gift.price ?? gift.coinCost ?? 0).toFixed(2)}</Text>
                <Text style={styles.giftNet}>DJ ${(Number(gift.price ?? gift.coinCost ?? 0) * 0.5).toFixed(2)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <Snackbar
        message={snackbar}
        visible={!!snackbar}
        onDismiss={() => setSnackbar('')}
        type={snackType}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  banner: { borderRadius: 16, overflow: 'hidden', marginBottom: 16 },
  bannerBg: { height: 100, backgroundColor: '#1a0f2e', position: 'absolute', top: 0, left: 0, right: 0 },
  profileRow: { flexDirection: 'row', alignItems: 'flex-end', padding: 16, gap: 16, paddingTop: 40 },
  profileInfo: { flex: 1, gap: 3 },
  stageName: { color: '#f3f4f6', fontSize: 22, fontWeight: '800' },
  realName: { color: '#9ca3af', fontSize: 13 },
  location: { color: '#6b7280', fontSize: 12 },
  rankBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#f59e0b20', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5,
  },
  rankText: { color: '#f59e0b', fontSize: 14, fontWeight: '700' },
  statsRow: {
    flexDirection: 'row', backgroundColor: '#12121a', borderRadius: 14,
    padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#1e1e2e',
  },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  statValue: { color: '#f3f4f6', fontSize: 16, fontWeight: '700' },
  statLabel: { color: '#6b7280', fontSize: 11 },
  statDivider: { width: 1, backgroundColor: '#1e1e2e', marginHorizontal: 4 },
  actionsRow: { flexDirection: 'row', gap: 10, marginBottom: 20, flexWrap: 'wrap' },
  actionBtn: { flex: 1, minWidth: 120 },
  section: { marginBottom: 20 },
  sectionTitle: { color: '#9ca3af', fontSize: 12, fontWeight: '700', letterSpacing: 1.2, marginBottom: 10, textTransform: 'uppercase' },
  genreChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  bio: { color: '#9ca3af', fontSize: 14, lineHeight: 22 },
  showcaseStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#12121a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f59e0b30',
    padding: 12,
    marginBottom: 10,
  },
  showcaseValue: { color: '#f59e0b', fontSize: 15, fontWeight: '800' },
  showcaseLabel: { color: '#6b7280', fontSize: 10, marginTop: 2 },
  showcaseSenderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#1e1e2e',
    paddingTop: 8,
    marginTop: 8,
  },
  showcaseSenderName: { color: '#f3f4f6', fontSize: 13, fontWeight: '700' },
  showcaseSenderMeta: { color: '#f59e0b', fontSize: 12, fontWeight: '700' },
  setCard: { marginBottom: 8, padding: 10 },
  setRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  setIcon: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#1a0f2e', justifyContent: 'center', alignItems: 'center' },
  setInfo: { flex: 1 },
  setTitle: { color: '#f3f4f6', fontSize: 13, fontWeight: '600' },
  setGenre: { color: '#6b7280', fontSize: 11 },
  setPrice: { color: '#10b981', fontSize: 14, fontWeight: '700' },
  giftsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  giftItem: {
    width: 72, alignItems: 'center', gap: 4, backgroundColor: '#12121a',
    borderRadius: 12, padding: 10, borderWidth: 1, borderColor: '#1e1e2e',
  },
  giftEmoji: { fontSize: 24 },
  giftName: { color: '#9ca3af', fontSize: 10, textAlign: 'center' },
  giftCost: { color: '#f59e0b', fontSize: 11, fontWeight: '700' },
  giftNet: { color: '#6b7280', fontSize: 9, textAlign: 'center' },
});

export default DJProfileDetail;
