import apiClient from './client';

export interface SendTipInput {
  djId: number | string;
  amount: number;
  liveId?: number | string;
  eventId?: number | string;
  message?: string;
}

export interface SendTipResponse {
  tip: object;
  sellerAmount: number;
  platformAmount: number;
  buyerBalance: number;
  maxAmount: number;
  remainingAmount: number;
  currency: string;
  split: {
    platformRate: number;
    djRate: number;
  };
  commissionPurpose: string;
}

export const sendTip = async (input: SendTipInput): Promise<SendTipResponse> => {
  const response = await apiClient.post<SendTipResponse>('/tips/send', input);
  return response.data;
};
