import apiClient from './client';
import {
  EventPlannerRevenueLog,
  EventPlanningPack,
  EventQuoteRequest,
  EventQuotation,
} from '../types';

export interface CreateEventQuoteRequestInput {
  packId: number | string;
  eventDate: string;
  startTime: string;
  endTime: string;
  location: string;
  selections: Record<string, string>;
  addons: string[];
  note?: string;
}

export interface CreateEventQuotationInput {
  requestId: number | string;
  title: string;
  lineItems: Array<{ name: string; amount: number }>;
  total: number;
  notes?: string;
}

export interface CreateEventPlanningPackInput {
  title: string;
  subtitle?: string;
  description?: string;
  basePrice?: number | null;
  status?: 'draft' | 'published';
  components?: EventPlanningPack['components'];
  addons?: string[];
}

export interface UpdateEventPlanningPackInput {
  title?: string;
  subtitle?: string;
  description?: string;
  basePrice?: number | null;
  status?: 'draft' | 'published';
  components?: EventPlanningPack['components'];
  addons?: string[];
}

export const getEventPlanningPacks = async (mine = false): Promise<EventPlanningPack[]> => {
  const response = await apiClient.get<EventPlanningPack[]>('/event-planning/packs', {
    params: mine ? { mine: 'true' } : undefined,
  });
  return response.data;
};

export const createEventPlanningPack = async (
  input: CreateEventPlanningPackInput,
): Promise<EventPlanningPack> => {
  const response = await apiClient.post<EventPlanningPack>('/event-planning/packs', input);
  return response.data;
};

export const updateEventPlanningPack = async (
  packId: number | string,
  input: UpdateEventPlanningPackInput,
): Promise<EventPlanningPack> => {
  const response = await apiClient.patch<EventPlanningPack>(`/event-planning/packs/${packId}`, input);
  return response.data;
};

export const deleteEventPlanningPack = async (packId: number | string): Promise<void> => {
  await apiClient.delete(`/event-planning/packs/${packId}`);
};

export const createEventQuoteRequest = async (
  input: CreateEventQuoteRequestInput,
): Promise<{ request: EventQuoteRequest; quoteFee: number; newBalance: number }> => {
  const response = await apiClient.post<{ request: EventQuoteRequest; quoteFee: number; newBalance: number }>(
    '/event-planning/requests',
    input,
  );
  return response.data;
};

export const getEventQuoteRequests = async (): Promise<EventQuoteRequest[]> => {
  const response = await apiClient.get<EventQuoteRequest[]>('/event-planning/requests');
  return response.data;
};

export const createEventQuotation = async (
  input: CreateEventQuotationInput,
): Promise<EventQuotation> => {
  const response = await apiClient.post<EventQuotation>('/event-planning/quotations', input);
  return response.data;
};

export const getEventPlannerRevenue = async (): Promise<EventPlannerRevenueLog[]> => {
  const response = await apiClient.get<EventPlannerRevenueLog[]>('/event-planning/revenue');
  return response.data;
};

export const selectEventQuotation = async (
  quotationId: number | string,
  paymentMethod: 'cash' | 'wallet',
): Promise<{ request: EventQuoteRequest; quotation: EventQuotation }> => {
  const response = await apiClient.post<{ request: EventQuoteRequest; quotation: EventQuotation }>(
    `/event-planning/quotations/${quotationId}/select`,
    { paymentMethod },
  );
  return response.data;
};

export const rejectEventQuotation = async (
  quotationId: number | string,
): Promise<{ quotation: EventQuotation }> => {
  const response = await apiClient.post<{ quotation: EventQuotation }>(
    `/event-planning/quotations/${quotationId}/reject`,
    {},
  );
  return response.data;
};
