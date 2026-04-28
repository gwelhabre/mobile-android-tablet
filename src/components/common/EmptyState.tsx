import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Button from './Button';

interface EmptyStateProps {
  icon?: string;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'inbox-outline',
  title,
  message,
  actionLabel,
  onAction,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <MaterialCommunityIcons name={icon as any} size={56} color="#374151" />
      </View>
      <Text style={styles.title}>{title}</Text>
      {message && <Text style={styles.message}>{message}</Text>}
      {actionLabel && onAction && (
        <Button
          label={actionLabel}
          onPress={onAction}
          variant="outlined"
          style={styles.actionBtn}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 40,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#12121a',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    color: '#9ca3af',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  message: {
    color: '#4b5563',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  actionBtn: {
    marginTop: 8,
  },
});

export default EmptyState;
