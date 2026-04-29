import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface StatItem {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  value: string;
  label: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}

interface StatGridProps {
  stats: StatItem[];
  columns?: number;
  style?: ViewStyle;
}

export default function StatGrid({ stats, columns = 4, style }: StatGridProps) {
  return (
    <View style={[styles.container, style]}>
      {stats.map((stat, index) => (
        <View
          key={index}
          style={[styles.card, { flex: 1 / columns }]}
        >
          <View style={[styles.iconWrapper, { backgroundColor: `${stat.iconColor || '#7c3aed'}20` }]}>
            <Ionicons
              name={stat.icon}
              size={24}
              color={stat.iconColor || '#7c3aed'}
            />
          </View>
          <Text style={styles.value}>{stat.value}</Text>
          <Text style={styles.label}>{stat.label}</Text>
          {stat.trend && stat.trendValue && (
            <View style={[styles.trendBadge, stat.trend === 'up' ? styles.trendUp : styles.trendDown]}>
              <Ionicons
                name={stat.trend === 'up' ? 'trending-up' : 'trending-down'}
                size={11}
                color={stat.trend === 'up' ? '#10b981' : '#ef4444'}
              />
              <Text style={[styles.trendText, stat.trend === 'up' ? styles.trendTextUp : styles.trendTextDown]}>
                {stat.trendValue}
              </Text>
            </View>
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 28,
    paddingVertical: 20,
  },
  card: {
    backgroundColor: '#13131a',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1e1e2e',
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  value: {
    fontSize: 24,
    fontWeight: '800',
    color: '#f1f5f9',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  label: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    gap: 3,
  },
  trendUp: {
    backgroundColor: 'rgba(16,185,129,0.1)',
  },
  trendDown: {
    backgroundColor: 'rgba(239,68,68,0.1)',
  },
  trendText: {
    fontSize: 11,
    fontWeight: '600',
  },
  trendTextUp: {
    color: '#10b981',
  },
  trendTextDown: {
    color: '#ef4444',
  },
});
