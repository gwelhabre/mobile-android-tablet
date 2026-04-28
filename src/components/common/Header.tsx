import React, { ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

interface HeaderProps {
  title: string;
  showBack?: boolean;
  rightAction?: ReactNode;
  subtitle?: string;
}

const Header: React.FC<HeaderProps> = ({ title, showBack = false, rightAction, subtitle }) => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        {showBack && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-back" size={24} color="#a855f7" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.center}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>

      <View style={styles.right}>
        {rightAction || <View style={styles.placeholder} />}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#0a0a0f',
    borderBottomWidth: 1,
    borderBottomColor: '#1f1f2e',
  },
  left: {
    width: 40,
    alignItems: 'flex-start',
  },
  center: {
    flex: 1,
    alignItems: 'center',
  },
  right: {
    width: 40,
    alignItems: 'flex-end',
  },
  backButton: {
    padding: 2,
  },
  title: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  subtitle: {
    color: '#6b7280',
    fontSize: 12,
    marginTop: 1,
  },
  placeholder: {
    width: 24,
  },
});

export default Header;
