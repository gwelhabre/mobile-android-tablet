import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { WalletStackParamList } from '../../navigation/stacks/WalletStack';
import PageHeader from '../../components/layout/PageHeader';
import FAB from '../../components/layout/FAB';
import TransactionRow from '../../components/wallet/TransactionRow';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import Snackbar from '../../components/common/Snackbar';
import { getWallet, getTransactions } from '../../api/wallet';
import { Wallet, WalletTransaction } from '../../types';
import { useAuth } from '../../context/AuthContext';

type NavProp = NativeStackNavigationProp<WalletStackParamList, 'Wallet'>;

const StatChip: React.FC<{ label: string; value: string; icon: string; color: string }> = ({
  label, value, icon, color,
}) => (
  <View style={[styles.chip, { borderColor: `${color}30` }]}>
    <View style={[styles.chipIcon, { backgroundColor: `${color}20` }]}>
      <MaterialCommunityIcons name={icon as any} size={20} color={color} />
    </View>
    <View style={styles.chipText}>
      <Text style={[styles.chipValue, { color }]}>{value}</Text>
      <Text style={styles.chipLabel}>{label}</Text>
    </View>
  </View>
);

const WalletScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const { user } = useAuth();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [snackbar, setSnackbar] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [walletData, txData] = await Promise.all([
        getWallet(),
        getTransactions(),
      ]);
      setWallet(walletData.wallet);
      setTransactions(txData);
    } catch {
      setSnackbar('Failed to load wallet data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <LoadingSpinner fullScreen />;

  const fabActions = [
    { icon: 'plus-circle', label: 'Add Funds', onPress: () => navigation.navigate('AddFunds'), color: '#10b981' },
    ...(user?.role === 'dj' || user?.role === 'venue_manager'
      ? [{ icon: 'bank-transfer-out', label: 'Request Payout', onPress: () => navigation.navigate('Payout'), color: '#3b82f6' }]
      : []),
  ];

  return (
    <View style={styles.root}>
      <PageHeader
        title="Wallet"
        subtitle={`Balance · ${wallet?.currency || 'USD'}`}
        actions={[
          { icon: 'home', onPress: () => navigation.dispatch(DrawerActions.jumpTo('HomeStack' as any)) },
          { icon: 'history', onPress: () => {} },
        ]}
      />

      {/* Stat Chips */}
      <View style={styles.statsArea}>
        <StatChip
          label="Available Balance"
          value={`$${(wallet?.balance || 0).toFixed(2)}`}
          icon="wallet"
          color="#a855f7"
        />
        <StatChip
          label="Pending"
          value={`$${(wallet?.pendingBalance || 0).toFixed(2)}`}
          icon="clock-outline"
          color="#f59e0b"
        />
        <StatChip
          label="Total Earned"
          value={`$${(wallet?.totalEarned || 0).toFixed(2)}`}
          icon="trending-up"
          color="#10b981"
        />
        <StatChip
          label="Transactions"
          value={String(transactions.length)}
          icon="swap-horizontal"
          color="#3b82f6"
        />
      </View>

      {/* Transactions List */}
      <View style={styles.txSection}>
        <View style={styles.txHeader}>
          <Text style={styles.txTitle}>Recent Transactions</Text>
        </View>
        {transactions.length === 0 ? (
          <EmptyState
            icon="swap-horizontal"
            title="No transactions yet"
            message="Add funds to get started"
            actionLabel="Add Funds"
            onAction={() => navigation.navigate('AddFunds')}
          />
        ) : (
          <FlatList
            data={transactions}
            keyExtractor={(t) => t.id}
            renderItem={({ item }) => <TransactionRow transaction={item} />}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => { setRefreshing(true); fetchData(); }}
                tintColor="#a855f7"
              />
            }
            contentContainerStyle={{ paddingBottom: 100 }}
          />
        )}
      </View>

      <FAB
        icon="plus"
        actions={fabActions.length > 1 ? fabActions : undefined}
        onPress={fabActions.length === 1 ? fabActions[0].onPress : undefined}
        color="#a855f7"
      />

      <Snackbar message={snackbar} visible={!!snackbar} onDismiss={() => setSnackbar('')} type="error" />
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0a0a0f' },
  statsArea: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 12,
    padding: 16, borderBottomWidth: 1, borderBottomColor: '#1e1e2e',
  },
  chip: {
    flex: 1, minWidth: 160,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#12121a', borderRadius: 14, padding: 14,
    borderWidth: 1,
  },
  chipIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  chipText: { flex: 1 },
  chipValue: { fontSize: 20, fontWeight: '800' },
  chipLabel: { color: '#6b7280', fontSize: 12, marginTop: 1 },
  txSection: { flex: 1 },
  txHeader: {
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#1e1e2e',
  },
  txTitle: { color: '#9ca3af', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
});

export default WalletScreen;
