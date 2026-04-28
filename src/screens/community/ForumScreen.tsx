import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import PageHeader from '../../components/layout/PageHeader';
import TwoPane from '../../components/layout/TwoPane';
import Avatar from '../../components/common/Avatar';
import Badge from '../../components/common/Badge';
import Card from '../../components/common/Card';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import Snackbar from '../../components/common/Snackbar';
import { getForumCategories, getForumThreads, getThreadById, replyToThread } from '../../api/rankings';
import { ForumCategory, ForumThread, ForumReply } from '../../types';

const ForumScreen: React.FC = () => {
  const navigation = useNavigation();
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<ForumThread | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);
  const [snackbar, setSnackbar] = useState('');
  const [snackType, setSnackType] = useState<'default' | 'success' | 'error'>('default');
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(new Set());
  const [likeOverrides, setLikeOverrides] = useState<Record<string, number>>({});

  const handleLike = (postId: string, currentCount: number) => {
    const isLiked = likedPostIds.has(postId);
    setLikedPostIds(prev => {
      const next = new Set(prev);
      isLiked ? next.delete(postId) : next.add(postId);
      return next;
    });
    setLikeOverrides(prev => ({
      ...prev,
      [postId]: (prev[postId] ?? currentCount) + (isLiked ? -1 : 1),
    }));
  };

  const fetchFullThread = async (thread: ForumThread) => {
    try {
      const full = await getThreadById(thread.id);
      setSelectedThread(full);
    } catch {
      setSelectedThread(thread);
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        const [cats, threadData] = await Promise.all([
          getForumCategories(),
          getForumThreads(),
        ]);
        setCategories(cats);
        setThreads(threadData);
        if (threadData.length > 0) fetchFullThread(threadData[0]);
      } catch {
        setSnackbar('Failed to load forum');
        setSnackType('error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleCategorySelect = async (catId: string | null) => {
    setSelectedCategory(catId);
    try {
      const data = await getForumThreads(catId || undefined);
      setThreads(data);
      if (data.length > 0) fetchFullThread(data[0]);
      else setSelectedThread(null);
    } catch {
      setSnackbar('Failed to filter threads');
      setSnackType('error');
    }
  };

  const handleThreadSelect = (thread: ForumThread) => {
    fetchFullThread(thread);
  };

  const handleReply = async () => {
    if (!replyText.trim() || !selectedThread) return;
    setReplying(true);
    try {
      const reply = await replyToThread(selectedThread.id, replyText.trim());
      setSelectedThread((prev) => prev ? {
        ...prev,
        replies: [...(prev.replies || []), reply],
        replyCount: prev.replyCount + 1,
      } : prev);
      setReplyText('');
      setSnackbar('Reply posted!');
      setSnackType('success');
    } catch {
      setSnackbar('Failed to post reply');
      setSnackType('error');
    } finally {
      setReplying(false);
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;

  const leftContent = (
    <View style={styles.leftContainer}>
      {/* Categories */}
      <Text style={styles.sectionTitle}>Categories</Text>
      {categories.map((cat) => (
        <TouchableOpacity
          key={cat.id}
          style={[styles.catItem, selectedCategory === cat.id && styles.catItemActive]}
          onPress={() => handleCategorySelect(selectedCategory === cat.id ? null : cat.id)}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name={cat.iconName as any}
            size={18}
            color={selectedCategory === cat.id ? '#a855f7' : '#6b7280'}
          />
          <Text style={[styles.catName, selectedCategory === cat.id && styles.catNameActive]}>
            {cat.name}
          </Text>
          <Badge label={String(cat.threadCount)} color="#1e1e2e" small />
        </TouchableOpacity>
      ))}

      <View style={styles.divider} />

      {/* Threads */}
      <Text style={styles.sectionTitle}>Threads</Text>
      <FlatList
        data={threads}
        keyExtractor={(t) => t.id}
        scrollEnabled={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.threadItem, selectedThread?.id === item.id && styles.threadItemActive]}
            onPress={() => handleThreadSelect(item)}
            activeOpacity={0.75}
          >
            {item.isPinned && (
              <MaterialCommunityIcons name="pin" size={14} color="#f59e0b" style={styles.pinIcon} />
            )}
            <Text style={styles.threadTitle} numberOfLines={2}>{item.title}</Text>
            <View style={styles.threadMeta}>
              <Text style={styles.threadAuthor}>{item.authorName}</Text>
              <Text style={styles.threadStats}>
                {item.replyCount} replies · {item.viewCount} views
              </Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <EmptyState icon="forum-outline" title="No threads" />
        }
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );

  const rightContent = !selectedThread ? (
    <EmptyState icon="forum-outline" title="Select a thread" message="Choose a thread to read" />
  ) : (
    <KeyboardAvoidingView
      style={styles.threadDetail}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.threadHeader}>
        <Text style={styles.threadDetailTitle}>{selectedThread.title}</Text>
        <View style={styles.threadHeaderMeta}>
          <Avatar uri={selectedThread.authorAvatarUrl} name={selectedThread.authorName} size={28} />
          <Text style={styles.threadAuthorName}>{selectedThread.authorName}</Text>
          <Text style={styles.threadDate}>
            {new Date(selectedThread.createdAt).toLocaleDateString()}
          </Text>
          <Badge label={selectedThread.categoryName} color="#a855f7" small />
        </View>
      </View>

      <FlatList
        data={[
          { id: 'op', body: selectedThread.body, authorName: selectedThread.authorName, authorAvatarUrl: selectedThread.authorAvatarUrl, createdAt: selectedThread.createdAt, likeCount: selectedThread.likeCount, isOp: true } as any,
          ...(selectedThread.replies || []),
        ]}
        keyExtractor={(r) => r.id}
        renderItem={({ item }) => (
          <View style={[styles.replyItem, (item as any).isOp && styles.opItem]}>
            <Avatar uri={item.authorAvatarUrl} name={item.authorName} size={36} />
            <View style={styles.replyContent}>
              <View style={styles.replyHeader}>
                <Text style={styles.replyAuthor}>{item.authorName}</Text>
                {(item as any).isOp && <Badge label="OP" color="#10b981" small />}
                <Text style={styles.replyDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
              </View>
              <Text style={styles.replyBody}>{item.body}</Text>
              <View style={styles.replyActions}>
                <TouchableOpacity
                  style={styles.likeBtn}
                  activeOpacity={0.7}
                  onPress={() => handleLike(item.id, item.likeCount ?? 0)}
                >
                  <MaterialCommunityIcons
                    name={likedPostIds.has(item.id) ? 'heart' : 'heart-outline'}
                    size={14}
                    color={likedPostIds.has(item.id) ? '#ec4899' : '#6b7280'}
                  />
                  <Text style={[styles.likeCount, likedPostIds.has(item.id) && { color: '#ec4899' }]}>
                    {likeOverrides[item.id] ?? item.likeCount ?? 0}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
        contentContainerStyle={styles.repliesList}
        showsVerticalScrollIndicator={false}
      />

      {!selectedThread.isLocked && (
        <View style={styles.replyInput}>
          <TextInput
            style={styles.replyTextField}
            placeholder="Write a reply..."
            placeholderTextColor="#4b5563"
            value={replyText}
            onChangeText={setReplyText}
            multiline
          />
          <TouchableOpacity
            style={[styles.replyBtn, (!replyText.trim() || replying) && styles.replyBtnDisabled]}
            onPress={handleReply}
            disabled={!replyText.trim() || replying}
            activeOpacity={0.75}
          >
            <MaterialCommunityIcons name="send" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );

  return (
    <View style={styles.root}>
      <PageHeader
        title="Forum"
        subtitle="Community discussions"
        actions={[{ icon: 'home', onPress: () => navigation.dispatch(DrawerActions.jumpTo('HomeStack' as any)) }]}
      />
      <TwoPane
        leftContent={leftContent}
        rightContent={rightContent}
        leftFlex={2}
        rightFlex={3}
        scrollLeft={true}
        scrollRight={false}
      />
      <Snackbar message={snackbar} visible={!!snackbar} onDismiss={() => setSnackbar('')} type={snackType} />
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0a0a0f' },
  leftContainer: { gap: 6 },
  sectionTitle: { color: '#4b5563', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, paddingHorizontal: 4, marginTop: 8 },
  catItem: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 9, paddingHorizontal: 10, borderRadius: 10,
  },
  catItemActive: { backgroundColor: 'rgba(168,85,247,0.12)' },
  catName: { color: '#9ca3af', fontSize: 13, fontWeight: '500', flex: 1 },
  catNameActive: { color: '#a855f7', fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#1e1e2e', marginVertical: 8 },
  threadItem: {
    paddingVertical: 11, paddingHorizontal: 10, borderRadius: 10,
    borderWidth: 1, borderColor: 'transparent', marginBottom: 4,
  },
  threadItemActive: { backgroundColor: 'rgba(168,85,247,0.1)', borderColor: '#a855f740' },
  pinIcon: { marginBottom: 3 },
  threadTitle: { color: '#f3f4f6', fontSize: 13, fontWeight: '600', lineHeight: 18 },
  threadMeta: { flexDirection: 'row', gap: 8, marginTop: 4 },
  threadAuthor: { color: '#a855f7', fontSize: 11 },
  threadStats: { color: '#4b5563', fontSize: 11 },
  threadDetail: { flex: 1, flexDirection: 'column' },
  threadHeader: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#1e1e2e', gap: 8 },
  threadDetailTitle: { color: '#f3f4f6', fontSize: 18, fontWeight: '700', lineHeight: 24 },
  threadHeaderMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  threadAuthorName: { color: '#a855f7', fontSize: 13, fontWeight: '600' },
  threadDate: { color: '#4b5563', fontSize: 12 },
  repliesList: { padding: 12, gap: 4 },
  replyItem: { flexDirection: 'row', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1a1a2e' },
  opItem: { backgroundColor: '#0f0a1a', borderRadius: 12, padding: 12, borderBottomWidth: 0, marginBottom: 8 },
  replyContent: { flex: 1, gap: 6 },
  replyHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  replyAuthor: { color: '#e5e7eb', fontSize: 13, fontWeight: '600' },
  replyDate: { color: '#4b5563', fontSize: 11, flex: 1, textAlign: 'right' },
  replyBody: { color: '#9ca3af', fontSize: 14, lineHeight: 21 },
  replyActions: { flexDirection: 'row' },
  likeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  likeCount: { color: '#6b7280', fontSize: 12 },
  replyInput: {
    flexDirection: 'row', gap: 8, padding: 12,
    borderTopWidth: 1, borderTopColor: '#1e1e2e', backgroundColor: '#12121a',
    alignItems: 'flex-end',
  },
  replyTextField: {
    flex: 1, color: '#f3f4f6', fontSize: 14,
    backgroundColor: '#0a0a0f', borderRadius: 12,
    borderWidth: 1, borderColor: '#1e1e2e',
    paddingHorizontal: 14, paddingVertical: 10,
    maxHeight: 100, minHeight: 44, textAlignVertical: 'top',
  },
  replyBtn: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: '#a855f7', justifyContent: 'center', alignItems: 'center',
  },
  replyBtnDisabled: { backgroundColor: '#374151' },
});

export default ForumScreen;
