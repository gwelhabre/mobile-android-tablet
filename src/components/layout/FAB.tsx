import React, { useState } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface FABAction {
  icon: string;
  label: string;
  onPress: () => void;
  color?: string;
}

interface FABProps {
  icon: string;
  onPress?: () => void;
  label?: string;
  color?: string;
  actions?: FABAction[];
  bottom?: number;
  right?: number;
}

const FAB: React.FC<FABProps> = ({
  icon,
  onPress,
  label,
  color = '#a855f7',
  actions,
  bottom = 24,
  right = 24,
}) => {
  const [expanded, setExpanded] = useState(false);
  const insets = useSafeAreaInsets();
  const hasActions = actions && actions.length > 0;

  const handlePress = () => {
    if (hasActions) {
      setExpanded(!expanded);
    } else if (onPress) {
      onPress();
    }
  };

  return (
    <View
      style={[
        styles.container,
        { bottom: bottom + insets.bottom, right: right + insets.right },
      ]}
    >
      {/* Mini action buttons */}
      {hasActions && expanded && (
        <View style={styles.actionsContainer}>
          {actions!.map((action, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.miniAction}
              onPress={() => {
                setExpanded(false);
                action.onPress();
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.miniLabel}>{action.label}</Text>
              <View style={[styles.miniFAB, { backgroundColor: action.color || '#7c3aed' }]}>
                <MaterialCommunityIcons name={action.icon as any} size={20} color="#fff" />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Main FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: color }, label ? styles.extendedFab : null]}
        onPress={handlePress}
        activeOpacity={0.85}
      >
        <MaterialCommunityIcons
          name={(expanded && hasActions ? 'close' : icon) as any}
          size={26}
          color="#fff"
        />
        {label && !hasActions && (
          <Text style={styles.fabLabel}>{label}</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignItems: 'flex-end',
    zIndex: 100,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#a855f7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    flexDirection: 'row',
    gap: 8,
  },
  extendedFab: {
    width: 'auto',
    paddingHorizontal: 20,
  },
  fabLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  actionsContainer: {
    marginBottom: 12,
    alignItems: 'flex-end',
    gap: 10,
  },
  miniAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  miniLabel: {
    color: '#f3f4f6',
    fontSize: 13,
    fontWeight: '600',
    backgroundColor: 'rgba(18,18,26,0.9)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  miniFAB: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
});

export default FAB;
