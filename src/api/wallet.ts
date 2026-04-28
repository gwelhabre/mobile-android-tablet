import apiClient from './client';
import { Wallet, WalletTransaction, PayoutRequest } from '../types';

export const getWallet = async (): Promise<Wallet> => {
  const response = await apiClient.get<Wallet>('/wallet');
  return response.data;
};

export const getTransactions = async (page = 1, limit = 20): Promise<WalletTransaction[]> => {
  const response = await apiClient.get<WalletTransaction[]>('/wallet/transactions', {
    params: { page, limit },
  });
  return response.data;
};

export const addFunds = async (amount: number, method: string, paymentDetails?: Record<string, string>): Promise<WalletTransaction> => {
  const response = await apiClient.post<WalletTransaction>('/wallet/add-funds', {
    amount,
    method,
    paymentDetails,
  });
  return response.data;
};

export const requestPayout = async (
  amount: number,
  method: string,
  accountDetails?: string,
  notes?: string
): Promise<PayoutRequest> => {
  const response = await apiClient.post<PayoutRequest>('/wallet/payout', {
    amount,
    method,
    accountDetails,
    notes,
  });
  return response.data;
};

export const getPayoutRequests = async (): Promise<PayoutRequest[]> => {
  const response = await apiClient.get<PayoutRequest[]>('/wallet/payouts');
  return response.data;
};

export const sendGift = async (djId: string, giftId: string, streamId?: string): Promise<WalletTransaction> => {
  const response = await apiClient.post<WalletTransaction>('/wallet/send-gift', {
    djId,
    giftId,
    streamId,
  });
  return response.data;
};
