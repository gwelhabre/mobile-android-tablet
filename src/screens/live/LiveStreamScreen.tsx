import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRoute, RouteProp, useNavigation, DrawerActions } from '@react-navigation/native';
import { LiveStackParamList } from '../../navigation/stacks/LiveStack';
import PageHeader from '../../components/layout/PageHeader';
import Avatar from '../../components/common/Avatar';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Snackbar from '../../components/common/Snackbar';
import { getStreamById } from '../../api/rankings';
import { getGiftCatalog } from '../../api/gifts';
import { LiveStream, ChatMessage, GiftCatalogItem } from '../../types';
import { useAuth } from '../../context/AuthContext';

type RouteType = RouteProp<LiveStackParamList, 'LiveStream'>;

const ChatBubble: React.FC<{ msg: ChatMessage }> = ({ msg }) => (
  <View style={styles.chatMsg}>
    <Avatar uri={msg.avatarUrl} name={msg.username} size={28} />
    <View style={styles.chatContent}>
      <Text style={styles.chatUsername}>{msg.username}</Text>
      {msg.type === 'gift' ? (
        <Text style={styles.chatGift}>🎁 Sent {msg.giftItem?.name}</Text>
      ) : msg.type === 'system' ? (
        <Text style={styles.chatSystem}>{msg.message}</Text>
      ) : (
        <Text style={styles.chatText}>{msg.message}</Text>
      )}
    </View>
  </View>
);

