import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp, DrawerActions } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ProfileStackParamList } from '../../navigation/stacks/ProfileStack';
import PageHeader from '../../components/layout/PageHeader';
import TwoPane from '../../components/layout/TwoPane';
import Card from '../../components/common/Card';

type RouteType = RouteProp<ProfileStackParamList, 'Settings'>;
type Nav = NativeStackNavigationProp<ProfileStackParamList>;

type Category = { id: string; label: string; icon: string };

const CATEGORIES: Category[] = [
  { id: 'account', label: 'Account', icon: 'account-outline' },
  { id: 'notifications', label: 'Notifications', icon: 'bell-outline' },
  { id: 'privacy', label: 'Privacy', icon: 'lock-outline' },
  { id: 'appearance', label: 'Appearance', icon: 'palette-outline' },
  { id: 'about', label: 'About', icon: 'information-outline' },
];

type SettingItem =
  | { type: 'toggle'; label: string; key: string; description?: string }
  | { type: 'nav'; label: string; description?: string }
  | { type: 'info'; label: string; value: string };

const SETTINGS: Record<string, SettingItem[]> = {
  account: [
    { type: 'nav', label: 'Edit Profile', description: 'Update name, bio, and avatar' },
    { type: 'nav', label: 'Change Password' },
    { type: 'nav', label: 'Connected Accounts', description: 'Social logins and linked services' },
    { type: 'nav', label: 'Two-Factor Authentication', description: 'Add an extra layer of security' },
    { type: 'nav', label: 'Delete Account', description: 'Permanently remove your data' },
  ],
  notifications: [
    { type: 'toggle', label: 'Push Notifications', key: 'push', description: 'Enable all push notifications' },
    { type: 'toggle', label: 'Gift Alerts', key: 'gifts', description: 'When someone sends you a gift' },
    { type: 'toggle', label: 'New Followers', key: 'follows', description: 'When someone follows you' },
    { type: 'toggle', label: 'Booking Updates', key: 'bookings', description: 'Inquiries and deal changes' },
    { type: 'toggle', label: 'Wallet Activity', key: 'wallet', description: 'Payments, payouts, top-ups' },
    { type: 'toggle', label: 'Event Reminders', key: 'events' },
    { type: 'toggle', label: 'Marketing', key: 'marketing', description: 'News and promotions' },
  ],
  privacy: [
    { type: 'toggle', label: 'Public Profile', key: 'public', description: 'Anyone can view your profile' },
    { type: 'toggle', label: 'Show Earnings', key: 'showBalance', description: 'Display earnings publicly' },
    { type: 'toggle', label: 'Allow Anonymous Gifts', key: 'anonGifts' },
    { type: 'nav', label: 'Blocked Users' },
    { type: 'nav', label: 'Download My Data', description: 'Export all account data' },
  ],
  appearance: [
    { type: 'toggle', label: 'Dark Mode', key: 'dark', description: 'Always enabled for AMOLED savings' },
    { type: 'toggle', label: 'Reduced Animations', key: 'reducedMotion' },
    { type: 'toggle', label: 'Compact Mode', key: 'compact', description: 'Denser information layout' },
    { type: 'toggle', label: 'Show Sidebar Labels', key: 'sidebarLabels', description: 'Show text next to nav icons' },
  ],
  about: [
    { type: 'info', label: 'App Version', value: '1.0.0' },
    { type: 'info', label: 'Build Date', value: '2026-03-20' },
    { type: 'info', label: 'Platform', value: 'Android Tablet' },
    { type: 'nav', label: 'Terms of Service' },
    { type: 'nav', label: 'Privacy Policy' },
    { type: 'nav', label: 'Open Source Licenses' },
    { type: 'nav', label: 'Contact Support' },
  ],
};

// Nav items that navigate to a dedicated screen
const NAV_SCREENS: Partial<Record<string, keyof ProfileStackParamList>> = {
  'Edit Profile': 'EditProfile',
  'Change Password': 'ChangePassword',
  'Delete Account': 'DeleteAccount',
  'Blocked Users': 'BlockedUsers',
};

