import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import PageHeader from '../../components/layout/PageHeader';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import Snackbar from '../../components/common/Snackbar';
import Button from '../../components/common/Button';
import { getVenueById, getVenues } from '../../api/events';
import { followVenue } from '../../api/follow';
import { Event, Venue } from '../../types';

const VenueDetailPane: React.FC<{
  venue: Venue;
  onEventPress: (event: Event) => void;
  onFollow: () => void;
  followLoading: boolean;
  onOpenFullPage: () => void;
}> = ({ venue, onEventPress, onFollow, followLoading, onOpenFullPage }) => {
  const upcomingEvents = (venue.upcomingEvents ?? venue.events ?? []) as Event[];

  return (
  <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.detailContent}>
    <View style={styles.detailBanner}>
      <View style={styles.detailBannerBg} />
      <View style={styles.detailBannerOverlay}>
        <View style={styles.venueLogoWrap}>
          <MaterialCommunityIcons name="office-building" size={36} color="#a855f7" />
        </View>
        <View style={styles.detailTitleGroup}>
          <Text style={styles.detailVenueName}>{venue.name}</Text>
          <Text style={styles.detailLocation}>
            <MaterialCommunityIcons name="map-marker" size={13} color="#6b7280" />
            {' '}{venue.city}, {venue.country}
          </Text>
        </View>
      </View>
    </View>

    <View style={styles.followRow}>
      <Button
        label={venue.isFollowing ? 'Following' : 'Follow Venue'}
        onPress={onFollow}
        loading={followLoading}
        variant={venue.isFollowing ? 'outlined' : 'filled'}
        icon={venue.isFollowing ? 'check-circle' : 'heart-outline'}
        color="#a855f7"
      />
      <Button
        label="Open Full Page"
        onPress={onOpenFullPage}
        variant="outlined"
        icon="open-in-new"
        size="sm"
      />
      {typeof venue.followersCount === 'number' && (
        <Text style={styles.followersText}>{venue.followersCount.toLocaleString()} followers</Text>
      )}
    </View>

    <View style={styles.statsRow}>
      {[
        { label: 'Capacity', value: venue.capacity?.toLocaleString() || 'N/A', icon: 'account-multiple' },
        { label: 'Events Hosted', value: venue.totalEventsHosted?.toString() || '0', icon: 'calendar-check' },
        { label: 'Upcoming', value: venue.upcomingEventsCount?.toString() || '0', icon: 'calendar-star' },
        { label: 'Rating', value: venue.rating ? `${venue.rating}/5` : 'N/A', icon: 'star' },
      ].map((s) => (
        <View key={s.label} style={styles.stat}>
          <MaterialCommunityIcons name={s.icon as any} size={18} color="#a855f7" />
          <Text style={styles.statValue}>{s.value}</Text>
          <Text style={styles.statLabel}>{s.label}</Text>
        </View>
      ))}
    </View>

    {venue.description && (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.description}>{venue.description}</Text>
      </View>
    )}

    {venue.genres && venue.genres.length > 0 && (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Genres</Text>
        <View style={styles.genres}>
          {venue.genres.map((g) => <Badge key={g} label={g} color="#10b981" />)}
        </View>
      </View>
    )}

    {venue.address && (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Address</Text>
        <Text style={styles.description}>{venue.address}</Text>
      </View>
    )}

    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Upcoming Events</Text>
      {upcomingEvents.length > 0 ? (
        upcomingEvents.map((event) => (
          <TouchableOpacity key={event.id} style={styles.eventRow} onPress={() => onEventPress(event)} activeOpacity={0.75}>
            <View>
              <Text style={styles.eventTitle}>{event.title}</Text>
              <Text style={styles.eventMeta}>
                {new Date(event.startDate).toLocaleDateString()} - {event.djName || 'DJ TBA'}
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={18} color="#6b7280" />
          </TouchableOpacity>
        ))
      ) : (
        <Text style={styles.description}>No upcoming events listed yet.</Text>
      )}
    </View>

    <View style={styles.contactSection}>
      {venue.contactEmail && (
        <View style={styles.contactRow}>
          <MaterialCommunityIcons name="email-outline" size={16} color="#6b7280" />
          <Text style={styles.contactText}>{venue.contactEmail}</Text>
        </View>
      )}
      {venue.contactPhone && (
        <View style={styles.contactRow}>
          <MaterialCommunityIcons name="phone-outline" size={16} color="#6b7280" />
          <Text style={styles.contactText}>{venue.contactPhone}</Text>
        </View>
      )}
    </View>

    <Button label="Propose Booking" onPress={() => {}} icon="calendar-plus" fullWidth color="#10b981" style={{ marginTop: 12 }} />
  </ScrollView>
  );
};

