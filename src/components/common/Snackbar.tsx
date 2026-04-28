import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Text,
  TouchableOpacity,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface SnackbarProps {
  message: string;
  visible: boolean;
  onDismiss: () => void;
  actionLabel?: string;
  onAction?: () => void;
  duration?: number;
  type?: 'default' | 'success' | 'error' | 'warning';
}

const typeColors: Record<string, string> = {
  default: '#1e1e2e',
  success: '#064e3b',
  error: '#7f1d1d',
  warning: '#78350f',
};

const Snackbar: React.FC<SnackbarProps> = ({
  message,
  visible,
  onDismiss,
  actionLabel,
  onAction,
  duration = 3000,
  type = 'default',
}) => {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 10,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        dismiss();
      }, duration);
    } else {
      dismiss();
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [visible]);

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 100,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => onDismiss());
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          bottom: insets.bottom + 80,
          backgroundColor: typeColors[type],
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <Text style={styles.message} numberOfLines={2}>{message}</Text>
      <View style={styles.actions}>
        {actionLabel && onAction && (
          <TouchableOpacity
            onPress={() => {
              onAction();
              dismiss();
            }}
            style={styles.actionBtn}
          >
            <Text style={styles.actionText}>{actionLabel}</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={dismiss} style={styles.actionBtn}>
          <Text style={styles.dismissText}>DISMISS</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    zIndex: 9999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: 12,
  },
  message: {
    color: '#f3f4f6',
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  actionText: {
    color: '#a855f7',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  dismissText: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});

export default Snackbar;