// Nav items that show inline static content
const NAV_CONTENT: Record<string, { icon: string; body: string }> = {
  'Connected Accounts': {
    icon: 'link-variant',
    body: 'Manage social logins and third-party services at diskriderlive.com/settings/connections.',
  },
  'Two-Factor Authentication': {
    icon: 'shield-check-outline',
    body: 'Two-factor authentication adds an extra layer of security to your account.\n\nSetup is available at diskriderlive.com/settings/security.',
  },
  'Download My Data': {
    icon: 'download-outline',
    body: 'You can request a full export of your data at diskriderlive.com/settings/privacy.\n\nWe will email you a download link within 48 hours.',
  },
  'Terms of Service': {
    icon: 'file-document-outline',
    body: 'Terms of Service\nLast updated: March 2026\n\nBy using Disk Rider Live, you agree to use the platform responsibly and in compliance with all applicable laws.\n\nYou may not use the platform to distribute harmful content, engage in fraud, or violate the rights of others.\n\nWe reserve the right to suspend accounts that violate these terms.\n\nFull terms: diskriderlive.com/terms',
  },
  'Privacy Policy': {
    icon: 'shield-outline',
    body: 'Privacy Policy\nLast updated: March 2026\n\nWe collect only the information necessary to provide the Disk Rider Live service, including your email address, profile information, and usage data.\n\nWe do not sell your personal data to third parties.\n\nYou have the right to request deletion of your account and all associated data.\n\nFull policy: diskriderlive.com/privacy',
  },
  'Open Source Licenses': {
    icon: 'open-source-initiative',
    body: 'Disk Rider Live is built with the following open source technologies:\n\n\u2022 React Native (MIT)\n\u2022 Expo (MIT)\n\u2022 React Navigation (MIT)\n\u2022 Prisma (Apache 2.0)\n\u2022 Next.js (MIT)\n\nFull license list: diskriderlive.com/licenses',
  },
  'Contact Support': {
    icon: 'headset',
    body: 'Need help? We\'re here for you.\n\nEmail\nsupport@diskriderlive.com\n\nResponse Time\nWithin 24 hours on business days\n\nHelp Center\ndiskriderlive.com/help\n\nFor urgent issues, please include your account email and a description of the problem.',
  },
};

