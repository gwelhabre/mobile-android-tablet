import apiClient from './client';
import { DJProfile, DigitalSet, BookingDeal } from '../types';

export const getDJs = async (page = 1, limit = 20, genre?: string, city?: string): Promise<DJProfile[]> => {
  const response = await apiClient.get<DJProfile[]>('/djs', {
    params: { page, limit, genre, city },
  });
  return response.data;
};

export const getDJById = async (djId: string): Promise<DJProfile> => {
  const response = await apiClient.get<DJProfile>(`/djs/${djId}`);
  return response.data;
};

export const getMyDJProfile = async (): Promise<DJProfile> => {
  const response = await apiClient.get<DJProfile>('/djs/me');
  return response.data;
};

export const updateDJProfile = async (data: Partial<DJProfile>): Promise<DJProfile> => {
  const response = await apiClient.patch<DJProfile>('/djs/me', data);
  return response.data;
};

export const getDJSets = async (djId?: string): Promise<DigitalSet[]> => {
  const endpoint = djId ? `/djs/${djId}/sets` : '/djs/me/sets';
  const response = await apiClient.get<DigitalSet[]>(endpoint);
  return response.data;
};

export const createSet = async (data: Partial<DigitalSet>): Promise<DigitalSet> => {
  const response = await apiClient.post<DigitalSet>('/djs/me/sets', data);
  return response.data;
};

export const updateSet = async (setId: string, data: Partial<DigitalSet>): Promise<DigitalSet> => {
  const response = await apiClient.patch<DigitalSet>(`/djs/me/sets/${setId}`, data);
  return response.data;
};

export const deleteSet = async (setId: string): Promise<void> => {
  await apiClient.delete(`/djs/me/sets/${setId}`);
};

export const getDJDeals = async (): Promise<BookingDeal[]> => {
  const response = await apiClient.get<BookingDeal[]>('/djs/me/deals');
  return response.data;
};

export const respondToDeal = async (dealId: string, action: 'accept' | 'reject', notes?: string): Promise<BookingDeal> => {
  const response = await apiClient.post<BookingDeal>(`/deals/${dealId}/respond`, { action, notes });
  return response.data;
};

export const followDJ = async (djId: string): Promise<{ following: boolean }> => {
  const response = await apiClient.post<{ following: boolean }>('/follow', { djId });
  return response.data;
};

export const unfollowDJ = async (djId: string): Promise<{ following: boolean }> => {
  const response = await apiClient.post<{ following: boolean }>('/follow', { djId });
  return response.data;
};

export const createDJSet = async (payload: {
  title: string;
  description?: string;
  coverImage?: string;
  previewUrl?: string;
  price?: number;
  accessType?: 'free' | 'paid' | 'subscription';
  visibility?: 'public' | 'unlisted' | 'private';
}) => {
  const mappedAccessType = payload.accessType === 'paid' ? 'purchase'
    : payload.accessType === 'subscription' ? 'stream'
    : 'purchase';
  const mappedVisibility = payload.visibility === 'private' || payload.visibility === 'unlisted'
    ? 'members_only'
    : 'public';
  const response = await apiClient.post('/djs/me/sets', {
    ...payload,
    accessType: mappedAccessType,
    visibility: mappedVisibility,
  });
  return response.data;
};

export interface DJDashboardEvent {
  id: string;
  title: string;
  startTime: string;
  status: string;
  venue: { id: string; name: string; city?: string };
  liveStream?: { id: string; status: string; streamKey: string | null } | null;
}

export const getDJDashboardEvents = async (status?: string): Promise<DJDashboardEvent[]> => {
  const response = await apiClient.get<{ events: DJDashboardEvent[] }>('/dj/dashboard/events', {
    params: status ? { status } : undefined,
  });
  return response.data.events ?? [];
};

export const djStreamAction = async (action: 'start' | 'stop', eventId: string) => {
  const response = await apiClient.post('/live', { action, eventId });
  return response.data;
};

export const getDJAnalytics = async (period: string = '30d'): Promise<Record<string, unknown>> => {
  const response = await apiClient.get('/djs/me/analytics', { params: { period } });
  return response.data;
};

export const searchDJs = async (query: string): Promise<DJProfile[]> => {
  const response = await apiClient.get<DJProfile[]>('/djs/search', { params: { q: query } });
  return response.data;
};

/** Cross-platform helper — DJ display name regardless of which schema field the platform uses. */
export const getDjDisplayName = (dj: any): string => {
  if (!dj) return 'DJ';
  return dj.stageName ?? dj.displayName ?? dj.username ?? 'DJ';
};
