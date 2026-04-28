import apiClient from './client';

export interface FollowResponse {
  following: boolean;
  followed?: boolean;
  count?: number;
}

export const followVenue = async (venueId: string): Promise<FollowResponse> => {
  const response = await apiClient.post<FollowResponse>('/follow', { venueId });
  return response.data;
};

export const followDJ = async (djId: string): Promise<FollowResponse> => {
  const response = await apiClient.post<FollowResponse>('/follow', { djId });
  return response.data;
};
