import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Event } from '../../types';
import Badge from '../common/Badge';

interface EventCardProps {
  event: Event;
  onPress: () => void;
  isSelected?: boolean;
  compact?: boolean;
}

const statusColors: Record<string, string> = {
  upcoming: '#3b82f6',
  live: '#ef4444',
  past: '#6b7280',
  cancelled: '#9ca3af',
};

const EventCard: React.FC<EventCardProps> = ({ event, onPress, isSelected = false, compact = false }) => {
  const date = new Date(event.startDate);
  const month = date.toLocaleString('default', { month: 'short' }).toUpperCase();
  const day = date.getDate();

  return (
    <TouchableOpacity
      style={[styles.card, isSelected && styles.selected, compact && styles.compact]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      {/* Date Block */}
      <View style={styles.dateBlock}>
        <Text style={styles.month}>{month}</Text>
        <Text style={styles.day}>{day}</Text>
      </View>

      {/* Info */}
      <View style={styles.info}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={2}>{event.title}</Text>
          <Badge
            label={event.status.toUpperCase()}
            color={statusColors[event.status]}
            small
          />
        </View>
        <Text style={styles.venue} numberOfLines={1}>
          <MaterialCommunityIcons name="map-marker" size={12} color="#6b7280" />
          {'  '}{event.venueName} · {event.venueCity}
        </Text>
        {!compact && (
          <View style={styles.footer}>
            {event.djName && (
              <View style={styles.djRow}>
                <MaterialCommunityIcons name="account-music" size={13} color="#a855f7" />
                <Text style={styles.djName}>{event.djName}</Text>
              </View>
            )}
            {event.ticketPrice !== undefined && (
              <Text style={styles.price}>
                {event.ticketPrice === 0 ? 'Free' : `$${event.ticketPrice}`}
              </Text>
            )}
          </View>
        )}
      </View>

      {isSelected && <View style={styles.selectedBar} />}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#12121a',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1e1e2e',
    marginBottom: 8,
    alignItems: 'center',
  },
  selected: {
    borderColor: '#a855f7',
    backgroundColor: '#1a0f2e',
  },
  compact: {
    paddingVertical: 8,
  },
  dateBlock: {
    width: 56,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
  },
  month: {
    color: '#a855f7',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  day: {
    color: '#f3f4f6',
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 26,
  },
  info: {
    flex: 1,
    padding: 12,
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    justifyContent: 'space-between',
  },
  title: {
    color: '#f3f4f6',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    lineHeight: 18,
  },
  venue: {
    color: '#6b7280',
    fontSize: 12,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  djRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  djName: {
    color: '#a855f7',
    fontSize: 12,
    fontWeight: '500',
  },
  price: {
    color: '#10b981',
    fontSize: 13,
    fontWeight: '700',
  },
  selectedBar: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: '#a855f7',
  },
});

export default EventCard;
