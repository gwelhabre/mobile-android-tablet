import apiClient from './client';

export interface AdminReports {
  hiddenComments: any[];
  hiddenForumPosts: any[];
  hiddenReviews: any[];
  summary: {
    totalHiddenComments: number;
    totalHiddenForumPosts: number;
    totalHiddenReviews: number;
  };
}

export interface CommissionEntry {
  type: string;
  rate: number;
  effectiveAt: string;
  commissionTotal?: number;
  transactionCount?: number;
}

export interface PayoutRequest {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  createdAt: string;
  user?: { id: string; name?: string; email: string };
}

export interface AdCampaign {
  id: string;
  title: string;
  description?: string;
  status: 'draft' | 'live' | 'paused' | 'completed';
  budget: number;
  spent: number;
  startDate?: string;
  endDate?: string;
  createdAt: string;
}

export const getAdminReports = async (): Promise<AdminReports> => {
  const response = await apiClient.get<AdminReports>('/admin/reports');
  return response.data;
};

export const getAdminCommissions = async (): Promise<{ commissions: CommissionEntry[] }> => {
  const response = await apiClient.get<{ commissions: CommissionEntry[] }>('/admin/commissions');
  return response.data;
};

export const updateCommissionRate = async (transactionType: string, rate: number) => {
  const response = await apiClient.patch('/admin/commissions', { transactionType, rate });
  return response.data;
};

export const getAdminPayouts = async (status: 'pending' | 'all' | 'approved' | 'rejected' | 'paid' = 'pending'): Promise<PayoutRequest[]> => {
  const response = await apiClient.get<{ requests: PayoutRequest[] }>('/admin/payouts', { params: { status } });
  return response.data.requests ?? [];
};

export const updatePayoutRequest = async (payoutRequestId: string, action: 'approve' | 'reject' | 'mark_paid') => {
  const response = await apiClient.patch('/admin/payouts', { payoutRequestId, action });
  return response.data;
};

export const getAdCampaigns = async (): Promise<AdCampaign[]> => {
  const response = await apiClient.get<{ campaigns: AdCampaign[] }>('/admin/ads');
  return response.data.campaigns ?? [];
};

export const moderateItem = async (
  itemId: string,
  itemType: 'comment' | 'thread' | 'forumPost' | 'review',
  hide: boolean,
) => {
  const response = await apiClient.post('/admin/moderate', { itemId, itemType, hide });
  return response.data;
};