const LiveStreamScreen: React.FC = () => {
  const route = useRoute<RouteType>();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { streamId } = route.params;

  const [stream, setStream] = useState<LiveStream | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [gifts, setGifts] = useState<GiftCatalogItem[]>([]);
  const [showGifts, setShowGifts] = useState(false);
  const [snackbar, setSnackbar] = useState('');
  const [snackType, setSnackType] = useState<'default' | 'success' | 'error'>('default');
  const chatRef = useRef<FlatList>(null);

  useEffect(() => {
    const load = async () => {
      try {
        if (streamId !== 'new') {
          const data = await getStreamById(streamId);
          setStream(data);
        }
        const giftData = await getGiftCatalog();
        setGifts(giftData);
        // Mock messages
        setMessages([
          { id: '1', streamId, userId: 'u1', username: 'fan_alex', message: 'This mix is fire!', type: 'text', sentAt: new Date().toISOString() },
          { id: '2', streamId, userId: 'u2', username: 'club_lover', message: 'Keep it going!', type: 'text', sentAt: new Date().toISOString() },
          { id: 'sys1', streamId, userId: 'system', username: 'System', message: 'Welcome to the stream!', type: 'system', sentAt: new Date().toISOString() },
        ]);
      } catch {
        setSnackbar('Failed to load stream');
        setSnackType('error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [streamId]);

  const sendMessage = useCallback(() => {
    if (!chatInput.trim() || !user) return;
    const msg: ChatMessage = {
      id: Date.now().toString(),
      streamId,
      userId: user.id,
      username: user.username,
      message: chatInput.trim(),
      type: 'text',
      sentAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, msg]);
    setChatInput('');
    setTimeout(() => chatRef.current?.scrollToEnd({ animated: true }), 100);
  }, [chatInput, user, streamId]);

  const sendGift = useCallback((gift: GiftCatalogItem) => {
    if (!user) return;
    const msg: ChatMessage = {
      id: Date.now().toString(),
      streamId,
      userId: user.id,
      username: user.username,
      message: '',
      type: 'gift',
      giftItem: gift,
      sentAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, msg]);
    setShowGifts(false);
    setSnackbar(`Sent ${gift.name}! (-${gift.coinCost} coins)`);
    setSnackType('success');
  }, [user, streamId]);

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <PageHeader
        title={stream?.title || 'Live Stream'}
        subtitle={stream ? `${stream.djName} · ${stream.viewerCount.toLocaleString()} viewers` : ''}
        showBack
        onBack={() => navigation.dispatch(DrawerActions.jumpTo('HomeStack' as any))}
      />

      <View style={styles.body}>
        {/* Left: Stream Area (70%) */}
        <View style={styles.streamPane}>
          <View style={styles.streamView}>
            <MaterialCommunityIcons name="broadcast" size={64} color="#a855f730" />
            <Text style={styles.streamPlaceholder}>
              {streamId === 'new' ? 'Your stream will appear here' : 'Stream Video Player'}
            </Text>
            {stream && (
              <View style={styles.streamOverlayStats}>
                <View style={styles.liveIndicator}>
                  <View style={styles.livePulse} />
                  <Text style={styles.liveText}>LIVE</Text>
                </View>
                <View style={styles.statBadge}>
                  <MaterialCommunityIcons name="eye" size={14} color="#fff" />
                  <Text style={styles.statText}>{stream.viewerCount.toLocaleString()}</Text>
                </View>
                <View style={styles.statBadge}>
                  <MaterialCommunityIcons name="gift" size={14} color="#f59e0b" />
                  <Text style={styles.statText}>${stream.totalGiftsValue.toFixed(0)}</Text>
                </View>
              </View>
            )}
          </View>

          {/* Stream Info */}
          {stream && (
            <View style={styles.streamInfo}>
              <Avatar uri={stream.djAvatarUrl} name={stream.djName} size={44} />
              <View style={styles.streamDetails}>
                <Text style={styles.streamTitle}>{stream.title}</Text>
                <Text style={styles.djName}>{stream.djName}</Text>
                {stream.genres && (
                  <View style={styles.genreRow}>
                    {stream.genres.map((g) => <Badge key={g} label={g} color="#a855f7" small />)}
                  </View>
                )}
              </View>
              <Button
                label="Send Gift"
                onPress={() => setShowGifts(!showGifts)}
                icon="gift"
                color="#f59e0b"
                variant="tonal"
                size="sm"
              />
            </View>
          )}

          {/* Gift Panel */}
          {showGifts && (
            <View style={styles.giftPanel}>
              <Text style={styles.giftPanelTitle}>Send a Gift</Text>
              <View style={styles.giftsGrid}>
                {gifts.map((gift) => (
                  <TouchableOpacity
                    key={gift.id}
                    style={styles.giftBtn}
                    onPress={() => sendGift(gift)}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.giftEmoji}>🎁</Text>
                    <Text style={styles.giftName}>{gift.name}</Text>
                    <Text style={styles.giftCost}>{gift.coinCost}c</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Right: Chat (30%) */}
        <View style={styles.chatPane}>
          <View style={styles.chatHeader}>
            <MaterialCommunityIcons name="chat" size={16} color="#a855f7" />
            <Text style={styles.chatTitle}>Live Chat</Text>
            <Text style={styles.chatCount}>{messages.length}</Text>
          </View>

          <FlatList
            ref={chatRef}
            data={messages}
            keyExtractor={(m) => m.id}
            renderItem={({ item }) => <ChatBubble msg={item} />}
            contentContainerStyle={styles.chatList}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => chatRef.current?.scrollToEnd({ animated: false })}
          />

          {stream?.chatEnabled !== false && (
            <View style={styles.chatInputArea}>
              <TextInput
                style={styles.chatInput}
                placeholder="Say something..."
                placeholderTextColor="#4b5563"
                value={chatInput}
                onChangeText={setChatInput}
                onSubmitEditing={sendMessage}
                returnKeyType="send"
                multiline={false}
              />
              <TouchableOpacity style={styles.sendBtn} onPress={sendMessage} activeOpacity={0.75}>
                <MaterialCommunityIcons name="send" size={18} color="#a855f7" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      <Snackbar message={snackbar} visible={!!snackbar} onDismiss={() => setSnackbar('')} type={snackType} />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0a0a0f' },
  body: { flex: 1, flexDirection: 'row' },
  streamPane: { flex: 7, borderRightWidth: 1, borderRightColor: '#1e1e2e' },
  streamView: {
    flex: 1, backgroundColor: '#080810', justifyContent: 'center', alignItems: 'center',
    minHeight: 300, position: 'relative',
  },
  streamPlaceholder: { color: '#374151', fontSize: 14, marginTop: 8 },
  streamOverlayStats: {
    position: 'absolute', bottom: 12, left: 12,
    flexDirection: 'row', gap: 8,
  },
  liveIndicator: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#ef4444', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3,
  },
  livePulse: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
  liveText: { color: '#fff', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  statBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3,
  },
  statText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  streamInfo: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14,
    backgroundColor: '#12121a', borderTopWidth: 1, borderTopColor: '#1e1e2e',
  },
  streamDetails: { flex: 1, gap: 2 },
  streamTitle: { color: '#f3f4f6', fontSize: 15, fontWeight: '700' },
  djName: { color: '#a855f7', fontSize: 13 },
  genreRow: { flexDirection: 'row', gap: 4, marginTop: 3 },
  giftPanel: {
    backgroundColor: '#12121a', borderTopWidth: 1, borderTopColor: '#1e1e2e', padding: 12,
  },
  giftPanelTitle: { color: '#9ca3af', fontSize: 12, fontWeight: '700', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 },
  giftsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  giftBtn: {
    width: 70, alignItems: 'center', gap: 3, backgroundColor: '#1a1a2e',
    borderRadius: 10, padding: 10, borderWidth: 1, borderColor: '#1e1e2e',
  },
  giftEmoji: { fontSize: 22 },
  giftName: { color: '#9ca3af', fontSize: 10, textAlign: 'center' },
  giftCost: { color: '#f59e0b', fontSize: 11, fontWeight: '700' },
  chatPane: { flex: 3, flexDirection: 'column' },
  chatHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12,
    borderBottomWidth: 1, borderBottomColor: '#1e1e2e', backgroundColor: '#12121a',
  },
  chatTitle: { color: '#e5e7eb', fontSize: 14, fontWeight: '600', flex: 1 },
  chatCount: { color: '#4b5563', fontSize: 12 },
  chatList: { padding: 10, gap: 2 },
  chatMsg: { flexDirection: 'row', gap: 8, paddingVertical: 5 },
  chatContent: { flex: 1 },
  chatUsername: { color: '#a855f7', fontSize: 11, fontWeight: '700', marginBottom: 2 },
  chatText: { color: '#d1d5db', fontSize: 13, lineHeight: 17 },
  chatGift: { color: '#f59e0b', fontSize: 12, fontWeight: '600' },
  chatSystem: { color: '#4b5563', fontSize: 11, fontStyle: 'italic' },
  chatInputArea: {
    flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10,
    borderTopWidth: 1, borderTopColor: '#1e1e2e', backgroundColor: '#12121a',
  },
  chatInput: {
    flex: 1, color: '#f3f4f6', fontSize: 14, backgroundColor: '#0a0a0f',
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9,
    borderWidth: 1, borderColor: '#1e1e2e',
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 10, backgroundColor: '#1a0f2e',
    justifyContent: 'center', alignItems: 'center',
  },
});

export default LiveStreamScreen;
