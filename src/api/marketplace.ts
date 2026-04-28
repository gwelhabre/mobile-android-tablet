import apiClient from './client';
import { MarketplaceProduct, MarketplaceOrder } from '../types';

export const getProducts = async (
  page = 1,
  limit = 20,
  category?: string,
  query?: string
): Promise<MarketplaceProduct[]> => {
  const response = await apiClient.get<MarketplaceProduct[]>('/marketplace/products', {
    params: { page, limit, category, q: query },
  });
  return response.data;
};

export const getProductById = async (productId: string): Promise<MarketplaceProduct> => {
  const response = await apiClient.get<MarketplaceProduct>(`/marketplace/products/${productId}`);
  return response.data;
};

export const createProduct = async (data: Partial<MarketplaceProduct>): Promise<MarketplaceProduct> => {
  const response = await apiClient.post<MarketplaceProduct>('/marketplace/products', data);
  return response.data;
};

export const updateProduct = async (productId: string, data: Partial<MarketplaceProduct>): Promise<MarketplaceProduct> => {
  const response = await apiClient.patch<MarketplaceProduct>(`/marketplace/products/${productId}`, data);
  return response.data;
};

export const purchaseProduct = async (productId: string): Promise<MarketplaceOrder> => {
  const response = await apiClient.post<{ order?: MarketplaceOrder; newBalance?: number } | MarketplaceOrder>('/marketplace/buy', { productId });
  const payload = response.data as { order?: MarketplaceOrder } | MarketplaceOrder;
  return 'order' in payload && payload.order ? payload.order : (payload as MarketplaceOrder);
};

export const getMyOrders = async (): Promise<MarketplaceOrder[]> => {
  const response = await apiClient.get<MarketplaceOrder[]>('/marketplace/orders');
  return response.data;
};

export const getMyListings = async (): Promise<MarketplaceProduct[]> => {
  const response = await apiClient.get<MarketplaceProduct[]>('/marketplace/my-listings');
  return response.data;
};

export const searchProducts = async (query: string): Promise<MarketplaceProduct[]> => {
  const response = await apiClient.get<MarketplaceProduct[]>('/marketplace/products/search', {
    params: { q: query },
  });
  return response.data;
};
