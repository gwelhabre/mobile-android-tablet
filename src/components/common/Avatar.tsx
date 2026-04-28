import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

interface AvatarProps {
  uri?: string;
  name?: string;
  size?: number;
  borderColor?: string;
}

const getInitials = (name: string): string => {
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0][0]?.toUpperCase() || '?';
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

const colorFromName = (name: string): string => {
  const colors = ['#a855f7', '#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#ec4899', '#06b6d4'];
  const idx = name.charCodeAt(0) % colors.length;
  return colors[idx];
};

const Avatar: React.FC<AvatarProps> = ({ uri, name = '', size = 40, borderColor }) => {
  const initials = name ? getInitials(name) : '?';
  const bgColor = colorFromName(name || '?');
  const fontSize = Math.max(10, size * 0.35);

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[
          styles.avatar,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: borderColor ? 2 : 0,
            borderColor: borderColor || 'transparent',
          },
        ]}
      />
    );
  }

  return (
    <View
      style={[
        styles.avatar,
        styles.fallback,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: `${bgColor}30`,
          borderWidth: borderColor ? 2 : 0,
          borderColor: borderColor || 'transparent',
        },
      ]}
    >
      <Text style={[styles.initials, { fontSize, color: bgColor }]}>{initials}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  avatar: {
    overflow: 'hidden',
  },
  fallback: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    fontWeight: '700',
  },
});

export default Avatar;
