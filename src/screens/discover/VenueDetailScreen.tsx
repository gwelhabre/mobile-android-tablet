import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { DiscoverStackParamList } from '../../navigation/stacks/DiscoverStack';
import { Event, Venue } from '../../types';
import { getVenueDetail } from '../../api/rankings';
import { followVenue } from '../../api/follow';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import EventCard from '../../components/events/EventCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PageHeader from '../../components/layout/PageHeader';

type VenueDetailRoute = RouteProp<{ VenueDetail: { venueId: string } }, 'VenueDetail'>;
type Nav = NativeStackNavigationProp<DiscoverStackParamList>;

const VenueDetailScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<VenueDetailRoute>();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    getVenueDetail(route.params.venueId)
      .then(setVenue)
      .catch(() => Alert.alert('Error', 'Could not load venue details.'))
      .finally(() => setLoading(false));
  }, [route.params.venueId]);

  const handleFollow = async () => {
    if (!venue) return;
    setFollowLoading(true);
    try {
      const result = await followVenue(String(venue.id));
      setVenue({
        ...venue,
        isFollowing: result.following,
        followersCount: result.count ?? venue.followersCount,
      });
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error || 'Could not update follow status.');
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;
  if (!venue) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>Venue not found</Text>
      </View>
    );
  }

  const upcomingEvents = (venue.upcomingEvents ?? venue.events ?? []) as Event[];

  return (
    <View style={styles.root}>
      <PageHeader title={venue.name} subtitle={[venue.city, venue.country].filter(Boolean).join(', ')} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.iconWrap}>
            <MaterialCommunityIcons name="domain" size={44} color="#10b981" />
          </View>
          <View style={styles.heroText}>
            <Text style={styles.name}>{venue.name}</Text>
            <Badge label={venue.venueType || 'Venue'} color="#10b981" small />
            <Text style={styles.location}>{[venue.address, venue.city, venue.country].filter(Boolean).join(', ')}</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{venue.capacity?.toLocaleString() ?? '-'}</Text>
            <Text style={styles.statLabel}>Capacity</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{venue.upcomingEventsCount ?? upcomingEvents.length}</Text>
            <Text style={styles.statLabel}>Upcoming</Text>
          </View>
          {typeof venue.followersCount === 'number' ? (
            <View style={styles.stat}>
              <Text style={styles.statValue}>{venue.followersCount.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.followSection}>
          <Button
            label={venue.isFollowing ? 'Following' : 'Follow Venue'}
            onPress={handleFollow}
            loading={followLoading}
            variant={venue.isFollowing ? 'outlined' : 'filled'}
            fullWidth
          />
        </View>

        {venue.description ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.description}>{venue.description}</Text>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upcoming Events</Text>
          {upcomingEvents.length > 0 ? (
            upcomingEvents.map((event) => (
              <EventCard
                key={String(event.id)}
                event={event as Event}
                onPress={() => navigation.navigate('EventDetail', { eventId: String(event.id) })}
              />
            ))
          ) : (
            <Text style={styles.emptyText}>No upcoming events listed yet.</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0a0a0f' },
  container: { flex: 1 },
  content: { paddingBottom: 60 },
  hero: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 20, borderBottomWidth: 1, borderBottomColor: '#1f1f2e' },
  iconWrap: { width: 84, height: 84, borderRadius: 16, backgroundColor: 'rgba(16,185,129,0.12)', alignItems: 'center', justifyContent: 'center' },
  heroText: { flex: 1, gap: 6 },
  name: { color: '#f9fafb', fontSize: 22, fontWeight: '800' },
  location: { color: '#9ca3af', fontSize: 13, lineHeight: 18 },
  statsRow: { flexDirection: 'row', paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: '#1f1f2e' },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { color: '#f9fafb', fontSize: 20, fontWeight: '800' },
  statLabel: { color: '#6b7280', fontSize: 12, marginTop: 2 },
  followSection: { padding: 20, gap: 10, borderBottomWidth: 1, borderBottomColor: '#1f1f2e' },
  section: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#1f1f2e' },
  sectionTitle: { color: '#f9fafb', fontSize: 17, fontWeight: '700', marginBottom: 12 },
  description: { color: '#9ca3af', fontSize: 14, lineHeight: 22 },
  emptyState: { flex: 1, backgroundColor: '#0a0a0f', alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { color: '#f9fafb', fontSize: 18, fontWeight: '700' },
  emptyText: { color: '#6b7280', fontSize: 13 },
});

export default VenueDetailScreen;
