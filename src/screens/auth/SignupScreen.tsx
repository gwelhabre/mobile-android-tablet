import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/RootNavigator';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import Button from '../../components/common/Button';

type NavProp = NativeStackNavigationProp<AuthStackParamList, 'Signup'>;

const ROLES: { value: UserRole; label: string; icon: string; desc: string }[] = [
  { value: 'fan', label: 'Fan', icon: 'account-heart', desc: 'Discover & support DJs' },
  { value: 'dj', label: 'DJ', icon: 'disc-player', desc: 'Perform & monetize' },
  { value: 'venue_manager', label: 'Venue', icon: 'office-building', desc: 'Book DJs & manage events' },
];

const SignupScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const { register } = useAuth();

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>('fan');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    if (!email.trim() || !username.trim() || !displayName.trim() || !password) {
      setError('All fields are required');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await register({ email: email.trim().toLowerCase(), username: username.trim(), displayName: displayName.trim(), password, role });
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#9ca3af" />
          </TouchableOpacity>
          <View style={styles.headerTitle}>
            <MaterialCommunityIcons name="disc-player" size={28} color="#a855f7" />
            <Text style={styles.brand}>Disk Rider <Text style={styles.brandLive}>LIVE</Text></Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Create account</Text>
          <Text style={styles.cardSub}>Join the DJ community</Text>

          {/* Role Selection */}
          <View style={styles.roleSection}>
            <Text style={styles.sectionLabel}>I am a...</Text>
            <View style={styles.roleGrid}>
              {ROLES.map((r) => (
                <TouchableOpacity
                  key={r.value}
                  style={[styles.roleChip, role === r.value && styles.roleChipActive]}
                  onPress={() => setRole(r.value)}
                  activeOpacity={0.75}
                >
                  <MaterialCommunityIcons
                    name={r.icon as any}
                    size={24}
                    color={role === r.value ? '#a855f7' : '#6b7280'}
                  />
                  <Text style={[styles.roleLabel, role === r.value && styles.roleLabelActive]}>
                    {r.label}
                  </Text>
                  <Text style={styles.roleDesc}>{r.desc}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 2-column fields on wide screens */}
          <View style={styles.fieldsGrid}>
            <View style={styles.fieldHalf}>
              <Text style={styles.fieldLabel}>Display Name</Text>
              <View style={styles.inputWrap}>
                <MaterialCommunityIcons name="account" size={18} color="#6b7280" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Your name"
                  placeholderTextColor="#4b5563"
                  value={displayName}
                  onChangeText={setDisplayName}
                />
              </View>
            </View>

            <View style={styles.fieldHalf}>
              <Text style={styles.fieldLabel}>Username</Text>
              <View style={styles.inputWrap}>
                <Text style={[styles.inputIcon, styles.atSign]}>@</Text>
                <TextInput
                  style={styles.input}
                  placeholder="username"
                  placeholderTextColor="#4b5563"
                  autoCapitalize="none"
                  value={username}
                  onChangeText={setUsername}
                />
              </View>
            </View>

            <View style={[styles.fieldHalf, styles.fieldFull]}>
              <Text style={styles.fieldLabel}>Email address</Text>
              <View style={styles.inputWrap}>
                <MaterialCommunityIcons name="email-outline" size={18} color="#6b7280" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="you@example.com"
                  placeholderTextColor="#4b5563"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            </View>

            <View style={styles.fieldHalf}>
              <Text style={styles.fieldLabel}>Password</Text>
              <View style={styles.inputWrap}>
                <MaterialCommunityIcons name="lock-outline" size={18} color="#6b7280" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Min 8 characters"
                  placeholderTextColor="#4b5563"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                  <MaterialCommunityIcons name={showPassword ? 'eye-off' : 'eye'} size={18} color="#6b7280" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.fieldHalf}>
              <Text style={styles.fieldLabel}>Confirm Password</Text>
              <View style={styles.inputWrap}>
                <MaterialCommunityIcons name="lock-check-outline" size={18} color="#6b7280" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Repeat password"
                  placeholderTextColor="#4b5563"
                  secureTextEntry={!showPassword}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
              </View>
            </View>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <MaterialCommunityIcons name="alert-circle-outline" size={16} color="#ef4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Button
            label="Create Account"
            onPress={handleRegister}
            loading={loading}
            fullWidth
            size="lg"
            icon="account-plus"
            style={styles.createBtn}
          />
        </View>

        <View style={styles.loginRow}>
          <Text style={styles.loginText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')} activeOpacity={0.7}>
            <Text style={styles.loginLink}>Sign in</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0a0a0f' },
  scroll: { flexGrow: 1, padding: 24, gap: 20, maxWidth: 760, alignSelf: 'center', width: '100%' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 16 },
  backBtn: { padding: 8, borderRadius: 10, backgroundColor: '#12121a' },
  headerTitle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brand: { color: '#f3f4f6', fontSize: 20, fontWeight: '700' },
  brandLive: { color: '#a855f7', fontWeight: '800', letterSpacing: 2 },
  card: {
    backgroundColor: '#12121a', borderRadius: 20, padding: 28,
    borderWidth: 1, borderColor: '#1e1e2e', gap: 20,
    elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35, shadowRadius: 6,
  },
  cardTitle: { color: '#f3f4f6', fontSize: 24, fontWeight: '700' },
  cardSub: { color: '#6b7280', fontSize: 14, marginTop: -12 },
  roleSection: { gap: 10 },
  sectionLabel: { color: '#9ca3af', fontSize: 13, fontWeight: '600' },
  roleGrid: { flexDirection: 'row', gap: 10 },
  roleChip: {
    flex: 1, borderRadius: 12, padding: 14, alignItems: 'center', gap: 4,
    backgroundColor: '#0a0a0f', borderWidth: 1.5, borderColor: '#1e1e2e',
  },
  roleChipActive: { borderColor: '#a855f7', backgroundColor: '#1a0f2e' },
  roleLabel: { color: '#9ca3af', fontSize: 14, fontWeight: '600' },
  roleLabelActive: { color: '#a855f7' },
  roleDesc: { color: '#4b5563', fontSize: 11, textAlign: 'center' },
  fieldsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  fieldHalf: { width: '47%', gap: 6, flexGrow: 1 },
  fieldFull: { width: '100%' },
  fieldLabel: { color: '#9ca3af', fontSize: 13, fontWeight: '600' },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#0a0a0f',
    borderRadius: 10, borderWidth: 1.5, borderColor: '#1e1e2e', paddingHorizontal: 12,
  },
  inputIcon: { marginRight: 8 },
  atSign: { color: '#6b7280', fontSize: 16, fontWeight: '600' },
  input: { flex: 1, color: '#f3f4f6', fontSize: 14, paddingVertical: 13 },
  eyeBtn: { padding: 4, position: 'absolute', right: 12 },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#7f1d1d30',
    borderRadius: 8, padding: 10, gap: 8, borderWidth: 1, borderColor: '#ef444430',
  },
  errorText: { color: '#ef4444', fontSize: 13, flex: 1 },
  createBtn: { borderRadius: 12, marginTop: 4 },
  loginRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  loginText: { color: '#6b7280', fontSize: 14 },
  loginLink: { color: '#a855f7', fontSize: 14, fontWeight: '600' },
});

export default SignupScreen;
