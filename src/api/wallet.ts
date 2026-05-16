import apiClient from './client';
import {
  Wallet,
  WalletTransaction,
  PayoutRequest,
  RidesPackage,
  WhishStatus,
  WhishVerificationStart,
} from '../types';

export const getWallet = async (): Promise<{ wallet: Wallet; whish: WhishStatus | null }> => {
  const response = await apiClient.get<{ wallet: Wallet; whish: WhishStatus | null }>('/wallet');
  return response.data;
};

export const getTransactions = async (page = 1, limit = 20): Promise<WalletTransaction[]> => {
  const response = await apiClient.get<WalletTransaction[]>('/wallet/transactions', {
    params: { page, limit },
  });
  return response.data;
};

export const getRidesPackages = async (): Promise<RidesPackage[]> => {
  const response = await apiClient.get<{ packages: RidesPackage[] }>('/wallet/packages');
  return response.data.packages ?? [];
};

export const createCheckout = async (packageId: string): Promise<{ url: string; sessionId: string }> => {
  const response = await apiClient.post<{ url: string; sessionId: string }>('/wallet/checkout', { packageId });
  return response.data;
};

export const requestPayout = async (
  amount: number,
  notes?: string,
): Promise<PayoutRequest> => {
  const response = await apiClient.post<{ payoutRequest: PayoutRequest }>('/wallet/payout', { amount, notes });
  return response.data.payoutRequest;
};

export const getPayoutRequests = async (): Promise<PayoutRequest[]> => {
  const response = await apiClient.get<{ requests: PayoutRequest[] }>('/wallet/payout');
  return response.data.requests ?? [];
};

export const setupWhish = async (phone: string): Promise<WhishVerificationStart> => {
  const response = await apiClient.post<WhishVerificationStart>('/wallet/whish/setup', { phone });
  return response.data;
};

export const verifyWhish = async (
  verificationId: string,
  code: string,
): Promise<{ user: WhishStatus }> => {
  const response = await apiClient.post<{ user: WhishStatus }>('/wallet/whish/verify', { verificationId, code });
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
