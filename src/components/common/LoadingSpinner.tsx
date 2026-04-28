import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';

interface LoadingSpinnerProps {
  message?: string;
  fullScreen?: boolean;
  size?: 'small' | 'large';
  color?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message,
  fullScreen = false,
  size = 'large',
  color = '#a855f7',
}) => {
  return (
    <View style={[styles.container, fullScreen && styles.fullScreen]}>
      <ActivityIndicator size={size} color={color} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 32,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  fullScreen: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  message: {
    color: '#6b7280',
    fontSize: 14,
  },
});

export default LoadingSpinner;
