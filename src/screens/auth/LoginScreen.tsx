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
import Button from '../../components/common/Button';

type NavProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

const LoginScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Email and password are required');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await login({ email: email.trim().toLowerCase(), password });
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Login failed. Please check your credentials.');
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
        {/* Logo area */}
        <View style={styles.logoArea}>
          <View style={styles.logoIcon}>
            <MaterialCommunityIcons name="disc-player" size={56} color="#a855f7" />
          </View>
          <Text style={styles.appName}>Disk Rider</Text>
          <Text style={styles.appTag}>LIVE</Text>
          <Text style={styles.tagline}>DJ Performance & Booking Platform</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Welcome back</Text>
          <Text style={styles.cardSub}>Sign in to your account</Text>

          {/* Email */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Email address</Text>
            <View style={styles.inputWrap}>
              <MaterialCommunityIcons name="email-outline" size={20} color="#6b7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor="#4b5563"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                value={email}
                onChangeText={setEmail}
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Password</Text>
            <View style={styles.inputWrap}>
              <MaterialCommunityIcons name="lock-outline" size={20} color="#6b7280" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.inputPaddingRight]}
                placeholder="••••••••"
                placeholderTextColor="#4b5563"
                secureTextEntry={!showPassword}
                autoComplete="password"
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeBtn}
              >
                <MaterialCommunityIcons
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color="#6b7280"
                />
              </TouchableOpacity>
            </View>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <MaterialCommunityIcons name="alert-circle-outline" size={16} color="#ef4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Button
            label="Sign In"
            onPress={handleLogin}
            loading={loading}
            fullWidth
            size="lg"
            style={styles.loginBtn}
          />

          <TouchableOpacity style={styles.forgotBtn} activeOpacity={0.7}>
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>
        </View>

        {/* Signup link */}
        <View style={styles.signupRow}>
          <Text style={styles.signupText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Signup')} activeOpacity={0.7}>
            <Text style={styles.signupLink}>Create one</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 24,
  },
  logoArea: {
    alignItems: 'center',
    gap: 4,
  },
  logoIcon: {
    width: 96,
    height: 96,
    borderRadius: 24,
    backgroundColor: '#1a0f2e',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#a855f740',
  },
  appName: {
    color: '#f3f4f6',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  appTag: {
    color: '#a855f7',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 4,
    marginTop: -4,
  },
  tagline: {
    color: '#6b7280',
    fontSize: 13,
    marginTop: 4,
  },
  card: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: '#12121a',
    borderRadius: 20,
    padding: 28,
    borderWidth: 1,
    borderColor: '#1e1e2e',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    gap: 16,
  },
  cardTitle: {
    color: '#f3f4f6',
    fontSize: 24,
    fontWeight: '700',
  },
  cardSub: {
    color: '#6b7280',
    fontSize: 14,
    marginTop: -8,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    color: '#9ca3af',
    fontSize: 13,
    fontWeight: '600',
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0a0a0f',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#1e1e2e',
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: '#f3f4f6',
    fontSize: 15,
    paddingVertical: 14,
  },
  inputPaddingRight: {
    paddingRight: 40,
  },
  eyeBtn: {
    position: 'absolute',
    right: 12,
    padding: 4,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7f1d1d30',
    borderRadius: 8,
    padding: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: '#ef444430',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 13,
    flex: 1,
  },
  loginBtn: {
    marginTop: 4,
    borderRadius: 12,
  },
  forgotBtn: {
    alignSelf: 'center',
  },
  forgotText: {
    color: '#a855f7',
    fontSize: 13,
    fontWeight: '500',
  },
  signupRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  signupText: {
    color: '#6b7280',
    fontSize: 14,
  },
  signupLink: {
    color: '#a855f7',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default LoginScreen;
