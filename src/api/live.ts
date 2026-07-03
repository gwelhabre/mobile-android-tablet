import apiClient from './client';

// Live broadcast control. The backend provisions a YouTube broadcast and returns
// the RTMP ingest URL + key the phone's encoder publishes to.

export interface StartBroadcastResult {
  liveStream: {
    id: string;
    youtubeVideoId?: string | null;
    youtubeBroadcastId?: string | null;
  };
  ingest: { url: string; streamKey: string; videoId?: string | null };
}

export const startBroadcast = async (eventId: string): Promise<StartBroadcastResult> => {
  const res = await apiClient.post<StartBroadcastResult>('/live', { action: 'start', eventId });
  return res.data;
};

export const stopBroadcast = async (eventId: string) => {
  const res = await apiClient.post('/live', { action: 'stop', eventId });
  return res.data;
};

export const getBroadcastStatus = async (broadcastId: string) => {
  const res = await apiClient.get(`/youtube/status/${broadcastId}`);
  return res.data as { lifeCycleStatus: string | null; isLive: boolean; isComplete: boolean };
};

export interface StreamViewers {
  viewerCount: number;
  peakViewers: number;
  status: string;
}

/** Real concurrent viewers for a live stream (server-cached from YouTube). */
export const getStreamViewers = async (liveId: string | number): Promise<StreamViewers> => {
  const res = await apiClient.get<StreamViewers>(`/live/${liveId}/viewers`);
  return res.data;
};

export interface MyEvent {
  id: string;
  title: string;
  venueName?: string;
}

export const getMyUpcomingEvents = async (): Promise<MyEvent[]> => {
  const res = await apiClient.get('/dj/dashboard/events');
  const list = Array.isArray(res.data) ? res.data : res.data?.events ?? [];
  return list.map((e: any) => ({ id: e.id, title: e.title, venueName: e.venue?.name }));
};
