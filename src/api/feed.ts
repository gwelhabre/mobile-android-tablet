import apiClient from './client';

export interface FeedCommentActivity {
  id: string;
  content: string;
  createdAt: string;
  displayName: string;
  event?: {
    id: string;
    title: string;
    venueName?: string;
    city?: string;
  } | null;
}

export const getFeedComments = async (limit = 10): Promise<FeedCommentActivity[]> => {
  const response = await apiClient.get<{ comments?: FeedCommentActivity[] }>('/feed', { params: { limit } });
  return response.data.comments ?? [];
};
