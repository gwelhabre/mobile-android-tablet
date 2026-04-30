import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
  Linking,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/common/Header';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { getVideos, createVideo, VideoPost } from '../../api/videos';
import { useAuth } from '../../context/AuthContext';

const DJVideosScreen: React.FC = () => {
  const { user } = useAuth();
  const [videos, setVideos] = useState<VideoPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [tags, setTags] = useState('');
  const [saving, setSaving] = useState(false);

  const isDj = user?.role === 'dj';

  const load = async () => {
    try {
      setVideos(await getVideos());
    } catch {
      setVideos([]);
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
    if (!title.trim() || !videoUrl.trim()) {
      Alert.alert('Missing fields', 'Title and video URL are required.');
      return;
    }
    setSaving(true);
    try {
      await createVideo({
        title: title.trim(),
        videoUrl: videoUrl.trim(),
        description: description.trim() || undefined,
        thumbnailUrl: thumbnailUrl.trim() || undefined,
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      });
      setTitle(''); setVideoUrl(''); setDescription(''); setThumbnailUrl(''); setTags('');
      setModalVisible(false);
      await load();
      Alert.alert('Video posted', 'Your video is now visible.');
    } catch (err: any) {
      Alert.alert('Could not post video', err?.response?.data?.error ?? 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading videos..." />;

  return (
    <SafeAreaView style={styles.safe}>
      <Header title="Videos" subtitle="Reels and event recaps" showBack />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#a855f7" />}
        showsVerticalScrollIndicator={false}
      >
        {isDj && (
          <TouchableOpacity style={styles.uploadBtn} onPress={() => setModalVisible(true)}>
            <Ionicons name="add-circle-outline" size={20} color="#fff" />
            <Text style={styles.uploadBtnText}>Post Video</Text>
          </TouchableOpacity>
        )}

        {videos.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="film-outline" size={32} color="#4b5563" />
            <Text style={styles.emptyText}>No videos yet.</Text>
          </View>
        ) : (
          videos.map((video) => (
            <TouchableOpacity
              key={String(video.id)}
              style={styles.card}
              onPress={() => Linking.openURL(video.videoUrl)}
              activeOpacity={0.85}
            >
              <View style={styles.thumb}>
                <Ionicons name="play-circle" size={42} color="#a855f7" />
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.title} numberOfLines={2}>{video.title}</Text>
                {video.dj?.stageName ? <Text style={styles.dj}>{video.dj.stageName}</Text> : null}
                {video.description ? <Text style={styles.desc} numberOfLines={2}>{video.description}</Text> : null}
                <Text style={styles.meta}>{new Date(video.createdAt).toLocaleDateString()} · {video.type ?? 'reel'}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Post a Video</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.modalBody}>
              <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Title" placeholderTextColor="#4b5563" />
              <TextInput style={styles.input} value={videoUrl} onChangeText={setVideoUrl} placeholder="Video URL (e.g. https://...)" placeholderTextColor="#4b5563" autoCapitalize="none" />
              <TextInput style={styles.input} value={thumbnailUrl} onChangeText={setThumbnailUrl} placeholder="Thumbnail URL (optional)" placeholderTextColor="#4b5563" autoCapitalize="none" />
              <TextInput style={[styles.input, { minHeight: 80 }]} value={description} onChangeText={setDescription} placeholder="Description" placeholderTextColor="#4b5563" multiline textAlignVertical="top" />
              <TextInput style={styles.input} value={tags} onChangeText={setTags} placeholder="Tags (comma-separated)" placeholderTextColor="#4b5563" />
              <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={submit} disabled={saving}>
                <Text style={styles.saveBtnText}>{saving ? 'Posting...' : 'Post Video'}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0a0a0f' },
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  uploadBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#a855f7', borderRadius: 14, paddingVertical: 14 },
  uploadBtnText: { color: '#fff', fontSize: 14, fontWeight: '900' },
  empty: { alignItems: 'center', padding: 32, gap: 8 },
  emptyText: { color: '#6b7280', fontSize: 13 },
  card: { backgroundColor: '#12121a', borderRadius: 16, borderWidth: 1, borderColor: '#1f1f2e', overflow: 'hidden' },
  thumb: { height: 140, backgroundColor: '#1a0a2e', alignItems: 'center', justifyContent: 'center' },
  cardBody: { padding: 14, gap: 4 },
  title: { color: '#fff', fontSize: 15, fontWeight: '900' },
  dj: { color: '#a855f7', fontSize: 12, fontWeight: '700' },
  desc: { color: '#9ca3af', fontSize: 13, lineHeight: 18 },
  meta: { color: '#6b7280', fontSize: 11, marginTop: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', justifyContent: 'center', padding: 18 },
  modalCard: { maxHeight: '88%', backgroundColor: '#12121a', borderRadius: 18, borderWidth: 1, borderColor: '#263241', padding: 16 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: '900' },
  closeBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#1f1f2e', alignItems: 'center', justifyContent: 'center' },
  modalBody: { gap: 10 },
  input: { backgroundColor: '#0a0a0f', borderWidth: 1, borderColor: '#2d2d3d', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: '#fff', fontSize: 14 },
  saveBtn: { backgroundColor: '#a855f7', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 6 },
  saveBtnText: { color: '#fff', fontSize: 14, fontWeight: '900' },
});

export default DJVideosScreen;
