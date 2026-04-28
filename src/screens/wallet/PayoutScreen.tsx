import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import PageHeader from '../../components/layout/PageHeader';
import TwoPane from '../../components/layout/TwoPane';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import Snackbar from '../../components/common/Snackbar';
import { requestPayout, getPayoutRequests, getWallet } from '../../api/wallet';
import { PayoutRequest } from '../../types';

const METHOD_OPTIONS = ['bank_transfer', 'paypal', 'crypto', 'check'];
const statusColors: Record<string, string> = {
  pending: '#f59e0b', approved: '#3b82f6', processing: '#a855f7',
  completed: '#10b981', rejected: '#ef4444',
};

const PayoutScreen: React.FC = () => {
  const navigation = useNavigation();
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('bank_transfer');
  const [accountDetails, setAccountDetails] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [loadingPayouts, setLoadingPayouts] = useState(true);
  const [availableBalance, setAvailableBalance] = useState(0);
  const [snackbar, setSnackbar] = useState('');
  const [snackType, setSnackType] = useState<'default' | 'success' | 'error'>('default');

  const fetchData = useCallback(async () => {
    try {
      const [payoutData, walletData] = await Promise.all([
        getPayoutRequests(),
        getWallet(),
      ]);
      setPayouts(payoutData);
      setAvailableBalance(walletData.balance);
    } catch {
      setSnackbar('Failed to load data');
      setSnackType('error');
    } finally {
      setLoadingPayouts(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmit = async () => {
    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum <= 0) {
      setSnackbar('Enter a valid amount');
      setSnackType('error');
      return;
    }
    if (amountNum > availableBalance) {
      setSnackbar('Amount exceeds available balance');
      setSnackType('error');
      return;
    }
    setLoading(true);
    try {
      const newPayout = await requestPayout(amountNum, method, accountDetails, notes);
      setPayouts((prev) => [newPayout, ...prev]);
      setAmount('');
      setAccountDetails('');
      setNotes('');
      setSnackbar('Payout request submitted!');
      setSnackType('success');
    } catch {
      setSnackbar('Payout request failed');
      setSnackType('error');
    } finally {
      setLoading(false);
    }
  };

  const leftContent = (
    <View style={styles.formContainer}>
      <Text style={styles.formTitle}>Request Payout</Text>
      <View style={styles.balanceInfo}>
        <MaterialCommunityIcons name="wallet" size={18} color="#10b981" />
        <Text style={styles.balanceText}>Available: <Text style={styles.balanceAmount}>${availableBalance.toFixed(2)}</Text></Text>
      </View>

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Amount (USD)</Text>
        <View style={styles.inputWrap}>
          <Text style={styles.currencySign}>$</Text>
          <TextInput
            style={styles.amountInput}
            placeholder="0.00"
            placeholderTextColor="#4b5563"
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={setAmount}
          />
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Payout Method</Text>
        <View style={styles.methodOptions}>
          {METHOD_OPTIONS.map((m) => (
            <TouchableOpacity
              key={m}
              style={[styles.methodOpt, method === m && styles.methodOptActive]}
              onPress={() => setMethod(m)}
              activeOpacity={0.75}
            >
              <Text style={[styles.methodOptText, method === m && styles.methodOptTextActive]}>
                {m.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Account Details</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Account number, email, or address..."
          placeholderTextColor="#4b5563"
          multiline
          numberOfLines={3}
          value={accountDetails}
          onChangeText={setAccountDetails}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Notes (optional)</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Additional information..."
          placeholderTextColor="#4b5563"
          value={notes}
          onChangeText={setNotes}
        />
      </View>

      <Button
        label="Submit Payout Request"
        onPress={handleSubmit}
        loading={loading}
        fullWidth
        size="lg"
        icon="bank-transfer-out"
        color="#3b82f6"
        style={{ borderRadius: 12, marginTop: 8 }}
      />
    </View>
  );

  const rightContent = loadingPayouts ? (
    <LoadingSpinner message="Loading payout history..." />
  ) : payouts.length === 0 ? (
    <EmptyState icon="bank-transfer-out" title="No payout requests" message="Submit a request to see your history" />
  ) : (
    <View>
      <Text style={styles.historyTitle}>Payout History</Text>
      <View style={styles.historyHeader}>
        {['Date', 'Amount', 'Method', 'Status'].map((h) => (
          <Text key={h} style={styles.historyHeaderCell}>{h}</Text>
        ))}
      </View>
      <FlatList
        data={payouts}
        keyExtractor={(p) => p.id}
        scrollEnabled={false}
        renderItem={({ item }) => (
          <View style={styles.historyRow}>
            <Text style={styles.historyCell}>
              {new Date(item.requestedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </Text>
            <Text style={[styles.historyCell, { color: '#10b981', fontWeight: '600' }]}>
              ${item.amount.toFixed(2)}
            </Text>
            <Text style={styles.historyCell}>
              {item.method.replace('_', ' ')}
            </Text>
            <Badge
              label={item.status.toUpperCase()}
              color={statusColors[item.status] || '#6b7280'}
              small
            />
          </View>
        )}
      />
    </View>
  );

  return (
    <View style={styles.root}>
      <PageHeader
        title="Payout"
        subtitle="Request earnings withdrawal"
        showBack
        onBack={() => navigation.goBack()}
      />
      <TwoPane leftContent={leftContent} rightContent={rightContent} leftFlex={2} rightFlex={3} />
      <Snackbar message={snackbar} visible={!!snackbar} onDismiss={() => setSnackbar('')} type={snackType} />
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0a0a0f' },
  formContainer: { gap: 18 },
  formTitle: { color: '#f3f4f6', fontSize: 20, fontWeight: '700' },
  balanceInfo: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#064e3b30', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: '#10b98130',
  },
  balanceText: { color: '#9ca3af', fontSize: 13 },
  balanceAmount: { color: '#10b981', fontWeight: '700', fontSize: 15 },
  field: { gap: 6 },
  fieldLabel: { color: '#9ca3af', fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#0a0a0f', borderRadius: 10, borderWidth: 1.5, borderColor: '#1e1e2e', paddingHorizontal: 14,
  },
  currencySign: { color: '#6b7280', fontSize: 18, fontWeight: '600', marginRight: 6 },
  amountInput: { flex: 1, color: '#f3f4f6', fontSize: 20, fontWeight: '600', paddingVertical: 13 },
  methodOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  methodOpt: {
    paddingVertical: 9, paddingHorizontal: 16, borderRadius: 10,
    backgroundColor: '#1a1a2e', borderWidth: 1.5, borderColor: '#1e1e2e',
  },
  methodOptActive: { borderColor: '#3b82f6', backgroundColor: '#1a2540' },
  methodOptText: { color: '#6b7280', fontSize: 13, fontWeight: '500' },
  methodOptTextActive: { color: '#3b82f6', fontWeight: '600' },
  textArea: {
    backgroundColor: '#0a0a0f', borderRadius: 10, borderWidth: 1.5, borderColor: '#1e1e2e',
    color: '#f3f4f6', fontSize: 14, padding: 12, minHeight: 80, textAlignVertical: 'top',
  },
  textInput: {
    backgroundColor: '#0a0a0f', borderRadius: 10, borderWidth: 1.5,
    borderColor: '#1e1e2e', color: '#f3f4f6', fontSize: 14,
    paddingHorizontal: 12, paddingVertical: 12,
  },
  historyTitle: { color: '#f3f4f6', fontSize: 18, fontWeight: '700', marginBottom: 14 },
  historyHeader: {
    flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 12,
    backgroundColor: '#12121a', borderRadius: 10, marginBottom: 4,
    borderWidth: 1, borderColor: '#1e1e2e',
  },
  historyHeaderCell: { flex: 1, color: '#4b5563', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  historyRow: {
    flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 12,
    borderBottomWidth: 1, borderBottomColor: '#1a1a2e', alignItems: 'center',
  },
  historyCell: { flex: 1, color: '#9ca3af', fontSize: 13 },
});

export default PayoutScreen;
