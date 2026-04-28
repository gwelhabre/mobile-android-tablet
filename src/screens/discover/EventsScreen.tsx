import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import PageHeader from '../../components/layout/PageHeader';
import TwoPane from '../../components/layout/TwoPane';
import EventCard from '../../components/events/EventCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import Snackbar from '../../components/common/Snackbar';
import EventDetailScreen from './EventDetailScreen';
import { getEvents } from '../../api/events';
import { Event } from '../../types';

const EventsScreen: React.FC = () => {
  const navigation = useNavigation();
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [snackbar, setSnackbar] = useState('');

  const fetchEvents = useCallback(async () => {
    try {
      const data = await getEvents();
      setEvents(data);
      if (data.length > 0 && !selectedEvent) setSelectedEvent(data[0]);
    } catch {
      setSnackbar('Failed to load events');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  if (loading) return <LoadingSpinner fullScreen />;

  const leftContent = (
    <FlatList
      data={events}
      keyExtractor={(i) => i.id}
      renderItem={({ item }) => (
        <EventCard
          event={item}
          onPress={() => setSelectedEvent(item)}
          isSelected={selectedEvent?.id === item.id}
        />
      )}
      ListEmptyComponent={
        <EmptyState icon="calendar-blank-outline" title="No events found" />
      }
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); fetchEvents(); }}
          tintColor="#a855f7"
        />
      }
      showsVerticalScrollIndicator={false}
      scrollEnabled={false}
      contentContainerStyle={{ paddingBottom: 20 }}
    />
  );

  const rightContent = selectedEvent ? (
    <EventDetailScreen eventId={selectedEvent.id} eventData={selectedEvent} />
  ) : (
    <EmptyState icon="calendar-blank-outline" title="Select an event" message="Tap an event to view details" />
  );

  return (
    <View style={styles.root}>
      <PageHeader
        title="Events"
        subtitle={`${events.length} events`}
        showBack
        onBack={() => navigation.goBack()}
        actions={[{ icon: 'home', onPress: () => navigation.dispatch(DrawerActions.jumpTo('HomeStack' as any)) }]}
      />
      <TwoPane
        leftContent={leftContent}
        rightContent={rightContent}
        leftFlex={2}
        rightFlex={3}
      />
      <Snackbar message={snackbar} visible={!!snackbar} onDismiss={() => setSnackbar('')} type="error" />
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0a0a0f' },
});

export default EventsScreen;
