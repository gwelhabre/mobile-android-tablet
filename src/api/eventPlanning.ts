import apiClient from './client';
import { EventPlanningPack } from '../types';

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