const VenueCard: React.FC<{ venue: Venue; onPress: () => void; isSelected?: boolean }> = ({
  venue, onPress, isSelected,
}) => (
  <TouchableOpacity
    style={[styles.venueCard, isSelected && styles.venueCardSelected]}
    onPress={onPress}
    activeOpacity={0.75}
  >
    <View style={styles.venueCardBanner}>
      <MaterialCommunityIcons name="office-building" size={28} color="#a855f730" />
    </View>
    <View style={styles.venueCardInfo}>
      <Text style={styles.venueCardName} numberOfLines={1}>{venue.name}</Text>
      <Text style={styles.venueCardCity} numberOfLines={1}>
        <MaterialCommunityIcons name="map-marker" size={11} color="#6b7280" />
        {' '}{venue.city}
      </Text>
      <View style={styles.venueCardMeta}>
        {venue.capacity && (
          <Text style={styles.venueCapacity}>Cap: {venue.capacity.toLocaleString()}</Text>
        )}
        {venue.upcomingEventsCount !== undefined && venue.upcomingEventsCount > 0 && (
          <Badge label={`${venue.upcomingEventsCount} events`} color="#3b82f6" small />
        )}
      </View>
    </View>
    {isSelected && <View style={styles.selectedIndicator} />}
  </TouchableOpacity>
);

const VenuesScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [selected, setSelected] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [snackbar, setSnackbar] = useState('');
  const [snackType, setSnackType] = useState<'default' | 'success' | 'error'>('default');

  const fetchVenues = useCallback(async () => {
    try {
      const data = await getVenues();
      setVenues(data);
      if (data.length > 0 && !selected) setSelected(data[0]);
    } catch {
      setSnackbar('Failed to load venues');
      setSnackType('error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchVenues(); }, [fetchVenues]);

  const selectVenue = async (venue: Venue) => {
    setSelected(venue);
    try {
      setSelected(await getVenueById(venue.id));
    } catch {
      setSelected(venue);
    }
  };

  const handleFollowVenue = async () => {
    if (!selected) return;
    setFollowLoading(true);
    try {
      const result = await followVenue(selected.id);
      const updated = {
        ...selected,
        isFollowing: result.following,
        followersCount: result.count ?? selected.followersCount,
      };
      setSelected(updated);
      setVenues((items) => items.map((venue) => (venue.id === updated.id ? { ...venue, ...updated } : venue)));
      setSnackbar(updated.isFollowing ? `Following ${updated.name}` : `Unfollowed ${updated.name}`);
      setSnackType('success');
    } catch (err: any) {
      setSnackbar(err?.response?.data?.error || 'Could not update venue follow status');
      setSnackType('error');
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <View style={styles.root}>
      <PageHeader
        title="Venues"
        subtitle={`${venues.length} venues`}
        showBack
        onBack={() => navigation.goBack()}
        actions={[{ icon: 'home', onPress: () => navigation.dispatch(DrawerActions.jumpTo('HomeStack' as any)) }]}
      />

      {/* 3-column grid + detail pane */}
      <View style={styles.body}>
        {/* Left: 3-col grid */}
        <View style={styles.listPane}>
          <FlatList
            data={venues}
            keyExtractor={(i) => i.id}
            numColumns={3}
            columnWrapperStyle={styles.colWrap}
            contentContainerStyle={styles.gridContent}
            renderItem={({ item }) => (
              <View style={styles.gridItem}>
                <VenueCard
                  venue={item}
                  onPress={() => selectVenue(item)}
                  isSelected={selected?.id === item.id}
                />
              </View>
            )}
            ListEmptyComponent={
              <EmptyState icon="office-building-outline" title="No venues found" />
            }
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchVenues(); }} tintColor="#a855f7" />
            }
            showsVerticalScrollIndicator={false}
          />
        </View>

        {/* Right: Detail */}
        <View style={styles.detailPane}>
          {selected ? (
            <VenueDetailPane
              venue={selected}
              onEventPress={(event) => navigation.navigate('EventDetail', { eventId: event.id })}
              onFollow={handleFollowVenue}
              followLoading={followLoading}
              onOpenFullPage={() => navigation.navigate('VenueDetail', { venueId: String(selected.id) })}
            />
          ) : (
            <EmptyState icon="office-building-outline" title="Select a venue" message="Tap a venue card to view details" />
          )}
        </View>
      </View>

      <Snackbar message={snackbar} visible={!!snackbar} onDismiss={() => setSnackbar('')} type={snackType} />
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0a0a0f' },
  body: { flex: 1, flexDirection: 'row' },
  listPane: { flex: 3, borderRightWidth: 1, borderRightColor: '#1e1e2e' },
  gridContent: { padding: 12, paddingBottom: 80 },
  colWrap: { gap: 10, marginBottom: 10 },
  gridItem: { flex: 1 },
  venueCard: {
    backgroundColor: '#12121a', borderRadius: 14, overflow: 'hidden',
    borderWidth: 1, borderColor: '#1e1e2e', position: 'relative',
  },
  venueCardSelected: { borderColor: '#a855f7', backgroundColor: '#1a0f2e' },
  venueCardBanner: {
    height: 70, backgroundColor: '#1a1a2e',
    justifyContent: 'center', alignItems: 'center',
  },
  venueCardInfo: { padding: 10, gap: 3 },
  venueCardName: { color: '#f3f4f6', fontSize: 13, fontWeight: '700' },
  venueCardCity: { color: '#6b7280', fontSize: 11 },
  venueCardMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' },
  venueCapacity: { color: '#4b5563', fontSize: 10 },
  selectedIndicator: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, backgroundColor: '#a855f7' },
  detailPane: { flex: 2, backgroundColor: '#0a0a0f' },
  detailContent: { padding: 20, paddingBottom: 80 },
  detailBanner: { borderRadius: 16, overflow: 'hidden', marginBottom: 16, height: 130 },
  detailBannerBg: { ...StyleSheet.absoluteFillObject, backgroundColor: '#1a0f2e' },
  detailBannerOverlay: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', padding: 16, gap: 12 },
  venueLogoWrap: {
    width: 60, height: 60, borderRadius: 14,
    backgroundColor: '#12121a', justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#a855f7',
  },
  detailTitleGroup: { flex: 1, gap: 3 },
  detailVenueName: { color: '#f3f4f6', fontSize: 20, fontWeight: '800' },
  detailLocation: { color: '#6b7280', fontSize: 13 },
  followRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  followersText: { color: '#6b7280', fontSize: 13 },
  statsRow: {
    flexDirection: 'row', backgroundColor: '#12121a', borderRadius: 14, padding: 14,
    marginBottom: 16, borderWidth: 1, borderColor: '#1e1e2e',
  },
  stat: { flex: 1, alignItems: 'center', gap: 3 },
  statValue: { color: '#f3f4f6', fontSize: 15, fontWeight: '700' },
  statLabel: { color: '#6b7280', fontSize: 10 },
  section: { marginBottom: 16 },
  sectionTitle: { color: '#9ca3af', fontSize: 11, fontWeight: '700', letterSpacing: 1.2, marginBottom: 8, textTransform: 'uppercase' },
  description: { color: '#9ca3af', fontSize: 14, lineHeight: 21 },
  genres: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  contactSection: { gap: 8, marginBottom: 8 },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  contactText: { color: '#6b7280', fontSize: 13 },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#1e1e2e',
    paddingTop: 10,
    marginTop: 8,
  },
  eventTitle: { color: '#f3f4f6', fontSize: 14, fontWeight: '700' },
  eventMeta: { color: '#9ca3af', fontSize: 12, marginTop: 2 },
});

export default VenuesScreen;
