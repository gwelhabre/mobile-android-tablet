import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import PageHeader from '../../components/layout/PageHeader';
import Button from '../../components/common/Button';
import Snackbar from '../../components/common/Snackbar';
import { setupWhish, verifyWhish } from '../../api/wallet';

type Step = 'phone' | 'code' | 'done';

const WhishSetupScreen: React.FC = () => {
  const navigation = useNavigation();
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState('');
  const [snackType, setSnackType] = useState<'default' | 'success' | 'error'>('default');

  const startSetup = async () => {
    if (!/^\+[1-9]\d{6,14}$/.test(phone.trim())) {
      setSnackbar('Use E.164 format, e.g. +9617XXXXXXX');
      setSnackType('error');
      return;
    }
    setSubmitting(true);
    try {
      const res = await setupWhish(phone.trim());
      setVerificationId(res.verificationId);
      setDisplayName(res.displayName ?? null);
      setStep('code');
    } catch (err: any) {
      setSnackbar(err?.response?.data?.error ?? 'Could not start verification.');
      setSnackType('error');
    } finally {
      setSubmitting(false);
    }
  };

  const verifyCode = async () => {
    if (!verificationId) return;
    setSubmitting(true);
    try {
      await verifyWhish(verificationId, code.trim());
      setStep('done');
    } catch (err: any) {
      setSnackbar(err?.response?.data?.error ?? 'Verification failed.');
      setSnackType('error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.root}>
      <PageHeader
        title="Connect Whish"
        subtitle="Verify your Whish account for payouts"
        showBack
        onBack={() => navigation.goBack()}
      />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.centerCard}>
            <View style={styles.heading}>
              <MaterialCommunityIcons name="cellphone-key" size={32} color="#a855f7" />
              <Text style={styles.title}>Connect Whish</Text>
              <Text style={styles.subtitle}>
                Verify the Whish account where you&apos;ll receive payouts.
              </Text>
            </View>

            {step === 'phone' && (
              <View style={styles.section}>
                <Text style={styles.label}>Whish phone number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="+9617XXXXXXX"
                  placeholderTextColor="#4b5563"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Text style={styles.hint}>Use E.164 format with country code.</Text>
                <Button
                  label="Send verification code"
                  onPress={startSetup}
                  loading={submitting}
                  disabled={!phone.trim()}
                  fullWidth
                  size="lg"
                />
              </View>
            )}

            {step === 'code' && (
              <View style={styles.section}>
                {displayName && (
                  <View style={styles.lookupCard}>
                    <Text style={styles.lookupText}>
                      Verifying for <Text style={{ fontWeight: '700', color: '#f9fafb' }}>{displayName}</Text>
                    </Text>
                  </View>
                )}
                <Text style={styles.label}>Verification code</Text>
                <TextInput
                  style={[styles.input, styles.codeInput]}
                  placeholder="6-digit code"
                  placeholderTextColor="#4b5563"
                  value={code}
                  onChangeText={(v) => setCode(v.replace(/\D/g, ''))}
                  keyboardType="number-pad"
                  maxLength={6}
                />
                <Text style={styles.hint}>Check the SMS sent to your Whish phone.</Text>
                <Button
                  label="Verify"
                  onPress={verifyCode}
                  loading={submitting}
                  disabled={code.length !== 6}
                  fullWidth
                  size="lg"
                />
                <TouchableOpacity onPress={() => { setStep('phone'); setCode(''); }}>
                  <Text style={styles.changeLink}>Use a different number</Text>
                </TouchableOpacity>
              </View>
            )}

            {step === 'done' && (
              <View style={styles.doneSection}>
                <MaterialCommunityIcons name="shield-check" size={48} color="#10b981" />
                <Text style={styles.doneTitle}>Whish account verified</Text>
                <Text style={styles.doneSub}>You can now receive payouts to {phone}.</Text>
                <Button label="Continue to payouts" onPress={() => navigation.goBack()} fullWidth size="lg" />
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <Snackbar message={snackbar} visible={!!snackbar} onDismiss={() => setSnackbar('')} type={snackType} />
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0a0a0f' },
  flex: { flex: 1 },
  content: { flexGrow: 1, padding: 20, alignItems: 'center' },
  centerCard: {
    width: '100%', maxWidth: 560,
    backgroundColor: '#12121a', borderRadius: 20, padding: 28,
    borderWidth: 1, borderColor: '#1e1e2e', gap: 20,
  },
  heading: { alignItems: 'center', gap: 8 },
  title: { color: '#f3f4f6', fontSize: 22, fontWeight: '800' },
  subtitle: { color: '#9ca3af', fontSize: 13, textAlign: 'center', maxWidth: 360 },
  section: { gap: 12 },
  label: { color: '#9ca3af', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  input: {
    backgroundColor: '#0a0a0f', borderRadius: 10, borderWidth: 1.5, borderColor: '#1e1e2e',
    color: '#f3f4f6', fontSize: 16, paddingHorizontal: 14, paddingVertical: 14,
  },
  codeInput: { textAlign: 'center', letterSpacing: 6, fontSize: 22, fontWeight: '700' },
  hint: { color: '#6b7280', fontSize: 12 },
  lookupCard: {
    backgroundColor: 'rgba(168,85,247,0.08)', borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: 'rgba(168,85,247,0.2)',
  },
  lookupText: { color: '#9ca3af', fontSize: 13 },
  changeLink: { color: '#9ca3af', fontSize: 12, textAlign: 'center', paddingTop: 4 },
  doneSection: { alignItems: 'center', gap: 12, paddingVertical: 16 },
  doneTitle: { color: '#bbf7d0', fontSize: 20, fontWeight: '700' },
  doneSub: { color: '#9ca3af', fontSize: 14, textAlign: 'center' },
});

export default WhishSetupScreen;
