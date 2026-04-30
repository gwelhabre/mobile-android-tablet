import apiClient from './client';

export const SUPPORTED_TIP_CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF', 'NZD', 'SEK', 'NOK', 'DKK'] as const;
export type TipCurrency = typeof SUPPORTED_TIP_CURRENCIES[number];

export const TIP_CURRENCY_SYMBOLS: Record<TipCurrency, string> = {
  USD: '$', EUR: '€', GBP: '£', CAD: 'C$', AUD: 'A$', JPY: '¥', CHF: 'CHF', NZD: 'NZ$', SEK: 'kr', NOK: 'kr', DKK: 'kr',
};

export interface SendTipInput {
  djId: number | string;
  amount: number;
  liveId?: number | string;
  eventId?: number | string;
  message?: string;
  currency?: TipCurrency;
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
