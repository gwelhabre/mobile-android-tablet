import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import PageHeader from '../../components/layout/PageHeader';
import DJCard from '../../components/dj/DJCard';
import EventCard from '../../components/events/EventCard';
import Card from '../../components/common/Card';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { searchDJs } from '../../api/dj';
import { searchEvents, searchVenues } from '../../api/events';
import { DJProfile, Event, Venue } from '../../types';

type Tab = 'djs' | 'events' | 'venues';

const TAB_LABELS: { key: Tab; label: string; icon: string }[] = [
  { key: 'djs', label: 'DJs', icon: 'account-music' },
  { key: 'events', label: 'Events', icon: 'calendar-star' },
  { key: 'venues', label: 'Venues', icon: 'office-building' },
];

const SearchScreen: React.FC = () => {
  const navigation = useNavigation();
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('djs');
  const [loading, setLoading] = useState(false);
  const [djs, setDJs] = useState<DJProfile[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [searched, setSearched] = useState(false);

  const handleSearch = useCallback(async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const [djResults, eventResults, venueResults] = await Promise.all([
        searchDJs(q),
        searchEvents(q),
        searchVenues(q),
      ]);
      setDJs(djResults);
      setEvents(eventResults);
      setVenues(venueResults);
    } catch {
      // silent fail
    } finally {
      setLoading(false);
    }
  }, []);

  const totalResults = djs.length + events.length + venues.length;

  const renderVenueItem = ({ item }: { item: Venue }) => (
    <Card style={styles.venueCard} outlined onPress={() => {}}>
      <MaterialCommunityIcons name="office-building" size={20} color="#a855f7" />
      <View style={styles.venueInfo}>
        <Text style={styles.venueName}>{item.name}</Text>
        <Text style={styles.venueCity}>{item.city}, {item.country}</Text>
      </View>
    </Card>
  );

  return (
    <View style={styles.root}>
      <PageHeader
        title="Search"
        subtitle="Find DJs, Events, Venues"
        actions={[{ icon: 'home', onPress: () => navigation.dispatch(DrawerActions.jumpTo('HomeStack' as any)) }]}
      />

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <MaterialCommunityIcons name="magnify" size={22} color="#6b7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search across Disk Rider Live..."
            placeholderTextColor="#4b5563"
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => handleSearch(query)}
            returnKeyType="search"
            autoFocus
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => { setQuery(''); setSearched(false); }} activeOpacity={0.7}>
              <MaterialCommunityIcons name="close-circle" size={20} color="#6b7280" />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.searchBtn}
            onPress={() => handleSearch(query)}
            activeOpacity={0.8}
          >
            <Text style={styles.searchBtnText}>Search</Text>
          </TouchableOpacity>
        </View>

        {searched && !loading && (
          <Text style={styles.resultCount}>
            {totalResults} result{totalResults !== 1 ? 's' : ''} for "{query}"
          </Text>
        )}
      </View>

      {/* Tab Panels */}
      <View style={styles.tabRow}>
        {TAB_LABELS.map((tab) => {
          const count = tab.key === 'djs' ? djs.length : tab.key === 'events' ? events.length : venues.length;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name={tab.icon as any}
                size={18}
                color={activeTab === tab.key ? '#a855f7' : '#6b7280'}
              />
              <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>
                {tab.label}
              </Text>
              {searched && (
                <View style={[styles.tabBadge, activeTab === tab.key && styles.tabBadgeActive]}>
                  <Text style={styles.tabBadgeText}>{count}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Results - side by side for tablet */}
      <View style={styles.resultsContainer}>
        {loading ? (
          <LoadingSpinner message={`Searching for "${query}"...`} />
        ) : !searched ? (
          <EmptyState
            icon="magnify"
            title="Start searching"
            message="Enter a name, genre, or location to find DJs, events, and venues"
          />
        ) : (
          <View style={styles.resultPanels}>
            {/* DJs Panel */}
            <View style={[styles.panel, activeTab === 'djs' ? styles.panelActive : styles.panelInactive]}>
              <Text style={styles.panelTitle}>DJs ({djs.length})</Text>
              {djs.length === 0 ? (
                <EmptyState icon="account-music-outline" title="No DJs found" />
              ) : (
                <FlatList
                  data={djs}
                  keyExtractor={(i) => i.id}
                  renderItem={({ item }) => (
                    <DJCard dj={item} onPress={() => {}} compact />
                  )}
                  scrollEnabled={false}
                />
              )}
            </View>

            {/* Events Panel */}
            <View style={[styles.panel, activeTab === 'events' ? styles.panelActive : styles.panelInactive]}>
              <Text style={styles.panelTitle}>Events ({events.length})</Text>
              {events.length === 0 ? (
                <EmptyState icon="calendar-blank-outline" title="No events found" />
              ) : (
                <FlatList
                  data={events}
                  keyExtractor={(i) => i.id}
                  renderItem={({ item }) => (
                    <EventCard event={item} onPress={() => {}} compact />
                  )}
                  scrollEnabled={false}
                />
              )}
            </View>

            {/* Venues Panel */}
            <View style={[styles.panel, activeTab === 'venues' ? styles.panelActive : styles.panelInactive]}>
              <Text style={styles.panelTitle}>Venues ({venues.length})</Text>
              {venues.length === 0 ? (
                <EmptyState icon="office-building-outline" title="No venues found" />
              ) : (
                <FlatList
                  data={venues}
                  keyExtractor={(i) => i.id}
                  renderItem={renderVenueItem}
                  scrollEnabled={false}
                />
              )}
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0a0a0f' },
  searchSection: { padding: 16, gap: 8, borderBottomWidth: 1, borderBottomColor: '#1e1e2e' },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#12121a', borderRadius: 14, borderWidth: 1.5,
    borderColor: '#1e1e2e', paddingHorizontal: 14, paddingVertical: 10,
  },
  searchInput: { flex: 1, color: '#f3f4f6', fontSize: 16 },
  searchBtn: {
    backgroundColor: '#a855f7', borderRadius: 10,
    paddingHorizontal: 18, paddingVertical: 9,
  },
  searchBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  resultCount: { color: '#6b7280', fontSize: 13 },
  tabRow: {
    flexDirection: 'row', paddingHorizontal: 16, borderBottomWidth: 1,
    borderBottomColor: '#1e1e2e', gap: 4,
  },
  tab: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: '#a855f7' },
  tabLabel: { color: '#6b7280', fontSize: 14, fontWeight: '600' },
  tabLabelActive: { color: '#a855f7' },
  tabBadge: {
    backgroundColor: '#1e1e2e', borderRadius: 10,
    paddingHorizontal: 7, paddingVertical: 2,
  },
  tabBadgeActive: { backgroundColor: 'rgba(168,85,247,0.2)' },
  tabBadgeText: { color: '#9ca3af', fontSize: 11, fontWeight: '700' },
  resultsContainer: { flex: 1 },
  resultPanels: { flex: 1, flexDirection: 'row' },
  panel: {
    flex: 1, padding: 16, borderRightWidth: 1, borderRightColor: '#1e1e2e',
  },
  panelActive: { opacity: 1 },
  panelInactive: { opacity: 0.5 },
  panelTitle: {
    color: '#9ca3af', fontSize: 12, fontWeight: '700',
    letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12,
  },
  venueCard: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  venueInfo: { flex: 1 },
  venueName: { color: '#f3f4f6', fontSize: 14, fontWeight: '600' },
  venueCity: { color: '#6b7280', fontSize: 12 },
});

export default SearchScreen;
