import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { DrawerParamList } from '../../navigation/DrawerNavigator';
import PageHeader from '../../components/layout/PageHeader';
import FAB from '../../components/layout/FAB';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Avatar from '../../components/common/Avatar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Snackbar from '../../components/common/Snackbar';
import { getLiveEvents, getUpcomingEvents } from '../../api/events';
import { getLiveStreams } from '../../api/rankings';
import { getFeedComments, FeedCommentActivity } from '../../api/feed';
import { useAuth } from '../../context/AuthContext';
import { Event, LiveStream } from '../../types';

type NavProp = DrawerNavigationProp<DrawerParamList>;

const SectionHeader: React.FC<{ title: string; icon: string; count?: number; onMore?: () => void }> = ({
  title, icon, count, onMore,
}) => (
  <View style={styles.sectionHeader}>
    <View style={styles.sectionLeft}>
      <MaterialCommunityIcons name={icon as any} size={18} color="#a855f7" />
      <Text style={styles.sectionTitle}>{title}</Text>
      {count !== undefined && <Badge label={String(count)} color="#a855f7" small />}
    </View>
    {onMore && (
      <TouchableOpacity onPress={onMore} activeOpacity={0.7}>
        <Text style={styles.moreText}>See all</Text>
      </TouchableOpacity>
    )}
  </View>
);

const LiveStreamCard: React.FC<{ stream: LiveStream; onPress: () => void }> = ({ stream, onPress }) => (
  <Card onPress={onPress} style={styles.streamCard}>
    <View style={styles.streamBanner}>
      <View style={styles.liveBadge}>
        <View style={styles.liveDot} />
        <Text style={styles.liveText}>LIVE</Text>
      </View>
      <View style={styles.viewerBadge}>
        <MaterialCommunityIcons name="eye" size={12} color="#fff" />
        <Text style={styles.viewerText}>{stream.viewerCount}</Text>
      </View>
    </View>
    <View style={styles.streamInfo}>
      <Avatar uri={stream.djAvatarUrl} name={stream.djName} size={32} />
      <View style={styles.streamText}>
        <Text style={styles.streamTitle} numberOfLines={1}>{stream.title}</Text>
        <Text style={styles.streamDJ} numberOfLines={1}>{stream.djName}</Text>
      </View>
    </View>
  </Card>
);

const UpcomingEventCard: React.FC<{ event: Event; onPress: () => void }> = ({ event, onPress }) => {
  const date = new Date(event.startDate);
  return (
    <Card onPress={onPress} style={styles.eventCard} outlined>
      <View style={styles.eventDateStrip}>
        <Text style={styles.eventMonth}>
          {date.toLocaleString('default', { month: 'short' }).toUpperCase()}
        </Text>
        <Text style={styles.eventDay}>{date.getDate()}</Text>
      </View>
      <View style={styles.eventInfo}>
        <Text style={styles.eventTitle} numberOfLines={2}>{event.title}</Text>
        <Text style={styles.eventVenue} numberOfLines={1}>{event.venueName}</Text>
        {event.djName && (
          <Text style={styles.eventDJ} numberOfLines={1}>{event.djName}</Text>
        )}
      </View>
    </Card>
  );
};

const FeedScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const { user } = useAuth();

  const [liveStreams, setLiveStreams] = useState<LiveStream[]>([]);
  const [liveEvents, setLiveEvents] = useState<Event[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [eventComments, setEventComments] = useState<FeedCommentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [snackbar, setSnackbar] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [streams, live, upcoming, comments] = await Promise.all([
        getLiveStreams(),
        getLiveEvents(),
        getUpcomingEvents(12),
        getFeedComments(8),
      ]);
      setLiveStreams(streams);
      setLiveEvents(live);
      setUpcomingEvents(upcoming);
      setEventComments(comments);
    } catch {
      setSnackbar('Failed to load feed. Pull to refresh.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const greetingHour = new Date().getHours();
  const greeting = greetingHour < 12 ? 'Good morning' : greetingHour < 18 ? 'Good afternoon' : 'Good evening';

  if (loading) return <LoadingSpinner fullScreen message="Loading your feed..." />;

  return (
    <View style={styles.root}>
      <PageHeader
        title="Home"
        subtitle={`${greeting}, ${user?.displayName?.split(' ')[0] || 'there'}`}
        actions={[
          { icon: 'bell-outline', onPress: () => navigation.navigate('NotificationsScreen') },
          { icon: 'cog-outline', onPress: () => navigation.navigate('ProfileStack') },
        ]}
      />
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentPad}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#a855f7" />}
        showsVerticalScrollIndicator={false}
      >
        {/* 3-column grid */}
        <View style={styles.grid}>
          {/* Column 1: Live Streams */}
          <View style={styles.col}>
            <SectionHeader
              title="Live Now"
              icon="broadcast"
              count={liveStreams.length}
              onMore={() => navigation.navigate('LiveStack')}
            />
            {liveStreams.length === 0 ? (
              <View style={styles.emptyCol}>
                <MaterialCommunityIcons name="broadcast-off" size={32} color="#374151" />
                <Text style={styles.emptyText}>No streams live</Text>
              </View>
            ) : (
              liveStreams.slice(0, 5).map((s) => (
                <LiveStreamCard
                  key={s.id}
                  stream={s}
                  onPress={() => navigation.navigate('LiveStack')}
                />
              ))
            )}
          </View>

          {/* Column 2: Upcoming Events */}
          <View style={styles.col}>
            <SectionHeader
              title="Upcoming Events"
              icon="calendar-star"
              count={upcomingEvents.length}
              onMore={() => navigation.navigate('DiscoverStack')}
            />
            {upcomingEvents.length === 0 ? (
              <View style={styles.emptyCol}>
                <MaterialCommunityIcons name="calendar-blank" size={32} color="#374151" />
                <Text style={styles.emptyText}>No upcoming events</Text>
              </View>
            ) : (
              upcomingEvents.slice(0, 6).map((e) => (
                <UpcomingEventCard
                  key={e.id}
                  event={e}
                  onPress={() => navigation.navigate('DiscoverStack')}
                />
              ))
            )}
          </View>

          {/* Column 3: Community */}
          <View style={styles.col}>
            <SectionHeader
              title="Event Feed"
              icon="message-text"
              count={eventComments.length}
            />
            {eventComments.slice(0, 4).map((comment) => (
              <Card key={comment.id} style={styles.commentCard} outlined>
                <Text style={styles.commentMeta} numberOfLines={1}>
                  <Text style={styles.commentName}>{comment.displayName}</Text>
                  {comment.event?.title ? ` at ${comment.event.title}` : ' at an event'}
                </Text>
                <Text style={styles.commentText} numberOfLines={3}>{comment.content}</Text>
                {comment.event?.venueName ? (
                  <Text style={styles.commentVenue} numberOfLines={1}>
                    {comment.event.venueName}{comment.event.city ? `, ${comment.event.city}` : ''}
                  </Text>
                ) : null}
              </Card>
            ))}

            <SectionHeader
              title="Community"
              icon="account-group"
              onMore={() => navigation.navigate('CommunityStack')}
            />
            <Card style={styles.communityCard}>
              <MaterialCommunityIcons name="forum" size={22} color="#a855f7" />
              <Text style={styles.communityTitle}>Forum</Text>
              <Text style={styles.communityDesc}>Discuss tracks, gigs, and gear with the community</Text>
              <TouchableOpacity
                style={styles.communityBtn}
                onPress={() => navigation.navigate('CommunityStack')}
                activeOpacity={0.7}
              >
                <Text style={styles.communityBtnText}>Browse Topics</Text>
              </TouchableOpacity>
            </Card>
            <Card style={styles.communityCard}>
              <MaterialCommunityIcons name="tournament" size={22} color="#10b981" />
              <Text style={styles.communityTitle}>Competitions</Text>
              <Text style={styles.communityDesc}>Enter DJ battles and vote for your favorites</Text>
              <TouchableOpacity
                style={[styles.communityBtn, styles.communityBtnGreen]}
                onPress={() => navigation.navigate('CompetitionsStack')}
                activeOpacity={0.7}
              >
                <Text style={styles.communityBtnText}>View Events</Text>
              </TouchableOpacity>
            </Card>
            <Card style={styles.communityCard}>
              <MaterialCommunityIcons name="trophy" size={22} color="#f59e0b" />
              <Text style={styles.communityTitle}>Rankings</Text>
              <Text style={styles.communityDesc}>See who's topping the global DJ charts</Text>
              <TouchableOpacity
                style={[styles.communityBtn, styles.communityBtnAmber]}
                onPress={() => navigation.navigate('RankingsStack')}
                activeOpacity={0.7}
              >
                <Text style={styles.communityBtnText}>View Rankings</Text>
              </TouchableOpacity>
            </Card>
          </View>
        </View>
      </ScrollView>

      {user?.role === 'dj' && (
        <FAB
          icon="broadcast"
          label="Go Live"
          onPress={() => navigation.navigate('LiveStack')}
          color="#a855f7"
        />
      )}

      <Snackbar
        message={snackbar}
        visible={!!snackbar}
        onDismiss={() => setSnackbar('')}
        type="error"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0a0a0f' },
  content: { flex: 1 },
  contentPad: { padding: 16, paddingBottom: 100 },
  grid: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  col: { flex: 1, gap: 8 },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 8, paddingHorizontal: 2, marginBottom: 4,
  },
  sectionLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { color: '#e5e7eb', fontSize: 15, fontWeight: '700' },
  moreText: { color: '#a855f7', fontSize: 12, fontWeight: '600' },
  streamCard: { marginBottom: 8, padding: 0, overflow: 'hidden' },
  streamBanner: {
    height: 80, backgroundColor: '#1a0f2e',
    flexDirection: 'row', justifyContent: 'space-between', padding: 8,
  },
  liveBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#ef4444', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
  liveText: { color: '#fff', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  viewerBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  viewerText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  streamInfo: { flexDirection: 'row', padding: 10, gap: 8, alignItems: 'center' },
  streamText: { flex: 1 },
  streamTitle: { color: '#f3f4f6', fontSize: 13, fontWeight: '600' },
  streamDJ: { color: '#a855f7', fontSize: 11 },
  eventCard: { marginBottom: 8, flexDirection: 'row', padding: 0, overflow: 'hidden' },
  eventDateStrip: {
    width: 52, backgroundColor: '#1a1a2e', alignItems: 'center',
    justifyContent: 'center', paddingVertical: 10,
  },
  eventMonth: { color: '#a855f7', fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  eventDay: { color: '#f3f4f6', fontSize: 20, fontWeight: '800' },
  eventInfo: { flex: 1, padding: 10, gap: 2 },
  eventTitle: { color: '#f3f4f6', fontSize: 13, fontWeight: '600' },
  eventVenue: { color: '#6b7280', fontSize: 11 },
  eventDJ: { color: '#a855f7', fontSize: 11 },
  emptyCol: { alignItems: 'center', paddingVertical: 32, gap: 8 },
  emptyText: { color: '#4b5563', fontSize: 13 },
  communityCard: { gap: 6, marginBottom: 8 },
  commentCard: { gap: 5, marginBottom: 8 },
  commentMeta: { color: '#9ca3af', fontSize: 12 },
  commentName: { color: '#f3f4f6', fontWeight: '800' },
  commentText: { color: '#e5e7eb', fontSize: 13, lineHeight: 18 },
  commentVenue: { color: '#6b7280', fontSize: 11 },
  communityTitle: { color: '#f3f4f6', fontSize: 14, fontWeight: '700' },
  communityDesc: { color: '#6b7280', fontSize: 12, lineHeight: 17 },
  communityBtn: {
    backgroundColor: 'rgba(168,85,247,0.2)', borderRadius: 8,
    paddingVertical: 7, paddingHorizontal: 12, alignSelf: 'flex-start', marginTop: 4,
  },
  communityBtnGreen: { backgroundColor: 'rgba(16,185,129,0.2)' },
  communityBtnAmber: { backgroundColor: 'rgba(245,158,11,0.2)' },
  communityBtnText: { color: '#e5e7eb', fontSize: 12, fontWeight: '600' },
});

export default FeedScreen;
