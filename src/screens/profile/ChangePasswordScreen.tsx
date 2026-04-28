import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ProfileStackParamList } from '../../navigation/stacks/ProfileStack';
import { changePassword } from '../../api/auth';
import PageHeader from '../../components/layout/PageHeader';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Snackbar from '../../components/common/Snackbar';

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'ChangePassword'>;

export default function ChangePasswordScreen() {
  const navigation = useNavigation<Nav>();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    visible: boolean;
    message: string;
    type: 'success' | 'error';
  }>({ visible: false, message: '', type: 'success' });

  const showSnackbar = (message: string, type: 'success' | 'error') => {
    setSnackbar({ visible: true, message, type });
  };

  const handleSave = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      showSnackbar('Please fill in all fields', 'error');
      return;
    }
    if (newPassword.length < 8) {
      showSnackbar('New password must be at least 8 characters', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showSnackbar('New passwords do not match', 'error');
      return;
    }

    setSaving(true);
    try {
      await changePassword(currentPassword, newPassword);
      showSnackbar('Password changed successfully', 'success');
      setTimeout(() => navigation.goBack(), 1200);
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? 'Failed to change password';
      showSnackbar(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <PageHeader
        title="Change Password"
        showBack
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Update Password</Text>
          <Text style={styles.subtitle}>
            Choose a strong password of at least 8 characters.
          </Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Current Password</Text>
            <TextInput
              style={styles.input}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Enter current password"
              placeholderTextColor="#4b5563"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>New Password</Text>
            <TextInput
              style={styles.input}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Enter new password"
              placeholderTextColor="#4b5563"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Confirm New Password</Text>
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Re-enter new password"
              placeholderTextColor="#4b5563"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <Button
            label="Change Password"
            onPress={handleSave}
            loading={saving}
            disabled={saving}
            fullWidth
            size="lg"
            style={styles.saveBtn}
          />
        </Card>
      </ScrollView>

      <Snackbar
        message={snackbar.message}
        visible={snackbar.visible}
        type={snackbar.type}
        onDismiss={() => setSnackbar(s => ({ ...s, visible: false }))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  card: { padding: 24, gap: 20, maxWidth: 500, alignSelf: 'center', width: '100%' },
  sectionTitle: { color: '#f3f4f6', fontSize: 18, fontWeight: '700' },
  subtitle: { color: '#6b7280', fontSize: 13, lineHeight: 18, marginTop: -8 },
  fieldGroup: { gap: 6 },
  fieldLabel: { color: '#6b7280', fontSize: 12, fontWeight: '600', letterSpacing: 0.5 },
  input: {
    backgroundColor: '#1e1e2e',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: '#f3f4f6',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#2d2d3f',
  },
  saveBtn: { marginTop: 4 },
});
