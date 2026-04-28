import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ActionButton {
  icon: string;
  onPress: () => void;
  badge?: number;
  color?: string;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ActionButton[];
  showBack?: boolean;
  onBack?: () => void;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  actions = [],
  showBack = false,
  onBack,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <View style={styles.left}>
        {showBack && (
          <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#e5e7eb" />
          </TouchableOpacity>
        )}
        <View>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      </View>
      {actions.length > 0 && (
        <View style={styles.actions}>
          {actions.map((action, idx) => (
            <TouchableOpacity
              key={idx}
              onPress={action.onPress}
              style={styles.actionBtn}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name={action.icon as any}
                size={24}
                color={action.color || '#e5e7eb'}
              />
              {action.badge !== undefined && action.badge > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {action.badge > 99 ? '99+' : action.badge}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    backgroundColor: '#12121a',
    borderBottomWidth: 1,
    borderBottomColor: '#1e1e2e',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  backBtn: {
    padding: 4,
  },
  title: {
    color: '#f3f4f6',
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  subtitle: {
    color: '#6b7280',
    fontSize: 13,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
});

export default PageHeader;
