import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { RankingEntry } from '../../types';
import Avatar from '../common/Avatar';

interface RankingRowProps {
  entry: RankingEntry;
  onPress?: () => void;
}

const getMedalColor = (pos: number): string => {
  if (pos === 1) return '#fbbf24';
  if (pos === 2) return '#9ca3af';
  if (pos === 3) return '#d97706';
  return '#374151';
};

const RankingRow: React.FC<RankingRowProps> = ({ entry, onPress }) => {
  const changeIcon = entry.change > 0 ? 'arrow-up' : entry.change < 0 ? 'arrow-down' : 'minus';
  const changeColor = entry.change > 0 ? '#10b981' : entry.change < 0 ? '#ef4444' : '#6b7280';

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      {/* Position */}
      <View style={[styles.posCell, { borderColor: getMedalColor(entry.rank) }]}>
        <Text style={[styles.posText, { color: getMedalColor(entry.rank) }]}>
          {entry.rank}
        </Text>
      </View>

      {/* DJ Info */}
      <Avatar uri={entry.avatar} name={entry.stageName} size={40} />
      <View style={styles.djInfo}>
        <Text style={styles.djName} numberOfLines={1}>{entry.stageName}</Text>
        <Text style={styles.location} numberOfLines={1}>{entry.city}, {entry.country}</Text>
      </View>

      {/* Genre */}
      <Text style={[styles.cell, styles.genre]}>{entry.genre}</Text>

      {/* Score */}
      <Text style={[styles.cell, styles.score]}>{entry.score.toLocaleString()}</Text>

      {/* Followers */}
      <Text style={[styles.cell, styles.followers]}>
        {entry.followersCount >= 1000
          ? `${(entry.followersCount / 1000).toFixed(1)}k`
          : entry.followersCount}
      </Text>

      {/* Change */}
      <View style={[styles.changeCell]}>
        <MaterialCommunityIcons name={changeIcon as any} size={14} color={changeColor} />
        {entry.change !== 0 && (
          <Text style={[styles.changeText, { color: changeColor }]}>
            {Math.abs(entry.change)}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a2e',
    gap: 12,
  },
  posCell: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  posText: {
    fontSize: 14,
    fontWeight: '700',
  },
  djInfo: {
    flex: 2,
    minWidth: 0,
  },
  djName: {
    color: '#f3f4f6',
    fontSize: 14,
    fontWeight: '600',
  },
  location: {
    color: '#6b7280',
    fontSize: 12,
  },
  cell: {
    color: '#9ca3af',
    fontSize: 13,
    textAlign: 'right',
  },
  genre: {
    flex: 1,
    textAlign: 'left',
    color: '#a855f7',
    fontWeight: '500',
  },
  score: {
    flex: 1,
    color: '#10b981',
    fontWeight: '600',
  },
  followers: {
    flex: 1,
  },
  changeCell: {
    width: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 2,
  },
  changeText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default RankingRow;
