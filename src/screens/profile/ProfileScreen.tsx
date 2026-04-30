import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { useNavigation, DrawerActions, CompositeNavigationProp } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { DrawerParamList } from '../../navigation/DrawerNavigator';
import { ProfileStackParamList } from '../../navigation/stacks/ProfileStack';
import PageHeader from '../../components/layout/PageHeader';
import Card from '../../components/common/Card';
import Avatar from '../../components/common/Avatar';
import Badge from '../../components/common/Badge';
import TwoPane from '../../components/layout/TwoPane';

type Nav = CompositeNavigationProp<
  NativeStackNavigationProp<ProfileStackParamList, 'Profile'>,
  DrawerNavigationProp<DrawerParamList>
>;

const ROLE_COLORS: Record<string, string> = {
  dj: '#a855f7',
  venue_manager: '#10b981',
  admin: '#ef4444',
  fan: '#3b82f6',
  promoter: '#f59e0b',
  seller: '#06b6d4',
  event_planner: '#06b6d4',
};

type ActionCard = { icon: string; label: string; screen: string; nestedScreen?: string; nestedParams?: Record<string, unknown>; color: string; roles: string[] };

const ACTION_CARDS: ActionCard[] = [
  { icon: 'view-dashboard', label: 'DJ Dashboard', screen: 'DJStack', nestedScreen: 'DJDashboard', color: '#a855f7', roles: ['dj'] },
  { icon: 'video', label: 'Videos', screen: 'DJStack', nestedScreen: 'DJVideos', color: '#a855f7', roles: ['dj'] },
  { icon: 'broadcast', label: 'Go Live', screen: 'DJStack', nestedScreen: 'DJBroadcast', color: '#ef4444', roles: ['dj'] },
  { icon: 'disc', label: 'My Sets', screen: 'DJStack', nestedScreen: 'DJSets', color: '#10b981', roles: ['dj'] },
  { icon: 'briefcase', label: 'Deals', screen: 'DJStack', nestedScreen: 'DJDeals', color: '#f59e0b', roles: ['dj', 'venue_manager'] },
  { icon: 'office-building', label: 'Venue Dashboard', screen: 'VenueStack', nestedScreen: 'VenueDashboard', color: '#10b981', roles: ['venue_manager'] },
  { icon: 'shield-account', label: 'Admin', screen: 'ProfileStack', nestedScreen: 'Admin', color: '#ef4444', roles: ['admin'] },
  { icon: 'credit-card', label: 'Wallet', screen: 'WalletStack', color: '#f59e0b', roles: ['dj', 'venue_manager', 'fan', 'seller'] },
  { icon: 'cart', label: 'My Orders', screen: 'MarketplaceStack', nestedScreen: 'Orders', color: '#a855f7', roles: ['fan', 'dj', 'venue_manager', 'seller'] },
  { icon: 'store', label: 'My Listings', screen: 'MarketplaceStack', nestedScreen: 'MyListings', color: '#06b6d4', roles: ['seller', 'dj'] },
  { icon: 'creation', label: 'Event Planner', screen: 'EventPlannerDashboard', color: '#06b6d4', roles: ['event_planner'] },
  { icon: 'information-outline', label: 'About', screen: 'ProfileStack', nestedScreen: 'Info', nestedParams: { topic: 'about' }, color: '#94a3b8', roles: ['fan', 'dj', 'venue_manager', 'seller', 'event_planner', 'admin'] },
];

