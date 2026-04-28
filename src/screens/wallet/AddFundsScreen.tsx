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
import { addFunds } from '../../api/wallet';

const PRESET_AMOUNTS = [10, 25, 50, 100, 200, 500];
const PAYMENT_METHODS = [
  { id: 'card', label: 'Credit/Debit Card', icon: 'credit-card' },
  { id: 'paypal', label: 'PayPal', icon: 'paypal' },
  { id: 'crypto', label: 'Cryptocurrency', icon: 'bitcoin' },
];

const AddFundsScreen: React.FC = () => {
  const navigation = useNavigation();
  const [amount, setAmount] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('card');
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState('');
  const [snackType, setSnackType] = useState<'default' | 'success' | 'error'>('default');

  const finalAmount = amount ? parseFloat(amount) : customAmount ? parseFloat(customAmount) : 0;

  const handleAddFunds = async () => {
    if (!finalAmount || finalAmount <= 0) {
      setSnackbar('Please select or enter a valid amount');
      setSnackType('error');
      return;
    }
    setLoading(true);
    try {
      await addFunds(finalAmount, selectedMethod);
      setSnackbar(`$${finalAmount.toFixed(2)} added to your wallet!`);
      setSnackType('success');
      setTimeout(() => navigation.goBack(), 2000);
    } catch {
      setSnackbar('Payment failed. Please try again.');
      setSnackType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <PageHeader
        title="Add Funds"
        subtitle="Top up your Disk Rider wallet"
        showBack
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.centerCard}>
          {/* Amount Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Amount</Text>
            <View style={styles.amountGrid}>
              {PRESET_AMOUNTS.map((a) => (
                <TouchableOpacity
                  key={a}
                  style={[styles.amountChip, amount === String(a) && styles.amountChipActive]}
                  onPress={() => { setAmount(String(a)); setCustomAmount(''); }}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.amountChipText, amount === String(a) && styles.amountChipTextActive]}>
                    ${a}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.customRow}>
              <Text style={styles.customLabel}>Or enter custom amount</Text>
              <View style={styles.customInput}>
                <Text style={styles.currencySign}>$</Text>
                <TextInput
                  style={styles.customInputField}
                  placeholder="0.00"
                  placeholderTextColor="#4b5563"
                  keyboardType="decimal-pad"
                  value={customAmount}
                  onChangeText={(v) => { setCustomAmount(v); setAmount(''); }}
                />
              </View>
            </View>
          </View>

          {/* Payment Method */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Method</Text>
            <View style={styles.methodList}>
              {PAYMENT_METHODS.map((m) => (
                <TouchableOpacity
                  key={m.id}
                  style={[styles.methodItem, selectedMethod === m.id && styles.methodItemActive]}
                  onPress={() => setSelectedMethod(m.id)}
                  activeOpacity={0.75}
                >
                  <View style={[styles.methodIcon, selectedMethod === m.id && styles.methodIconActive]}>
                    <MaterialCommunityIcons
                      name={m.icon as any}
                      size={22}
                      color={selectedMethod === m.id ? '#a855f7' : '#6b7280'}
                    />
                  </View>
                  <Text style={[styles.methodLabel, selectedMethod === m.id && styles.methodLabelActive]}>
                    {m.label}
                  </Text>
                  <View style={[styles.radioOuter, selectedMethod === m.id && styles.radioOuterActive]}>
                    {selectedMethod === m.id && <View style={styles.radioInner} />}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Summary */}
          {finalAmount > 0 && (
            <View style={styles.summary}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Amount</Text>
                <Text style={styles.summaryValue}>${finalAmount.toFixed(2)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Processing fee</Text>
                <Text style={styles.summaryValue}>$0.00</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryRow}>
                <Text style={styles.summaryTotal}>Total charged</Text>
                <Text style={[styles.summaryValue, styles.summaryTotal]}>
                  ${finalAmount.toFixed(2)}
                </Text>
              </View>
            </View>
          )}

          <Button
            label={`Add $${finalAmount > 0 ? finalAmount.toFixed(2) : '0.00'} to Wallet`}
            onPress={handleAddFunds}
            loading={loading}
            disabled={finalAmount <= 0}
            fullWidth
            size="lg"
            icon="wallet-plus"
            style={styles.addBtn}
          />
        </View>
      </ScrollView>

      <Snackbar message={snackbar} visible={!!snackbar} onDismiss={() => setSnackbar('')} type={snackType} />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0a0a0f' },
  content: { flexGrow: 1, padding: 20, alignItems: 'center' },
  centerCard: {
    width: '100%', maxWidth: 560,
    backgroundColor: '#12121a', borderRadius: 20, padding: 28,
    borderWidth: 1, borderColor: '#1e1e2e', gap: 24,
  },
  section: { gap: 14 },
  sectionTitle: { color: '#9ca3af', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  amountGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  amountChip: {
    paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12,
    backgroundColor: '#1a1a2e', borderWidth: 1.5, borderColor: '#1e1e2e', minWidth: 80,
  },
  amountChipActive: { borderColor: '#a855f7', backgroundColor: '#1a0f2e' },
  amountChipText: { color: '#9ca3af', fontSize: 16, fontWeight: '600', textAlign: 'center' },
  amountChipTextActive: { color: '#a855f7' },
  customRow: { gap: 8 },
  customLabel: { color: '#6b7280', fontSize: 13 },
  customInput: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#0a0a0f',
    borderRadius: 12, borderWidth: 1.5, borderColor: '#1e1e2e',
    paddingHorizontal: 14,
  },
  currencySign: { color: '#6b7280', fontSize: 18, fontWeight: '600', marginRight: 4 },
  customInputField: { flex: 1, color: '#f3f4f6', fontSize: 20, paddingVertical: 14, fontWeight: '600' },
  methodList: { gap: 8 },
  methodItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#0a0a0f', borderRadius: 12, borderWidth: 1.5,
    borderColor: '#1e1e2e', padding: 14,
  },
  methodItemActive: { borderColor: '#a855f7', backgroundColor: '#0f0a1a' },
  methodIcon: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: '#1a1a2e', justifyContent: 'center', alignItems: 'center',
  },
  methodIconActive: { backgroundColor: '#1a0f2e' },
  methodLabel: { color: '#9ca3af', fontSize: 15, fontWeight: '500', flex: 1 },
  methodLabelActive: { color: '#e5e7eb' },
  radioOuter: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 2,
    borderColor: '#374151', justifyContent: 'center', alignItems: 'center',
  },
  radioOuterActive: { borderColor: '#a855f7' },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#a855f7' },
  summary: {
    backgroundColor: '#0a0a0f', borderRadius: 12,
    padding: 16, borderWidth: 1, borderColor: '#1e1e2e', gap: 8,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { color: '#6b7280', fontSize: 14 },
  summaryValue: { color: '#f3f4f6', fontSize: 14, fontWeight: '600' },
  summaryDivider: { height: 1, backgroundColor: '#1e1e2e' },
  summaryTotal: { fontWeight: '700', color: '#10b981', fontSize: 16 },
  addBtn: { borderRadius: 14 },
});

export default AddFundsScreen;
