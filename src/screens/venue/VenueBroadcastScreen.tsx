import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getVenueEvents, venueStreamAction, getVenueStreamStatus, VenueEvent } from '../../api/rankings';
import { getLiveComments } from '../../api/comments';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Header from '../../components/common/Header';

const VenueBroadcastScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const preselectedEventId: string | undefined = route.params?.eventId;

  const [events, setEvents] = useState<VenueEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<VenueEvent | null>(null);
  const [loadingEvents, setLoadingEvents] = useState(true);

  const [streamStatus, setStreamStatus] = useState<'idle' | 'live' | 'ended'>('idle');
  const [streamKey, setStreamKey] = useState<string | null>(null);
  const [viewerCount, setViewerCount] = useState(0);
  const [startedAt, setStartedAt] = useState<Date | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [chatMessages, setChatMessages] = useState<Array<{ id: string | number; user: string; msg: string }>>([]);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chatPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load available events
  useEffect(() => {
    getVenueEvents()
      .then(data => {
        setEvents(data);
        if (preselectedEventId) {
          const match = data.find(e => e.id === preselectedEventId);
          if (match) setSelectedEvent(match);
        } else if (data.length === 1) {
          setSelectedEvent(data[0]);
        } else {
          const live = data.find(e => e.status === 'live');
          if (live) setSelectedEvent(live);
        }
      })
      .catch(() => setEvents([]))
      .finally(() => setLoadingEvents(false));
  }, [preselectedEventId]);

  // When event selected, check existing stream status
  useEffect(() => {
    if (!selectedEvent) return;
    getVenueStreamStatus(selectedEvent.id)
      .then(stream => {
        if (stream?.status === 'live') {
          setStreamStatus('live');
          setStreamKey(stream.streamKey);
          setViewerCount(stream.viewerCount);
          setStartedAt(stream.startedAt ? new Date(stream.startedAt) : null);
        } else {
          setStreamStatus('idle');
        }
      })
      .catch(() => {});
  }, [selectedEvent]);

  // Poll viewer count while live
  useEffect(() => {
    if (streamStatus === 'live' && selectedEvent) {
      pollRef.current = setInterval(() => {
        getVenueStreamStatus(selectedEvent.id)
          .then(stream => { if (stream) setViewerCount(stream.viewerCount); })
          .catch(() => {});
      }, 8000);

      chatPollRef.current = setInterval(async () => {
        try {
          const comments = await getLiveComments(selectedEvent.id);
          setChatMessages(comments.slice(-30).map(c => ({
            id: c.id,
            user: c.displayName || c.user?.displayName || c.user?.name || 'Fan',
            msg: c.content,
          })));
        } catch { /* ignore */ }
      }, 5000);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (chatPollRef.current) clearInterval(chatPollRef.current);
    };
  }, [streamStatus, selectedEvent]);

  const elapsed = () => {
    if (!startedAt) return '00:00';
    const secs = Math.floor((Date.now() - startedAt.getTime()) / 1000);
    const m = String(Math.floor(secs / 60)).padStart(2, '0');
    const s = String(secs % 60).padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleGoLive = async () => {
    if (!selectedEvent) return;
    Alert.alert(
      'Go Live',
      `Start streaming "${selectedEvent.title}"?\n\nViewers will see this event as LIVE.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Go Live',
          onPress: async () => {
            setActionLoading(true);
            try {
              const res = await venueStreamAction('start', selectedEvent.id);
              setStreamStatus('live');
              setStreamKey(res.streamKey);
              setStartedAt(new Date());
              setViewerCount(0);
            } catch (err: any) {
              Alert.alert('Error', err?.response?.data?.error ?? 'Failed to start stream.');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleEndStream = async () => {
    if (!selectedEvent) return;
    Alert.alert(
      'End Stream',
      'Are you sure you want to end the live stream?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Stream',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              await venueStreamAction('stop', selectedEvent.id);
              setStreamStatus('ended');
              setStreamKey(null);
            } catch (err: any) {
              Alert.alert('Error', err?.response?.data?.error ?? 'Failed to end stream.');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  if (loadingEvents) return <LoadingSpinner message="Loading events..." />;

  return (
    <SafeAreaView style={styles.safe}>
      <Header title="Go Live" showBack />

      <ScrollView contentContainerStyle={styles.container}>

        {/* On-Air Banner */}
        {streamStatus === 'live' && (
          <View style={styles.onAirBanner}>
            <View style={styles.onAirDot} />
            <Text style={styles.onAirText}>ON AIR</Text>
            <Text style={styles.elapsedText}>{elapsed()}</Text>
            <View style={styles.viewerBadge}>
              <Ionicons name="eye-outline" size={13} color="#fff" />
              <Text style={styles.viewerText}>{viewerCount.toLocaleString()}</Text>
            </View>
          </View>
        )}

        {streamStatus === 'ended' && (
          <View style={styles.endedBanner}>
            <Ionicons name="checkmark-circle-outline" size={18} color="#10b981" />
            <Text style={styles.endedText}>Stream ended</Text>
          </View>
        )}

        {/* Event Picker */}
        {events.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>📅</Text>
            <Text style={styles.emptyTitle}>No Events Today</Text>
            <Text style={styles.emptyBody}>
              Schedule an upcoming event first to start a live stream.
            </Text>
            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() => navigation.navigate('VenuePostEvent')}
              activeOpacity={0.8}
            >
              <Text style={styles.emptyBtnText}>Create Event</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Select Event</Text>
            {events.map(ev => (
              <TouchableOpacity
                key={ev.id}
                style={[
                  styles.eventRow,
                  selectedEvent?.id === ev.id && styles.eventRowActive,
                ]}
                onPress={() => { setSelectedEvent(ev); setStreamStatus('idle'); setStreamKey(null); }}
                activeOpacity={0.8}
                disabled={streamStatus === 'live'}
              >
                <View style={styles.eventDot}>
                  {ev.status === 'live'
                    ? <View style={styles.liveDot} />
                    : <Ionicons name="calendar-outline" size={14} color="#6b7280" />
                  }
                </View>
                <View style={styles.eventInfo}>
                  <Text style={styles.eventTitle} numberOfLines={1}>{ev.title}</Text>
                  <Text style={styles.eventMeta}>{ev.djName} · {ev.venueName}</Text>
                </View>
                {selectedEvent?.id === ev.id && (
                  <Ionicons name="checkmark-circle" size={18} color="#a855f7" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Stream Controls */}
        {selectedEvent && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Stream Controls</Text>
            <View style={styles.eventSummary}>
              <Text style={styles.eventSummaryTitle}>{selectedEvent.title}</Text>
              <Text style={styles.eventSummaryMeta}>with {selectedEvent.djName}</Text>
            </View>

            {streamStatus === 'live' ? (
              <>
                {streamKey && (
                  <View style={styles.keyBox}>
                    <Text style={styles.keyLabel}>Stream Key</Text>
                    <Text style={styles.keyValue} numberOfLines={1}>{streamKey}</Text>
                    <Text style={styles.keyHint}>Use this key in your broadcast software (OBS, etc.)</Text>
                  </View>
                )}
                <TouchableOpacity
                  style={styles.endBtn}
                  onPress={handleEndStream}
                  disabled={actionLoading}
                  activeOpacity={0.8}
                >
                  {actionLoading
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <>
                        <Ionicons name="stop-circle-outline" size={20} color="#fff" />
                        <Text style={styles.endBtnText}>End Stream</Text>
                      </>
                  }
                </TouchableOpacity>
              </>
            ) : streamStatus === 'ended' ? (
              <TouchableOpacity
                style={styles.goLiveBtn}
                onPress={() => { setStreamStatus('idle'); setChatMessages([]); }}
                activeOpacity={0.8}
              >
                <Text style={styles.goLiveBtnText}>Stream Again</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.goLiveBtn}
                onPress={handleGoLive}
                disabled={actionLoading}
                activeOpacity={0.8}
              >
                {actionLoading
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <>
                      <View style={styles.goLiveDot} />
                      <Text style={styles.goLiveBtnText}>Go Live</Text>
                    </>
                }
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Live Chat */}
        {streamStatus === 'live' && (
          <View style={styles.card}>
            <View style={styles.chatHeader}>
              <Ionicons name="chatbubbles-outline" size={16} color="#a855f7" />
              <Text style={styles.cardTitle}>Live Chat</Text>
              <Text style={styles.chatHint}>Read-only · refreshes every 5s</Text>
            </View>
            {chatMessages.length === 0 ? (
              <Text style={styles.noChatText}>No messages yet…</Text>
            ) : (
              chatMessages.map(m => (
                <View key={m.id} style={styles.chatMsg}>
                  <Text style={styles.chatUser}>{m.user}: </Text>
                  <Text style={styles.chatText}>{m.msg}</Text>
                </View>
              ))
            )}
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0a0a0f' },
  container: { padding: 16, paddingBottom: 40, gap: 14 },

  onAirBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#2d0a0a',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#ef4444',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  onAirDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ef4444',
    shadowColor: '#ef4444',
    shadowOpacity: 0.9,
    shadowRadius: 4,
    elevation: 4,
  },
  onAirText: { color: '#ef4444', fontSize: 14, fontWeight: '900', letterSpacing: 1 },
  elapsedText: { flex: 1, color: '#fca5a5', fontSize: 13, fontWeight: '700' },
  viewerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(239,68,68,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  viewerText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  endedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#052e1c',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#10b981',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  endedText: { color: '#10b981', fontSize: 14, fontWeight: '700' },

  card: {
    backgroundColor: '#12121a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1f1f2e',
    padding: 16,
    gap: 12,
  },
  cardTitle: { color: '#e5e7eb', fontSize: 15, fontWeight: '700' },

  emptyCard: {
    backgroundColor: '#12121a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1f1f2e',
    padding: 28,
    alignItems: 'center',
    gap: 10,
  },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { color: '#e5e7eb', fontSize: 17, fontWeight: '800' },
  emptyBody: { color: '#6b7280', fontSize: 13, textAlign: 'center', lineHeight: 19 },
  emptyBtn: {
    backgroundColor: 'rgba(168,85,247,0.15)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#a855f7',
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: 6,
  },
  emptyBtnText: { color: '#a855f7', fontSize: 14, fontWeight: '700' },

  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1f1f2e',
    backgroundColor: '#0a0a0f',
  },
  eventRowActive: {
    borderColor: '#a855f7',
    backgroundColor: 'rgba(168,85,247,0.08)',
  },
  eventDot: { width: 24, alignItems: 'center' },
  liveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ef4444',
  },
  eventInfo: { flex: 1 },
  eventTitle: { color: '#f3f4f6', fontSize: 14, fontWeight: '600' },
  eventMeta: { color: '#6b7280', fontSize: 12, marginTop: 2 },

  eventSummary: {
    backgroundColor: '#0a0a0f',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1f1f2e',
  },
  eventSummaryTitle: { color: '#e5e7eb', fontSize: 14, fontWeight: '700' },
  eventSummaryMeta: { color: '#6b7280', fontSize: 12, marginTop: 2 },

  keyBox: {
    backgroundColor: '#0a0a0f',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1f1f2e',
    gap: 4,
  },
  keyLabel: { color: '#6b7280', fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  keyValue: { color: '#a855f7', fontSize: 13, fontWeight: '700', fontVariant: ['tabular-nums'] },
  keyHint: { color: '#4b5563', fontSize: 11 },

  goLiveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#ef4444',
    borderRadius: 14,
    paddingVertical: 16,
  },
  goLiveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
  },
  goLiveBtnText: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },

  endBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1f1f2e',
    borderRadius: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  endBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  chatHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  chatHint: { color: '#4b5563', fontSize: 11, marginLeft: 'auto' },
  chatMsg: { flexDirection: 'row', gap: 2 },
  chatUser: { color: '#a855f7', fontSize: 13, fontWeight: '700' },
  chatText: { color: '#d1d5db', fontSize: 13, flex: 1 },
  noChatText: { color: '#4b5563', fontSize: 13, textAlign: 'center', paddingVertical: 8 },
});

export default VenueBroadcastScreen;