export default function ProfileScreen() {
  const navigation = useNavigation<Nav>();
  const { user, logout } = useAuth();

  const role = user?.role ?? 'fan';
  const roleColor = ROLE_COLORS[role] ?? '#6b7280';
  const visibleActions = ACTION_CARDS.filter(a => a.roles.includes(role));

  // Graceful fallbacks for sessions cached before the field-name fix
  const anyUser = user as any;
  const displayName = user?.displayName || anyUser?.name || user?.email?.split('@')[0] || 'User';
  const avatarUrl = user?.avatarUrl || anyUser?.image;

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: logout },
    ]);
  };

  const leftContent = (
    <ScrollView contentContainerStyle={styles.leftContent}>
      <View style={styles.avatarSection}>
        <Avatar uri={avatarUrl} name={displayName} size={96} />
        <Text style={styles.name}>{displayName}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <View style={[styles.roleChip, { backgroundColor: `${roleColor}20`, borderColor: `${roleColor}40` }]}>
          <Text style={[styles.roleText, { color: roleColor }]}>{role.replace('_', ' ').toUpperCase()}</Text>
        </View>
      </View>

      <Card style={styles.statsCard}>
        {[
          { label: 'Following', value: '128', icon: 'account-arrow-right-outline' },
          { label: 'Followers', value: role === 'dj' ? '52.4k' : '—', icon: 'account-group-outline' },
          { label: 'Events', value: '24', icon: 'calendar-outline' },
          { label: 'Gifts Sent', value: '16', icon: 'gift-outline' },
        ].map(stat => (
          <View key={stat.label} style={styles.statRow}>
            <MaterialCommunityIcons name={stat.icon as any} size={18} color="#6b7280" />
            <Text style={styles.statLabel}>{stat.label}</Text>
            <Text style={styles.statValue}>{stat.value}</Text>
          </View>
        ))}
      </Card>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <MaterialCommunityIcons name="logout" size={20} color="#ef4444" />
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>

      <Text style={styles.version}>Disk Rider Live v1.0.0 · Android Tablet</Text>
    </ScrollView>
  );

  const rightContent = (
    <ScrollView contentContainerStyle={styles.rightContent}>
      {visibleActions.length > 0 && (
        <>
          <Text style={styles.sectionLabel}>QUICK ACTIONS</Text>
          <View style={styles.actionsGrid}>
            {visibleActions.map(action => (
              <TouchableOpacity
                key={action.label}
                style={[styles.actionCard, { borderColor: `${action.color}25` }]}
                onPress={() => {
                  if (action.nestedScreen) {
                    (navigation as any).navigate(action.screen, { screen: action.nestedScreen, params: action.nestedParams });
                  } else {
                    (navigation as any).navigate(action.screen);
                  }
                }}
              >
                <View style={[styles.actionIcon, { backgroundColor: `${action.color}20` }]}>
                  <MaterialCommunityIcons name={action.icon as any} size={28} color={action.color} />
                </View>
                <Text style={styles.actionLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      <Text style={styles.sectionLabel}>ACCOUNT</Text>
      <Card style={styles.menuCard}>
        {[
          { icon: 'account-edit-outline', label: 'Edit Profile', category: 'account' },
          { icon: 'bell-outline', label: 'Notification Preferences', category: 'notifications' },
          { icon: 'lock-outline', label: 'Privacy & Security', category: 'privacy' },
          { icon: 'help-circle-outline', label: 'Help & Support', category: 'about', navItem: 'Contact Support' },
          { icon: 'file-document-outline', label: 'Terms of Service', category: 'about', navItem: 'Terms of Service' },
          { icon: 'shield-outline', label: 'Privacy Policy', category: 'about', navItem: 'Privacy Policy' },
          { icon: 'information-outline', label: 'About', category: 'about' },
        ].map(item => (
          <TouchableOpacity
            key={item.label}
            style={styles.menuItem}
            onPress={() => navigation.navigate('Settings', { initialCategory: item.category, navItem: item.navItem })}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name={item.icon as any} size={20} color="#6b7280" />
            <Text style={styles.menuLabel}>{item.label}</Text>
            <MaterialCommunityIcons name="chevron-right" size={18} color="#374151" />
          </TouchableOpacity>
        ))}
      </Card>
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <PageHeader
        title="My Profile"
        actions={[{ icon: 'home', onPress: () => navigation.dispatch(DrawerActions.jumpTo('HomeStack' as any)) }]}
      />
      <TwoPane leftContent={leftContent} rightContent={rightContent} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f' },
  leftContent: { padding: 20, gap: 16, alignItems: 'center' },
  avatarSection: { alignItems: 'center', gap: 8, paddingVertical: 12 },
  name: { color: '#ffffff', fontSize: 22, fontWeight: '800', textAlign: 'center' },
  email: { color: '#6b7280', fontSize: 13 },
  roleChip: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10, borderWidth: 1 },
  roleText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  statsCard: { width: '100%', padding: 0 },
  statRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#ffffff08' },
  statLabel: { flex: 1, color: '#9ca3af', fontSize: 14 },
  statValue: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: '#ef444430', backgroundColor: '#ef444410', width: '100%', justifyContent: 'center' },
  logoutText: { color: '#ef4444', fontSize: 15, fontWeight: '600' },
  version: { color: '#374151', fontSize: 12 },
  rightContent: { padding: 20, gap: 12 },
  sectionLabel: { color: '#4b5563', fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginTop: 8 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  actionCard: { width: '30%', alignItems: 'center', padding: 16, gap: 10, borderRadius: 14, borderWidth: 1, backgroundColor: '#ffffff04' },
  actionIcon: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { color: '#9ca3af', fontSize: 12, fontWeight: '500', textAlign: 'center' },
  menuCard: { padding: 0 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#ffffff08' },
  menuLabel: { flex: 1, color: '#e5e7eb', fontSize: 15 },
});
