import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { notificationsApi } from '../../api/notifications';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import PageHeader from '../../components/layout/PageHeader';
import Card from '../../components/common/Card';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import FAB from '../../components/layout/FAB';
import { Notification } from '../../types';

const TYPE_ICONS: Record<string, { icon: string; color: string }> = {
  gift:    { icon: 'gift-outline',             color: '#a855f7' },
  follow:  { icon: 'account-plus-outline',     color: '#3b82f6' },
  booking: { icon: 'calendar-check-outline',   color: '#10b981' },
  wallet:  { icon: 'credit-card-outline',      color: '#f59e0b' },
  comment: { icon: 'comment-outline',          color: '#06b6d4' },
  like:    { icon: 'heart-outline',            color: '#ef4444' },
  event:   { icon: 'music-note-outline',       color: '#10b981' },
  deal:    { icon: 'briefcase-outline',        color: '#8b5cf6' },
  system:  { icon: 'information-outline',      color: '#6b7280' },
};

const MOCK: Notification[] = [
  { id: '1', type: 'gift', title: 'You received a gift!', message: 'SoundFan sent you a Diamond Star worth $50', createdAt: new Date(Date.now() - 5 * 60000).toISOString(), read: false },
  { id: '2', type: 'follow', title: 'New follower', message: 'BeatLover started following you', createdAt: new Date(Date.now() - 30 * 60000).toISOString(), read: false },
  { id: '3', type: 'booking', title: 'Booking inquiry', message: 'Fabric London sent you a booking inquiry for July 15', createdAt: new Date(Date.now() - 2 * 3600000).toISOString(), read: true },
  { id: '4', type: 'wallet', title: 'Payout processed', message: 'Your payout of $480 has been sent via bank transfer', createdAt: new Date(Date.now() - 5 * 3600000).toISOString(), read: true },
  { id: '5', type: 'like', title: 'Set liked', message: '24 people liked your set "Deep House Sessions Vol. 3"', createdAt: new Date(Date.now() - 24 * 3600000).toISOString(), read: true },
  { id: '6', type: 'deal', title: 'Deal accepted', message: 'Berghain accepted your deal proposal for August 2', createdAt: new Date(Date.now() - 2 * 86400000).toISOString(), read: true },
  { id: '7', type: 'event', title: 'Event reminder', message: 'Your event "Neon Nights" is tomorrow at 9 PM', createdAt: new Date(Date.now() - 3 * 86400000).toISOString(), read: true },
  { id: '8', type: 'system', title: 'Profile verified', message: 'Your DJ profile has been verified!', createdAt: new Date(Date.now() - 7 * 86400000).toISOString(), read: true },
];

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function NotificationsScreen() {
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      setNotifications(MOCK);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const renderItem = ({ item }: { item: Notification }) => {
    const info = TYPE_ICONS[item.type] ?? TYPE_ICONS.system;
    return (
      <TouchableOpacity activeOpacity={0.7}>
        <Card style={[styles.card, !item.read && styles.unread]}>
          {!item.read && <View style={styles.dot} />}
          <View style={[styles.iconWrap, { backgroundColor: `${info.color}15` }]}>
            <MaterialCommunityIcons name={info.icon as any} size={24} color={info.color} />
          </View>
          <View style={styles.body}>
            <View style={styles.titleRow}>
              <Text style={[styles.title, !item.read && styles.titleUnread]}>{item.title}</Text>
              <Text style={styles.time}>{timeAgo(item.createdAt)}</Text>
            </View>
            <Text style={styles.message} numberOfLines={2}>{item.message}</Text>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  if (loading) return <LoadingSpinner />;

  return (
    <View style={styles.container}>
      <PageHeader
        title="Notifications"
        subtitle={unreadCount > 0 ? `${unreadCount} unread` : 'All read'}
        actions={[{ icon: 'home', onPress: () => navigation.dispatch(DrawerActions.jumpTo('HomeStack' as any)) }]}
      />
      <FlatList
        data={notifications}
        keyExtractor={n => n.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} colors={['#a855f7']} />
        }
        ListEmptyComponent={<EmptyState icon="bell-off-outline" message="No notifications yet" />}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
      />
      {unreadCount > 0 && (
        <FAB icon="check-all" onPress={markAllRead} label="Mark all read" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f' },
  list: { padding: 20 },
  card: { flexDirection: 'row', alignItems: 'flex-start', gap: 16, position: 'relative' },
  unread: { borderColor: '#a855f730', backgroundColor: '#a855f708' },
  dot: { position: 'absolute', top: 18, left: 6, width: 8, height: 8, borderRadius: 4, backgroundColor: '#a855f7' },
  iconWrap: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  body: { flex: 1 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  title: { color: '#9ca3af', fontSize: 15, fontWeight: '500', flex: 1 },
  titleUnread: { color: '#ffffff', fontWeight: '700' },
  time: { color: '#4b5563', fontSize: 12, marginLeft: 8 },
  message: { color: '#6b7280', fontSize: 13, lineHeight: 18 },
});
