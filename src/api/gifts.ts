import apiClient from './client';
import { GiftCatalogItem, GiftShowcase } from '../types';

export const getGiftCatalog = async (): Promise<GiftCatalogItem[]> => {
  const response = await apiClient.get<GiftCatalogItem[]>('/gifts/catalog');
  return response.data;
};

export const getGiftById = async (giftId: string): Promise<GiftCatalogItem> => {
  const response = await apiClient.get<GiftCatalogItem>(`/gifts/${giftId}`);
  return response.data;
};

export const sendGiftToDJ = async (
  djId: string,
  giftId: string,
  streamId?: string,
  message?: string
): Promise<{
  giftSend: Record<string, unknown>;
  sellerAmount: number;
  platformAmount: number;
  buyerBalance: number;
  split: { platformRate: number; djRate: number };
}> => {
  const response = await apiClient.post('/gifts/send', {
    djId,
    giftId,
    streamId,
    message,
  });
  return response.data;
};

export const getReceivedGifts = async (djId?: string): Promise<GiftShowcase> => {
  const response = await apiClient.get<GiftShowcase>('/gifts/received', {
    params: djId ? { djId } : undefined,
  });
  return response.data;
};

export const getTopGiftedDJs = async (period = '7d'): Promise<{ djId: string; djName: string; total: number }[]> => {
  const response = await apiClient.get('/gifts/top-djs', { params: { period } });
  return response.data;
};

export const getGiftHistory = async (): Promise<Record<string, unknown>[]> => {
  const response = await apiClient.get('/gifts/history');
  return response.data;
};
