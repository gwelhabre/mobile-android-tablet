import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Clipboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/common/Header';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { getDJDashboardEvents, djStreamAction, DJDashboardEvent } from '../../api/dj';
import { useAuth } from '../../context/AuthContext';

const DJBroadcastScreen: React.FC = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<DJDashboardEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [streamKey, setStreamKey] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const isDj = user?.role === 'dj';

  const load = useCallback(async () => {
    if (!isDj) return;
    try {
      const data = await getDJDashboardEvents();
      setEvents(data);
      const live = data.find((e) => e.status === 'live');
      if (live) {
        setSelectedEventId(live.id);
        setStreamKey(live.liveStream?.streamKey ?? null);
      } else if (data[0] && !selectedEventId) {
        setSelectedEventId(data[0].id);
      }
    } catch {
      setEvents([]);
    }
  }, [isDj, selectedEventId]);

  useEffect(() => { load().finally(() => setLoading(false)); }, [load]);

  const refresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const goLive = async () => {
    if (!selectedEventId) {
      Alert.alert('Pick an event', 'Select one of your upcoming events first.');
      return;
    }
    setActionLoading(true);
    try {
      const result = await djStreamAction('start', selectedEventId);
      setStreamKey(result?.liveStream?.streamKey ?? null);
      await load();
      Alert.alert('Live', 'Your broadcast is now live.');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error ?? 'Could not start broadcast.');
    } finally {
      setActionLoading(false);
    }
  };

  const stopLive = async () => {
    if (!selectedEventId) return;
    Alert.alert(
      'End broadcast?',
      'Viewers will be disconnected.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              await djStreamAction('stop', selectedEventId);
              setStreamKey(null);
              await load();
            } catch (err: any) {
              Alert.alert('Error', err?.response?.data?.error ?? 'Could not stop broadcast.');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ],
    );
  };

  const copyKey = () => {
    if (streamKey) {
      Clipboard.setString(streamKey);
      Alert.alert('Copied', 'Stream key copied to clipboard.');
    }
  };

  if (!isDj) {
    return (
      <SafeAreaView style={styles.safe}>
        <Header title="Go Live" showBack />
        <View style={styles.empty}>
          <Ionicons name="lock-closed-outline" size={32} color="#4b5563" />
          <Text style={styles.emptyText}>DJ role required.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) return <LoadingSpinner message="Loading your events..." />;

  const live = events.find((e) => e.id === selectedEventId && e.status === 'live');

  return (
    <SafeAreaView style={styles.safe}>
      <Header title="Go Live" subtitle="Stream from your events" showBack />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#ef4444" />}
        showsVerticalScrollIndicator={false}
      >
        {live && (
          <View style={styles.onAir}>
            <View style={styles.onAirDot} />
            <Text style={styles.onAirText}>ON AIR</Text>
            <Text style={styles.onAirEvent}>{live.title}</Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>Pick an event</Text>
        {events.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="calendar-outline" size={32} color="#4b5563" />
            <Text style={styles.emptyText}>No upcoming events.</Text>
            <Text style={styles.emptyHint}>You can only go live during a scheduled event.</Text>
          </View>
        ) : (
          events.map((event) => {
            const active = event.id === selectedEventId;
            return (
              <TouchableOpacity
                key={event.id}
                style={[styles.eventCard, active && styles.eventCardActive]}
                onPress={() => setSelectedEventId(event.id)}
                activeOpacity={0.85}
              >
                <View style={styles.eventInfo}>
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  <Text style={styles.eventMeta}>{event.venue.name} · {new Date(event.startTime).toLocaleString()}</Text>
                </View>
                {event.status === 'live' ? (
                  <View style={styles.liveBadge}>
                    <View style={styles.liveDotSmall} />
                    <Text style={styles.liveBadgeText}>LIVE</Text>
                  </View>
                ) : (
                  <Text style={styles.eventStatus}>{event.status}</Text>
                )}
              </TouchableOpacity>
            );
          })
        )}

        {selectedEventId && (
          <View style={styles.actions}>
            {live ? (
              <TouchableOpacity style={[styles.endBtn, actionLoading && { opacity: 0.6 }]} onPress={stopLive} disabled={actionLoading}>
                <Ionicons name="stop-circle-outline" size={20} color="#ef4444" />
                <Text style={styles.endBtnText}>End Stream</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={[styles.goLiveBtn, actionLoading && { opacity: 0.6 }]} onPress={goLive} disabled={actionLoading}>
                <View style={styles.goLiveDot} />
                <Text style={styles.goLiveBtnText}>{actionLoading ? 'Starting...' : 'Go Live'}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {streamKey && (
          <View style={styles.streamKeyBox}>
            <Text style={styles.streamKeyLabel}>Stream Key</Text>
            <Text selectable style={styles.streamKeyValue}>{streamKey}</Text>
            <TouchableOpacity style={styles.copyBtn} onPress={copyKey}>
              <Ionicons name="copy-outline" size={14} color="#67e8f9" />
              <Text style={styles.copyText}>Copy</Text>
            </TouchableOpacity>
          </View>
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
  emptyHint: { color: '#4b5563', fontSize: 12, textAlign: 'center', maxWidth: 240 },
  sectionTitle: { color: '#fff', fontSize: 14, fontWeight: '900', marginTop: 4 },
  onAir: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#2d0a0a', borderWidth: 1, borderColor: '#ef4444', borderRadius: 12, padding: 14 },
  onAirDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#ef4444' },
  onAirText: { color: '#fff', fontSize: 13, fontWeight: '900', letterSpacing: 1 },
  onAirEvent: { color: '#fca5a5', fontSize: 13, flex: 1 },
  eventCard: { backgroundColor: '#12121a', borderRadius: 14, borderWidth: 1, borderColor: '#1f1f2e', padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  eventCardActive: { borderColor: '#a855f7', backgroundColor: 'rgba(168,85,247,0.06)' },
  eventInfo: { flex: 1 },
  eventTitle: { color: '#fff', fontSize: 14, fontWeight: '700' },
  eventMeta: { color: '#6b7280', fontSize: 11, marginTop: 2 },
  eventStatus: { color: '#9ca3af', fontSize: 11, textTransform: 'uppercase', fontWeight: '700' },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#ef4444', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  liveDotSmall: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
  liveBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  actions: { marginTop: 8 },
  goLiveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#ef4444', borderRadius: 14, paddingVertical: 16 },
  goLiveDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#fff' },
  goLiveBtnText: { color: '#fff', fontSize: 15, fontWeight: '900' },
  endBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderWidth: 1, borderColor: '#ef4444', borderRadius: 14, paddingVertical: 16 },
  endBtnText: { color: '#ef4444', fontSize: 15, fontWeight: '900' },
  streamKeyBox: { backgroundColor: '#12121a', borderRadius: 12, borderWidth: 1, borderColor: '#1f1f2e', padding: 14, gap: 8 },
  streamKeyLabel: { color: '#9ca3af', fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 },
  streamKeyValue: { color: '#67e8f9', fontSize: 12, fontFamily: 'monospace' },
  copyBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#06b6d455', alignSelf: 'flex-start' },
  copyText: { color: '#67e8f9', fontSize: 11, fontWeight: '700' },
});

export default DJBroadcastScreen;