export default function SettingsScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteType>();
  const initialCategory = route.params?.initialCategory ?? 'account';
  const initialNavItem = route.params?.navItem ?? null;

  const [selected, setSelected] = useState(initialCategory);
  const [selectedNavLabel, setSelectedNavLabel] = useState<string | null>(initialNavItem);
  const [toggles, setToggles] = useState<Record<string, boolean>>({
    push: true, gifts: true, follows: true, bookings: true,
    wallet: true, events: true, marketing: false,
    public: true, showBalance: false, anonGifts: true,
    dark: true, reducedMotion: false, compact: false, sidebarLabels: true,
  });

  const items = SETTINGS[selected] ?? [];

  const handleCategorySelect = (id: string) => {
    setSelected(id);
    setSelectedNavLabel(null);
  };

  const handleNavItemPress = (label: string) => {
    const screenName = NAV_SCREENS[label];
    if (screenName) {
      navigation.navigate(screenName as any);
    } else {
      setSelectedNavLabel(label);
    }
  };

  const leftContent = (
    <ScrollView contentContainerStyle={styles.leftContent}>
      <Text style={styles.leftHeader}>Settings</Text>
      {CATEGORIES.map(cat => (
        <TouchableOpacity
          key={cat.id}
          style={[styles.catItem, selected === cat.id && styles.catItemActive]}
          onPress={() => handleCategorySelect(cat.id)}
        >
          <MaterialCommunityIcons
            name={cat.icon as any}
            size={20}
            color={selected === cat.id ? '#a855f7' : '#6b7280'}
          />
          <Text style={[styles.catLabel, selected === cat.id && styles.catLabelActive]}>
            {cat.label}
          </Text>
          {selected === cat.id && (
            <MaterialCommunityIcons name="chevron-right" size={16} color="#a855f7" />
          )}
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const navDetail = selectedNavLabel ? NAV_CONTENT[selectedNavLabel] : null;

  const rightContent = (
    <ScrollView contentContainerStyle={styles.rightContent}>
      {selectedNavLabel && navDetail ? (
        <>
          <TouchableOpacity style={styles.backRow} onPress={() => setSelectedNavLabel(null)}>
            <MaterialCommunityIcons name="arrow-left" size={18} color="#a855f7" />
            <Text style={styles.backLabel}>Back</Text>
          </TouchableOpacity>
          <View style={styles.detailHeader}>
            <View style={styles.detailIconWrap}>
              <MaterialCommunityIcons name={navDetail.icon as any} size={32} color="#a855f7" />
            </View>
            <Text style={styles.rightTitle}>{selectedNavLabel}</Text>
          </View>
          <Card style={styles.detailCard}>
            <Text style={styles.detailBody}>{navDetail.body}</Text>
          </Card>
        </>
      ) : (
        <>
          <Text style={styles.rightTitle}>{CATEGORIES.find(c => c.id === selected)?.label ?? ''}</Text>
          <Card style={styles.settingsCard}>
            {items.map((item, idx) => (
              <TouchableOpacity
                key={idx}
                style={[styles.settingRow, idx < items.length - 1 && styles.settingBorder]}
                onPress={item.type === 'nav' ? () => handleNavItemPress(item.label) : undefined}
                activeOpacity={item.type === 'nav' ? 0.7 : 1}
              >
                {item.type === 'toggle' ? (
                  <>
                    <View style={styles.settingText}>
                      <Text style={styles.settingLabel}>{item.label}</Text>
                      {item.description && <Text style={styles.settingDesc}>{item.description}</Text>}
                    </View>
                    <Switch
                      value={toggles[item.key] ?? false}
                      onValueChange={v => setToggles(p => ({ ...p, [item.key]: v }))}
                      trackColor={{ false: '#374151', true: '#a855f7' }}
                      thumbColor="#ffffff"
                    />
                  </>
                ) : item.type === 'info' ? (
                  <>
                    <Text style={styles.settingLabel}>{item.label}</Text>
                    <Text style={styles.infoVal}>{item.value}</Text>
                  </>
                ) : (
                  <>
                    <View style={styles.settingText}>
                      <Text style={styles.settingLabel}>{item.label}</Text>
                      {item.description && <Text style={styles.settingDesc}>{item.description}</Text>}
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={18} color="#6b7280" />
                  </>
                )}
              </TouchableOpacity>
            ))}
          </Card>
        </>
      )}
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <PageHeader
        title="Settings"
        showBack
        onBack={() => navigation.goBack()}
        actions={[{ icon: 'home', onPress: () => navigation.dispatch(DrawerActions.jumpTo('HomeStack' as any)) }]}
      />
      <TwoPane leftContent={leftContent} rightContent={rightContent} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f' },
  leftContent: { padding: 16, gap: 2 },
  leftHeader: { color: '#4b5563', fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 8, paddingLeft: 4 },
  catItem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 10 },
  catItemActive: { backgroundColor: '#a855f715' },
  catLabel: { flex: 1, color: '#9ca3af', fontSize: 15, fontWeight: '500' },
  catLabelActive: { color: '#a855f7', fontWeight: '700' },
  rightContent: { padding: 20, gap: 16 },
  rightTitle: { color: '#ffffff', fontSize: 22, fontWeight: '700' },
  settingsCard: { padding: 0 },
  settingRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
  settingBorder: { borderBottomWidth: 1, borderBottomColor: '#ffffff08' },
  settingText: { flex: 1 },
  settingLabel: { color: '#e5e7eb', fontSize: 15 },
  settingDesc: { color: '#6b7280', fontSize: 12, marginTop: 2 },
  infoVal: { color: '#6b7280', fontSize: 14 },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  backLabel: { color: '#a855f7', fontSize: 14, fontWeight: '600' },
  detailHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 4 },
  detailIconWrap: {
    width: 52, height: 52, borderRadius: 14,
    backgroundColor: '#a855f715', alignItems: 'center', justifyContent: 'center',
  },
  detailCard: { padding: 20 },
  detailBody: { color: '#d1d5db', fontSize: 14, lineHeight: 22 },
});
