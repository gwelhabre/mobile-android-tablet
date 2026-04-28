import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';

interface BadgeProps {
  label: string;
  color?: string;
  textColor?: string;
  small?: boolean;
  style?: ViewStyle;
  outlined?: boolean;
}

const Badge: React.FC<BadgeProps> = ({
  label,
  color = '#a855f7',
  textColor,
  small = false,
  style,
  outlined = false,
}) => {
  const resolvedTextColor = textColor || (outlined ? color : '#fff');

  return (
    <View
      style={[
        styles.badge,
        small && styles.small,
        outlined
          ? { backgroundColor: 'transparent', borderWidth: 1, borderColor: color }
          : { backgroundColor: `${color}30` },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          small && styles.textSmall,
          { color: outlined ? color : resolvedTextColor },
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
