import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { DJProfile } from '../../types';
import Avatar from '../common/Avatar';
import Badge from '../common/Badge';

interface DJCardProps {
  dj: DJProfile;
  onPress: () => void;
  isSelected?: boolean;
  compact?: boolean;
}

const DJCard: React.FC<DJCardProps> = ({ dj, onPress, isSelected = false, compact = false }) => {
  return (
    <TouchableOpacity
      style={[styles.card, isSelected && styles.selectedCard, compact && styles.compact]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={styles.bannerArea}>
        <View style={[styles.banner, isSelected && styles.bannerSelected]}>
          <MaterialCommunityIcons name="music-note" size={24} color="#a855f730" />
        </View>
        <Avatar
          uri={dj.avatarUrl}
          name={dj.stageName}
          size={compact ? 44 : 56}
          borderColor={isSelected ? '#a855f7' : '#1e1e2e'}
        />
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{dj.stageName}</Text>
        <Text style={styles.location} numberOfLines={1}>
          {dj.city}, {dj.country}
        </Text>
        {!compact && (
          <>
            <View style={styles.genres}>
              {dj.genres.slice(0, 2).map((g) => (
                <Badge key={g} label={g} color="#a855f7" small />
              ))}
            </View>
            <View style={styles.stats}>
              <View style={styles.stat}>
                <MaterialCommunityIcons name="trophy" size={13} color="#f59e0b" />
                <Text style={styles.statText}>#{dj.rankingPosition}</Text>
              </View>
              <View style={styles.stat}>
                <MaterialCommunityIcons name="account-multiple" size={13} color="#6b7280" />
                <Text style={styles.statText}>{(dj.followersCount / 1000).toFixed(1)}k</Text>
              </View>
              {dj.isAvailableForBooking && (
                <Badge label="BOOK" color="#10b981" small />
              )}
            </View>
          </>
        )}
      </View>
      {isSelected && <View style={styles.selectedIndicator} />}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#12121a',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1e1e2e',
    marginBottom: 8,
  },
  selectedCard: {
    borderColor: '#a855f7',
    backgroundColor: '#1a0f2e',
  },
  compact: {
    flexDirection: 'row',
    padding: 10,
    gap: 10,
    alignItems: 'center',
  },
  bannerArea: {
    position: 'relative',
    marginBottom: 0,
  },
  banner: {
    height: 64,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerSelected: {
    backgroundColor: '#2a1040',
  },
  info: {
    padding: 12,
    gap: 4,
    flex: 1,
  },
  name: {
    color: '#f3f4f6',
    fontSize: 14,
    fontWeight: '700',
  },
  location: {
    color: '#6b7280',
    fontSize: 12,
  },
  genres: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  statText: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: '500',
  },
  selectedIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: '#a855f7',
  },
});

export default DJCard;
