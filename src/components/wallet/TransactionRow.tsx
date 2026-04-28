import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { WalletTransaction } from '../../types';

interface TransactionRowProps {
  transaction: WalletTransaction;
}

const typeIcons: Record<string, { icon: string; color: string }> = {
  credit: { icon: 'arrow-down-circle', color: '#10b981' },
  debit: { icon: 'arrow-up-circle', color: '#ef4444' },
  pending: { icon: 'clock-outline', color: '#f59e0b' },
  refund: { icon: 'refresh-circle', color: '#3b82f6' },
};

const statusColors: Record<string, string> = {
  completed: '#10b981',
  pending: '#f59e0b',
  failed: '#ef4444',
};

const TransactionRow: React.FC<TransactionRowProps> = ({ transaction }) => {
  const { icon, color } = typeIcons[transaction.type] || typeIcons.credit;
  const date = new Date(transaction.createdAt);
  const formatted = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const time = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const isCredit = transaction.type === 'credit' || transaction.type === 'refund';

  return (
    <View style={styles.row}>
      <View style={[styles.iconWrap, { backgroundColor: `${color}20` }]}>
        <MaterialCommunityIcons name={icon as any} size={22} color={color} />
      </View>
      <View style={styles.details}>
        <Text style={styles.description} numberOfLines={1}>{transaction.description}</Text>
        <Text style={styles.dateText}>
          {formatted} · {time}
        </Text>
      </View>
      <View style={styles.right}>
        <Text style={[styles.amount, { color: isCredit ? '#10b981' : '#ef4444' }]}>
          {isCredit ? '+' : '-'}${Math.abs(transaction.amount).toFixed(2)}
        </Text>
        <View style={[styles.statusDot, { backgroundColor: statusColors[transaction.status] }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a2e',
    gap: 12,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  details: {
    flex: 1,
    gap: 3,
  },
  description: {
    color: '#f3f4f6',
    fontSize: 14,
    fontWeight: '500',
  },
  dateText: {
    color: '#4b5563',
    fontSize: 12,
  },
  right: {
    alignItems: 'flex-end',
    gap: 4,
  },
  amount: {
    fontSize: 15,
    fontWeight: '700',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    alignSelf: 'flex-end',
  },
});

export default TransactionRow;
