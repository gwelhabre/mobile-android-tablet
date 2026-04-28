import apiClient from './client';

export interface EventComment {
  id: string;
  content: string;
  displayName: string;
  createdAt: string;
}

export const postEventComment = async (eventId: string, content: string): Promise<EventComment> => {
  const response = await apiClient.post<{ comment: EventComment }>('/comments', { eventId, content });
  return response.data.comment;
};

export const getLiveComments = async (liveId: number | string): Promise<EventComment[]> => {
  const response = await apiClient.get<{ comments: EventComment[] }>('/comments', { params: { liveId } });
  return response.data.comments ?? [];
};
