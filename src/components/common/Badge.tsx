import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';

/** Cross-platform variant aliases mapped to colors. */
type Variant = 'purple' | 'emerald' | 'gold' | 'amber' | 'red' | 'blue' | 'gray' | 'yellow' | 'green';

const VARIANT_COLORS: Record<Variant, string> = {
  purple: '#a855f7',
  emerald: '#10b981',
  green: '#10b981',
  gold: '#f59e0b',
  amber: '#f59e0b',
  yellow: '#f59e0b',
  red: '#ef4444',
  blue: '#3b82f6',
  gray: '#6b7280',
};

interface BadgeProps {
  label: string;
  /** Direct color override (tablet API). */
  color?: string;
  /** Cross-platform alias (iOS/iPad API) — mapped to a color. */
  variant?: Variant;
  textColor?: string;
  small?: boolean;
  /** Cross-platform alias for `small`. */
  size?: 'sm' | 'md';
  style?: ViewStyle;
  outlined?: boolean;
}

const Badge: React.FC<BadgeProps> = ({
  label,
  color,
  variant,
  textColor,
  small,
  size,
  style,
  outlined = false,
}) => {
  const resolvedColor = color ?? (variant ? VARIANT_COLORS[variant] : undefined) ?? '#a855f7';
  const isSmall = small ?? size === 'sm' ?? false;
  const resolvedTextColor = textColor || (outlined ? resolvedColor : '#fff');

  return (
    <View
      style={[
        styles.badge,
        isSmall && styles.small,
        outlined
          ? { backgroundColor: 'transparent', borderWidth: 1, borderColor: resolvedColor }
          : { backgroundColor: `${resolvedColor}30` },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          isSmall && styles.textSmall,
          { color: outlined ? resolvedColor : resolvedTextColor },
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  small: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  textSmall: {
    fontSize: 10,
    letterSpacing: 0.5,
  },
});

export default Badge;
