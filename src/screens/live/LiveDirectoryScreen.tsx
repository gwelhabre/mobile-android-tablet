import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { DrawerActions } from '@react-navigation/native';
import { LiveStackParamList } from '../../navigation/stacks/LiveStack';
import PageHeader from '../../components/layout/PageHeader';
import FAB from '../../components/layout/FAB';
import Avatar from '../../components/common/Avatar';
import Badge from '../../components/common/Badge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import Snackbar from '../../components/common/Snackbar';
import { getLiveStreams } from '../../api/rankings';
import { LiveStream } from '../../types';
import { useAuth } from '../../context/AuthContext';

type NavProp = NativeStackNavigationProp<LiveStackParamList, 'LiveDirectory'>;

const LiveCard: React.FC<{ stream: LiveStream; onPress: () => void }> = ({ stream, onPress }) => (
  <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
    {/* Thumbnail */}
    <View style={styles.thumbnail}>
      <Avatar uri={stream.djAvatarUrl} name={stream.djName} size={48} />
      <View style={styles.liveBadge}>
        <View style={styles.livePulse} />
        <Text style={styles.liveBadgeText}>LIVE</Text>
      </View>
      <View style={styles.viewerBadge}>
        <MaterialCommunityIcons name="eye" size={12} color="#fff" />
        <Text style={styles.viewerText}>{stream.viewerCount.toLocaleString()}</Text>
      </View>
    </View>

    {/* Info */}
    <View style={styles.cardInfo}>
      <Text style={styles.streamTitle} numberOfLines={2}>{stream.title}</Text>
      <Text style={styles.djName} numberOfLines={1}>{stream.djName}</Text>
      {stream.venueName && (
        <Text style={styles.venueName} numberOfLines={1}>
          <MaterialCommunityIcons name="map-marker" size={11} color="#6b7280" />
          {' '}{stream.venueName}
        </Text>
      )}
      {stream.genres && stream.genres.length > 0 && (
        <View style={styles.genres}>
          {stream.genres.slice(0, 2).map((g) => (
            <Badge key={g} label={g} color="#a855f7" small />
          ))}
        </View>
      )}
      <View style={styles.giftRow}>
        <MaterialCommunityIcons name="gift" size={12} color="#f59e0b" />
        <Text style={styles.giftText}>${stream.totalGiftsValue.toFixed(0)} gifts</Text>
      </View>
    </View>
  </TouchableOpacity>
);

const LiveDirectoryScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const { user } = useAuth();
  const [streams, setStreams] = useState<LiveStream[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [snackbar, setSnackbar] = useState('');

  const fetchStreams = useCallback(async () => {
    try {
      const data = await getLiveStreams();
      setStreams(data);
    } catch {
      setSnackbar('Failed to load live streams');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchStreams(); }, [fetchStreams]);

  if (loading) return <LoadingSpinner fullScreen />;

  const totalViewers = streams.reduce((sum, s) => sum + s.viewerCount, 0);

  return (
    <View style={styles.root}>
      <PageHeader
        title="Live Streams"
        subtitle={`${streams.length} live · ${totalViewers.toLocaleString()} viewers`}
        actions={[
          { icon: 'home', onPress: () => navigation.dispatch(DrawerActions.jumpTo('HomeStack' as any)) },
          { icon: 'refresh', onPress: () => { setRefreshing(true); fetchStreams(); } },
        ]}
      />

      {streams.length === 0 ? (
        <EmptyState
          icon="broadcast-off"
          title="No live streams"
          message="No DJs are currently streaming. Check back later!"
        />
      ) : (
        <FlatList
          data={streams}
          keyExtractor={(item) => item.id}
          numColumns={4}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.content}
          renderItem={({ item }) => (
            <View style={styles.cardWrap}>
              <LiveCard
                stream={item}
                onPress={() => navigation.navigate('LiveStream', { streamId: item.id })}
              />
            </View>
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchStreams(); }}
              tintColor="#a855f7"
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {user?.role === 'dj' && (
        <FAB
          icon="broadcast"
          label="Go Live"
          onPress={() => navigation.navigate('GoLive')}
          color="#ef4444"
        />
      )}

      <Snackbar message={snackbar} visible={!!snackbar} onDismiss={() => setSnackbar('')} type="error" />
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0a0a0f' },
  content: { padding: 12, paddingBottom: 100 },
  row: { gap: 12, marginBottom: 12 },
  cardWrap: { flex: 1 },
  card: {
    backgroundColor: '#12121a', borderRadius: 14, overflow: 'hidden',
    borderWidth: 1, borderColor: '#1e1e2e',
  },
  thumbnail: {
    height: 120, backgroundColor: '#1a0f2e',
    justifyContent: 'center', alignItems: 'center', position: 'relative',
  },
  liveBadge: {
    position: 'absolute', top: 8, left: 8,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#ef4444', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3,
  },
  livePulse: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
  liveBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },
  viewerBadge: {
    position: 'absolute', bottom: 8, right: 8,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(0,0,0,0.65)', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3,
  },
  viewerText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  cardInfo: { padding: 12, gap: 3 },
  streamTitle: { color: '#f3f4f6', fontSize: 13, fontWeight: '700', lineHeight: 17 },
  djName: { color: '#a855f7', fontSize: 12, fontWeight: '500' },
  venueName: { color: '#6b7280', fontSize: 11 },
  genres: { flexDirection: 'row', gap: 4, flexWrap: 'wrap', marginTop: 2 },
  giftRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  giftText: { color: '#f59e0b', fontSize: 11, fontWeight: '500' },
});

export default LiveDirectoryScreen;
