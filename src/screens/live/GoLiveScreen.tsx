import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
// Native dep (add + EAS/dev build; NOT available in Expo Go):
//   npx expo install @api.video/react-native-livestream
import { ApiVideoLiveStreamView } from '@api.video/react-native-livestream';
import { startBroadcast, stopBroadcast, getMyUpcomingEvents, MyEvent } from '../../api/live';
import LoadingSpinner from '../../components/common/LoadingSpinner';

// DJ broadcaster: publishes the phone camera straight to YouTube's RTMP ingest.
// The DiskRider backend creates the YouTube broadcast and hands back the ingest
// URL + key; YouTube handles transcoding, CDN, DVR and auto-archives the VOD.
const GoLiveScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const streamRef = useRef<any>(null);

  const [events, setEvents] = useState<MyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState('');
  const [starting, setStarting] = useState(false);
  const [live, setLive] = useState(false);
  const [eventId, setEventId] = useState<string | null>(null);
  const [permission, setPermission] = useState(Platform.OS !== 'android');

  useEffect(() => {
    (async () => {
      if (Platform.OS === 'android') {
        try {
          const res = await PermissionsAndroid.requestMultiple([
            PermissionsAndroid.PERMISSIONS.CAMERA,
            PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          ]);
          setPermission(
            res['android.permission.CAMERA'] === 'granted' &&
              res['android.permission.RECORD_AUDIO'] === 'granted',
          );
        } catch {
          setPermission(false);
        }
      }
    })();
  }, []);

  useEffect(() => {
    getMyUpcomingEvents()
      .then((list) => {
        setEvents(list);
        if (list[0]) setSelected(list[0].id);
      })
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, []);

  const handleGoLive = async () => {
    if (!selected) {
      Alert.alert('Pick an event', 'Select an event to broadcast.');
      return;
    }
    setStarting(true);
    try {
      const res = await startBroadcast(selected);
      const url = res.ingest?.url;
      const key = res.ingest?.streamKey;
      if (!url || !key) throw new Error('No ingest details returned');
      // Publish the camera to YouTube's RTMP endpoint (enableAutoStart flips it live).
      streamRef.current?.startStreaming(key, url);
      setEventId(selected);
      setLive(true);
    } catch (err: any) {
      Alert.alert('Could not go live', err?.response?.data?.error || err?.message || 'Try again.');
    } finally {
      setStarting(false);
    }
  };

  const handleStop = async () => {
    try {
      streamRef.current?.stopStreaming();
    } catch {}
    try {
      if (eventId) await stopBroadcast(eventId);
    } catch {}
    setLive(false);
    setEventId(null);
    navigation.goBack();
  };

  if (loading) return <LoadingSpinner message="Loading your events..." />;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.previewWrap}>
        {permission ? (
          <ApiVideoLiveStreamView
            style={StyleSheet.absoluteFill}
            ref={streamRef}
            camera="back"
            enablePinchedZoom
            video={{ fps: 30, resolution: '720p', bitrate: 2500000, gopDuration: 1 }}
            audio={{ bitrate: 128000, sampleRate: 44100, isStereo: true }}
            isMuted={false}
            onConnectionSuccess={() => setLive(true)}
            onConnectionFailed={() =>
              Alert.alert('Connection failed', 'Check your network and try again.')
            }
            onDisconnect={() => setLive(false)}
          />
        ) : (
          <View style={styles.permission}>
            <Text style={styles.permissionText}>
              Camera & microphone permission is required to go live.
            </Text>
          </View>
        )}

        {live && (
          <View style={styles.liveBadge}>
            <Text style={styles.liveBadgeText}>● LIVE</Text>
          </View>
        )}

        <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.controls}>
        {!live ? (
          <>
            <Text style={styles.label}>Broadcast which event?</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
            >
              {events.length === 0 ? (
                <Text style={styles.empty}>No upcoming events. Create one first.</Text>
              ) : (
                events.map((e) => (
                  <TouchableOpacity
                    key={e.id}
                    style={[styles.chip, selected === e.id && styles.chipActive]}
                    onPress={() => setSelected(e.id)}
                  >
                    <Text style={[styles.chipText, selected === e.id && styles.chipTextActive]}>
                      {e.title}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
            <TouchableOpacity
              style={[styles.goBtn, (starting || !permission || !selected) && styles.disabled]}
              disabled={starting || !permission || !selected}
              onPress={handleGoLive}
            >
              <Ionicons name="radio" size={18} color="#fff" />
              <Text style={styles.goBtnText}>{starting ? 'Starting…' : 'Go Live'}</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity style={styles.stopBtn} onPress={handleStop}>
            <Ionicons name="square" size={18} color="#fff" />
            <Text style={styles.goBtnText}>Stop Broadcast</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0a0a0f' },
  previewWrap: { flex: 1, backgroundColor: '#000', position: 'relative' },
  permission: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  permissionText: { color: '#9ca3af', textAlign: 'center', fontSize: 14 },
  liveBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: '#ef4444',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  liveBadgeText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controls: {
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#1f1f2e',
  },
  label: { color: '#9ca3af', fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  empty: { color: '#6b7280', fontSize: 13 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#1f1f2e',
    backgroundColor: '#12121a',
  },
  chipActive: { borderColor: '#a855f7', backgroundColor: 'rgba(168,85,247,0.12)' },
  chipText: { color: '#9ca3af', fontSize: 13, fontWeight: '700' },
  chipTextActive: { color: '#a855f7' },
  goBtn: {
    backgroundColor: '#ec4899',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  stopBtn: {
    backgroundColor: '#ef4444',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  goBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  disabled: { opacity: 0.5 },
});

export default GoLiveScreen;
