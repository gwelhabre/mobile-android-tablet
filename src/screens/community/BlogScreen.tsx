import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import PageHeader from '../../components/layout/PageHeader';
import Avatar from '../../components/common/Avatar';
import Badge from '../../components/common/Badge';
import Card from '../../components/common/Card';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import Snackbar from '../../components/common/Snackbar';
import { getBlogPosts, getBlogPostById } from '../../api/rankings';
import { BlogPost } from '../../types';

const BlogCard: React.FC<{ post: BlogPost; onPress: () => void }> = ({ post, onPress }) => (
  <TouchableOpacity style={styles.blogCard} onPress={onPress} activeOpacity={0.75}>
    <View style={styles.blogCover}>
      <MaterialCommunityIcons name="newspaper-variant-outline" size={28} color="#a855f740" />
      <Badge label={post.category} color="#a855f7" small style={styles.catBadge} />
    </View>
    <View style={styles.blogInfo}>
      <Text style={styles.blogTitle} numberOfLines={2}>{post.title}</Text>
      <Text style={styles.blogExcerpt} numberOfLines={2}>{post.excerpt}</Text>
      <View style={styles.blogMeta}>
        <Avatar uri={post.authorAvatarUrl} name={post.authorName} size={22} />
        <Text style={styles.authorName} numberOfLines={1}>{post.authorName}</Text>
      </View>
      <View style={styles.blogStats}>
        <View style={styles.statItem}>
          <MaterialCommunityIcons name="clock-outline" size={12} color="#4b5563" />
          <Text style={styles.statText}>{post.readTimeMinutes}m read</Text>
        </View>
        <View style={styles.statItem}>
          <MaterialCommunityIcons name="heart-outline" size={12} color="#4b5563" />
          <Text style={styles.statText}>{post.likeCount}</Text>
        </View>
        <View style={styles.statItem}>
          <MaterialCommunityIcons name="eye-outline" size={12} color="#4b5563" />
          <Text style={styles.statText}>{post.viewCount.toLocaleString()}</Text>
        </View>
      </View>
    </View>
  </TouchableOpacity>
);

const BlogScreen: React.FC = () => {
  const navigation = useNavigation();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [fullPost, setFullPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [loadingPost, setLoadingPost] = useState(false);
  const [snackbar, setSnackbar] = useState('');

  const fetchPosts = useCallback(async () => {
    try {
      const data = await getBlogPosts();
      setPosts(data);
    } catch {
      setSnackbar('Failed to load blog posts');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const handleReadPost = async (post: BlogPost) => {
    setSelectedPost(post);
    setModalVisible(true);
    setLoadingPost(true);
    try {
      const full = await getBlogPostById(post.id);
      setFullPost(full);
    } catch {
      setFullPost(post);
    } finally {
      setLoadingPost(false);
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <View style={styles.root}>
      <PageHeader
        title="Blog"
        subtitle="News, guides & community stories"
        showBack
        onBack={() => navigation.goBack()}
        actions={[{ icon: 'home', onPress: () => navigation.dispatch(DrawerActions.jumpTo('HomeStack' as any)) }]}
      />

      {posts.length === 0 ? (
        <EmptyState icon="newspaper-variant-outline" title="No blog posts yet" />
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(p) => p.id}
          numColumns={3}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.content}
          renderItem={({ item }) => (
            <View style={styles.cardWrap}>
              <BlogCard post={item} onPress={() => handleReadPost(item)} />
            </View>
          )}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchPosts(); }} tintColor="#a855f7" />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Full Post Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.modalClose}
                onPress={() => setModalVisible(false)}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="close" size={22} color="#9ca3af" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                {(fullPost || selectedPost)?.category}
              </Text>
            </View>
            {loadingPost ? (
              <LoadingSpinner message="Loading article..." />
            ) : (
              <ScrollView
                style={styles.modalScroll}
                contentContainerStyle={styles.modalScrollContent}
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.postTitle}>{(fullPost || selectedPost)?.title}</Text>
                <View style={styles.postMeta}>
                  <Avatar uri={(fullPost || selectedPost)?.authorAvatarUrl} name={(fullPost || selectedPost)?.authorName || ''} size={36} />
                  <View>
                    <Text style={styles.postAuthor}>{(fullPost || selectedPost)?.authorName}</Text>
                    <Text style={styles.postDate}>
                      {new Date((fullPost || selectedPost)?.publishedAt || '').toLocaleDateString('en-US', {
                        month: 'long', day: 'numeric', year: 'numeric',
                      })}
                      {' · '}{(fullPost || selectedPost)?.readTimeMinutes} min read
                    </Text>
                  </View>
                </View>
                {(fullPost || selectedPost)?.tags?.length > 0 && (
                  <View style={styles.tagRow}>
                    {((fullPost || selectedPost)?.tags || []).map((t) => (
                      <Badge key={t} label={t} color="#374151" outlined small />
                    ))}
                  </View>
                )}
                <Text style={styles.postBody}>{(fullPost || selectedPost)?.body || (fullPost || selectedPost)?.excerpt}</Text>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      <Snackbar message={snackbar} visible={!!snackbar} onDismiss={() => setSnackbar('')} type="error" />
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0a0a0f' },
  content: { padding: 12, paddingBottom: 80 },
  row: { gap: 12, marginBottom: 12 },
  cardWrap: { flex: 1 },
  blogCard: {
    backgroundColor: '#12121a', borderRadius: 14, overflow: 'hidden',
    borderWidth: 1, borderColor: '#1e1e2e',
  },
  blogCover: {
    height: 100, backgroundColor: '#1a1a2e',
    justifyContent: 'center', alignItems: 'center', position: 'relative',
  },
  catBadge: { position: 'absolute', top: 8, left: 8 },
  blogInfo: { padding: 12, gap: 5 },
  blogTitle: { color: '#f3f4f6', fontSize: 14, fontWeight: '700', lineHeight: 19 },
  blogExcerpt: { color: '#6b7280', fontSize: 12, lineHeight: 17 },
  blogMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  authorName: { color: '#9ca3af', fontSize: 11, flex: 1 },
  blogStats: { flexDirection: 'row', gap: 10, marginTop: 3 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  statText: { color: '#4b5563', fontSize: 10 },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center', alignItems: 'center',
  },
  modalContent: {
    width: '75%', maxWidth: 700, maxHeight: '85%',
    backgroundColor: '#12121a', borderRadius: 20,
    borderWidth: 1, borderColor: '#1e1e2e',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', padding: 16,
    borderBottomWidth: 1, borderBottomColor: '#1e1e2e', gap: 12,
  },
  modalClose: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#1a1a2e', justifyContent: 'center', alignItems: 'center',
  },
  modalTitle: { color: '#a855f7', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  modalScroll: { flex: 1 },
  modalScrollContent: { padding: 20, paddingBottom: 40 },
  postTitle: { color: '#f3f4f6', fontSize: 22, fontWeight: '800', lineHeight: 30, marginBottom: 16 },
  postMeta: { flexDirection: 'row', gap: 12, alignItems: 'center', marginBottom: 12 },
  postAuthor: { color: '#e5e7eb', fontSize: 14, fontWeight: '600' },
  postDate: { color: '#6b7280', fontSize: 12, marginTop: 2 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 20 },
  postBody: { color: '#9ca3af', fontSize: 15, lineHeight: 26 },
});

export default BlogScreen;
