import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { DrawerContentScrollView, DrawerContentComponentProps } from '@react-navigation/drawer';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../common/Avatar';
import Badge from '../common/Badge';

interface NavItem {
  label: string;
  icon: string;
  route: keyof import('../../navigation/DrawerNavigator').DrawerParamList;
  roles?: string[];
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: 'MAIN',
    items: [
      { label: 'Home', icon: 'home', route: 'HomeStack' },
      { label: 'Live', icon: 'broadcast', route: 'LiveStack' },
      { label: 'Rankings', icon: 'trophy', route: 'RankingsStack' },
      { label: 'Search', icon: 'magnify', route: 'SearchScreen' },
    ],
  },
  {
    title: 'DISCOVER',
    items: [
      { label: 'DJs', icon: 'account-music', route: 'DiscoverStack' },
      { label: 'Competitions', icon: 'tournament', route: 'CompetitionsStack' },
    ],
  },
  {
    title: 'COMMERCE',
    items: [
      { label: 'Wallet', icon: 'wallet', route: 'WalletStack' },
      { label: 'Marketplace', icon: 'store', route: 'MarketplaceStack' },
    ],
  },
  {
    title: 'COMMUNITY',
    items: [
      { label: 'Forum', icon: 'forum', route: 'CommunityStack' },
    ],
  },
  {
    title: 'MY SPACE',
    items: [
      { label: 'DJ Dashboard', icon: 'disc-player', route: 'DJStack', roles: ['dj', 'admin'] },
      { label: 'Venue Dashboard', icon: 'office-building', route: 'VenueStack', roles: ['venue_manager', 'admin'] },
    ],
  },
  {
    title: 'ACCOUNT',
    items: [
      { label: 'Notifications', icon: 'bell', route: 'NotificationsScreen' },
      { label: 'Profile', icon: 'account-circle', route: 'ProfileStack' },
    ],
  },
];

const DrawerContent: React.FC<DrawerContentComponentProps> = (props) => {
  const { user, logout } = useAuth();
  const { state, navigation } = props;
  const activeRouteName = state.routes[state.index]?.name;

  const handleNav = (route: string) => {
    navigation.navigate(route as never);
  };

  const roleColor: Record<string, string> = {
    fan: '#10b981',
    dj: '#a855f7',
    venue_manager: '#f59e0b',
    admin: '#ef4444',
  };

  // Fallback for sessions cached before the field-name fix (name→displayName, image→avatarUrl)
  const anyUser = user as any;
  const displayName = user?.displayName || anyUser?.name || user?.email?.split('@')[0] || 'User';
  const username = user?.username || user?.email?.split('@')[0] || '';
  const avatarUrl = user?.avatarUrl || anyUser?.image;
  const roleLabel = user ? (user.role.replace('_', ' ').toUpperCase()) : '';

  return (
    <View style={styles.container}>
      {/* Branding */}
      <View style={styles.brandRow}>
        <MaterialCommunityIcons name="disc-player" size={30} color="#a855f7" />
        <View style={styles.brandText}>
          <Text style={styles.brandName}>Disk Rider</Text>
          <Text style={styles.brandSub}>LIVE</Text>
        </View>
      </View>

      {/* User Info */}
      {user && (
        <View style={styles.userCard}>
          <Avatar
            uri={avatarUrl}
            name={displayName}
            size={46}
          />
          <View style={styles.userInfo}>
            <Text style={styles.userName} numberOfLines={1}>{displayName}</Text>
            <Text style={styles.userHandle} numberOfLines={1}>@{username}</Text>
            <Badge
              label={roleLabel}
              color={roleColor[user.role] || '#6b7280'}
              small
            />
          </View>
        </View>
      )}

      <View style={styles.divider} />

      {/* Nav Sections */}
      <DrawerContentScrollView
        {...props}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {navSections.map((section) => {
          const visibleItems = section.items.filter((item) => {
            if (!item.roles) return true;
            return user && item.roles.includes(user.role);
          });
          if (visibleItems.length === 0) return null;

          return (
            <View key={section.title} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              {visibleItems.map((item) => {
                const isActive = activeRouteName === item.route;
                return (
                  <TouchableOpacity
                    key={item.route}
                    style={[styles.navItem, isActive && styles.navItemActive]}
                    onPress={() => handleNav(item.route)}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons
                      name={item.icon as any}
                      size={22}
                      color={isActive ? '#a855f7' : '#9ca3af'}
                      style={styles.navIcon}
                    />
                    <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
                      {item.label}
                    </Text>
                    {isActive && <View style={styles.activeIndicator} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          );
        })}
      </DrawerContentScrollView>

      {/* Bottom */}
      <View style={styles.divider} />
      <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.7}>
        <MaterialCommunityIcons name="logout" size={20} color="#ef4444" />
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#12121a',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 16,
    gap: 12,
  },
  brandText: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  brandName: {
    color: '#f3f4f6',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  brandSub: {
    color: '#a855f7',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    marginHorizontal: 8,
    borderRadius: 12,
    backgroundColor: '#1a1a2e',
    marginBottom: 8,
  },
  userInfo: {
    flex: 1,
    gap: 2,
  },
  userName: {
    color: '#f3f4f6',
    fontSize: 14,
    fontWeight: '600',
  },
  userHandle: {
    color: '#6b7280',
    fontSize: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#1e1e2e',
    marginHorizontal: 16,
    marginVertical: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  section: {
    marginTop: 8,
    paddingHorizontal: 8,
  },
  sectionTitle: {
    color: '#4b5563',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 2,
    position: 'relative',
  },
  navItemActive: {
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
  },
  navIcon: {
    marginRight: 12,
    width: 22,
  },
  navLabel: {
    color: '#9ca3af',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  navLabelActive: {
    color: '#a855f7',
    fontWeight: '600',
  },
  activeIndicator: {
    width: 4,
    height: 20,
    borderRadius: 2,
    backgroundColor: '#a855f7',
    position: 'absolute',
    right: 0,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  logoutText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default DrawerContent;
