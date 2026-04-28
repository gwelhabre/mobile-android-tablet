import apiClient from './client';
import { Competition, CompetitionEntry, ForumCategory, ForumReply, ForumThread, RankingEntry, Venue } from '../types';

type AnyRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is AnyRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const asString = (value: unknown): string | undefined => {
  if (typeof value === 'string' && value.trim()) return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return undefined;
};

const asNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
};

const firstString = (...values: unknown[]) => values.map(asString).find(Boolean);
const firstNumber = (...values: unknown[]) => {
  for (const value of values) {
    const parsed = asNumber(value);
    if (parsed !== undefined) return parsed;
  }
  return undefined;
};
const firstId = (...values: unknown[]) => {
  for (const value of values) {
    const parsedNumber = asNumber(value);
    if (parsedNumber !== undefined) return String(parsedNumber);
    const parsedString = asString(value);
    if (parsedString) return parsedString;
  }
  return undefined;
};
const firstGenre = (...values: unknown[]) => {
  for (const value of values) {
    if (Array.isArray(value)) {
      const genre = value.map(asString).find(Boolean);
      if (genre) return genre;
    }
    if (typeof value === 'string' && value.trim()) {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          const genre = parsed.map(asString).find(Boolean);
          if (genre) return genre;
        }
      } catch {
        return value;
      }
      return value;
    }
  }
  return undefined;
};

const unwrapList = (data: unknown, key: string): unknown[] => {
  if (Array.isArray(data)) return data;
  if (!isRecord(data)) return [];
  if (Array.isArray(data[key])) return data[key] as unknown[];
  if (Array.isArray(data.data)) return data.data;
  if (isRecord(data.data)) {
    if (Array.isArray(data.data[key])) return data.data[key] as unknown[];
    if (Array.isArray(data.data.items)) return data.data.items;
    if (Array.isArray(data.data.results)) return data.data.results;
  }
  return [];
};

const normalizeRankingEntry = (value: unknown, index: number): RankingEntry | undefined => {
  if (!isRecord(value)) return undefined;

  const dj = isRecord(value.dj) ? value.dj : isRecord(value.djProfile) ? value.djProfile : undefined;
  const user = dj && isRecord(dj.user) ? dj.user : undefined;
  const rank = firstNumber(value.rank, value.globalRank, value.position, value.ranking, dj?.rank, dj?.globalRank, dj?.rankingPosition) ?? index + 1;

  return {
    rank,
    djId: firstId(value.djId, dj?.id, value.id) ?? String(rank),
    stageName: firstString(value.stageName, value.displayName, value.djName, value.name, dj?.stageName, dj?.displayName, dj?.name, user?.name) ?? `DJ #${rank}`,
    avatar: firstString(value.avatar, value.profileImage, value.imageUrl, dj?.avatar, dj?.profileImage, dj?.avatarUrl, user?.avatarUrl),
    city: firstString(value.city, value.baseCity, dj?.city, dj?.baseCity) ?? '',
    country: firstString(value.country, dj?.country) ?? '',
    genre: firstGenre(value.genre, value.genres, dj?.genre, dj?.genres) ?? '',
    score: firstNumber(value.score, value.rankingScore, dj?.score, dj?.rankingScore) ?? 0,
    followersCount: firstNumber(value.followersCount, value.totalFollowers, value.followers, dj?.followersCount, dj?.totalFollowers) ?? 0,
    previousRank: firstNumber(value.previousRank, value.previousGlobalRank, value.lastRank),
    change: firstNumber(value.change, value.rankChange, value.delta) ?? 0,
  };
};

const titleCase = (value: string) =>
  value.charAt(0).toUpperCase() + value.slice(1).replace(/[-_]/g, ' ');

const normalizeForumCategory = (value: unknown): ForumCategory | undefined => {
  if (typeof value === 'string') {
    return {
      id: value,
      name: titleCase(value),
      iconName: 'forum-outline',
      threadCount: 0,
    };
  }
  if (!isRecord(value)) return undefined;

  const id = firstString(value.id, value.slug, value.category, value.name);
  if (!id) return undefined;

  return {
    id,
    name: firstString(value.name, value.label, value.title) ?? titleCase(id),
    description: firstString(value.description),
    iconName: firstString(value.iconName, value.icon, value.icon_name) ?? 'forum-outline',
    threadCount: firstNumber(value.threadCount, value.threadsCount, value.postsCount, value.count) ?? 0,
    color: firstString(value.color),
  };
};

const normalizeForumReply = (value: unknown): ForumReply | undefined => {
  if (!isRecord(value)) return undefined;

  const id = firstId(value.id);
  if (!id) return undefined;
  const author = isRecord(value.author) ? value.author : undefined;

  return {
    id,
    threadId: firstId(value.threadId) ?? '',
    authorId: firstId(value.authorId, author?.id) ?? '',
    authorName: firstString(value.authorName, value.authorUsername, value.username, author?.name, author?.username) ?? 'User',
    authorAvatarUrl: firstString(value.authorAvatarUrl, value.avatarUrl, author?.avatarUrl, author?.image),
    body: firstString(value.body, value.content, value.text) ?? '',
    likeCount: firstNumber(value.likeCount, value.likesCount) ?? 0,
    createdAt: firstString(value.createdAt) ?? new Date().toISOString(),
  };
};

const normalizeForumThread = (value: unknown): ForumThread | undefined => {
  if (!isRecord(value)) return undefined;

  const id = firstId(value.id);
  if (!id) return undefined;
  const author = isRecord(value.author) ? value.author : undefined;
  const replies = unwrapList(value.replies, 'replies')
    .map(normalizeForumReply)
    .filter((reply): reply is ForumReply => Boolean(reply));

  return {
    id,
    authorId: firstId(value.authorId, author?.id) ?? '',
    authorName: firstString(value.authorName, value.authorUsername, value.username, author?.name, author?.username) ?? 'User',
    authorAvatarUrl: firstString(value.authorAvatarUrl, value.avatarUrl, author?.avatarUrl, author?.image),
    categoryId: firstId(value.categoryId, value.category) ?? '',
    categoryName: firstString(value.categoryName, value.category) ?? '',
    title: firstString(value.title) ?? 'Untitled thread',
    body: firstString(value.body, value.content, value.excerpt) ?? '',
    replyCount: firstNumber(value.replyCount, value.repliesCount) ?? replies.length,
    viewCount: firstNumber(value.viewCount, value.viewsCount) ?? 0,
    likeCount: firstNumber(value.likeCount, value.likesCount) ?? 0,
    isPinned: Boolean(value.isPinned),
    isLocked: Boolean(value.isLocked),
    lastActivityAt: firstString(value.lastActivityAt, value.lastReplyAt, value.updatedAt, value.createdAt) ?? new Date().toISOString(),
    createdAt: firstString(value.createdAt) ?? new Date().toISOString(),
    replies,
  };
};

export const getRankings = async (
  page = 1,
  limit = 50,
  genre?: string,
  city?: string,
  period = 'all_time'
): Promise<RankingEntry[]> => {
  const response = await apiClient.get<unknown>('/rankings', {
    params: { page, limit, genre, city, period },
  });
  return unwrapList(response.data, 'rankings')
    .map(normalizeRankingEntry)
    .filter((entry): entry is RankingEntry => Boolean(entry));
};

export const getMyRanking = async (): Promise<RankingEntry> => {
  const response = await apiClient.get<RankingEntry>('/rankings/me');
  return response.data;
};

export const getCompetitions = async (status?: string): Promise<Competition[]> => {
  const response = await apiClient.get<Competition[]>('/competitions', {
    params: { status },
  });
  return response.data;
};

export const getCompetitionById = async (competitionId: string): Promise<Competition> => {
  const response = await apiClient.get<Competition>(`/competitions/${competitionId}`);
  return response.data;
};

export const enterCompetition = async (competitionId: string, setId: string): Promise<CompetitionEntry> => {
  const response = await apiClient.post<CompetitionEntry>(`/competitions/${competitionId}/enter`, { setId });
  return response.data;
};

export const voteInCompetition = async (competitionId: string, entryId: string): Promise<void> => {
  await apiClient.post(`/competitions/${competitionId}/vote`, { entryId });
};

export const getLiveStreams = async (): Promise<import('../types').LiveStream[]> => {
  const response = await apiClient.get<import('../types').LiveStream[]>('/streams/live');
  return response.data;
};

export const getStreamById = async (streamId: string): Promise<import('../types').LiveStream> => {
  const response = await apiClient.get<import('../types').LiveStream>(`/streams/${streamId}`);
  return response.data;
};

export const startStream = async (title: string, description?: string): Promise<import('../types').LiveStream> => {
  const response = await apiClient.post<import('../types').LiveStream>('/streams/start', { title, description });
  return response.data;
};

export const endStream = async (streamId: string): Promise<void> => {
  await apiClient.post(`/streams/${streamId}/end`);
};

export const getForumCategories = async (): Promise<ForumCategory[]> => {
  const response = await apiClient.get<unknown>('/forum/categories');
  return unwrapList(response.data, 'categories')
    .map(normalizeForumCategory)
    .filter((category): category is ForumCategory => Boolean(category));
};

export const getForumThreads = async (categoryId?: string, page = 1): Promise<ForumThread[]> => {
  const response = await apiClient.get<unknown>('/forum/threads', {
    params: { category: categoryId, page },
  });
  return unwrapList(response.data, 'threads')
    .map(normalizeForumThread)
    .filter((thread): thread is ForumThread => Boolean(thread));
};

export const getThreadById = async (threadId: string): Promise<ForumThread> => {
  const response = await apiClient.get<unknown>(`/forum/threads/${threadId}`);
  const data = isRecord(response.data) && isRecord(response.data.thread) ? response.data.thread : response.data;
  const thread = normalizeForumThread(data);
  if (!thread) throw new Error('Invalid thread response');
  return thread;
};

export const createThread = async (data: Partial<import('../types').ForumThread>): Promise<import('../types').ForumThread> => {
  const response = await apiClient.post<import('../types').ForumThread>('/forum/threads', data);
  return response.data;
};

export const replyToThread = async (threadId: string, body: string): Promise<ForumReply> => {
  const response = await apiClient.post<unknown>(`/forum/threads/${threadId}/replies`, { body });
  const data = isRecord(response.data) && isRecord(response.data.reply) ? response.data.reply : response.data;
  const reply = normalizeForumReply(data);
  if (!reply) throw new Error('Invalid reply response');
  return reply;
};

export const getBlogPosts = async (page = 1, limit = 12, category?: string): Promise<import('../types').BlogPost[]> => {
  const response = await apiClient.get<import('../types').BlogPost[]>('/blog/posts', {
    params: { page, limit, category },
  });
  return response.data;
};

export const getBlogPostById = async (postId: string): Promise<import('../types').BlogPost> => {
  const response = await apiClient.get<import('../types').BlogPost>(`/blog/posts/${postId}`);
  return response.data;
};

export interface VenueEvent {
  id: string; title: string; status: string; startTime: string;
  venueId: string; venueName: string; djName: string;
}

export const getVenueEvents = async (): Promise<VenueEvent[]> => {
  const response = await apiClient.get<{ events: VenueEvent[] }>('/venue/events');
  return response.data.events ?? [];
};

export const venueStreamAction = async (action: 'start' | 'stop', eventId: string) => {
  const response = await apiClient.post('/venue/stream', { action, eventId });
  return response.data;
};

export const getVenueStreamStatus = async (eventId: string) => {
  const response = await apiClient.get('/venue/stream', { params: { eventId } });
  return response.data.stream as { id: string; status: string; streamKey: string | null; viewerCount: number; startedAt: string | null; endedAt: string | null } | null;
};

export const getMyVenues = async (): Promise<Array<{ id: string; name: string; city: string | null; slug: string | null }>> => {
  const response = await apiClient.get<{ venues: any[] }>('/venue/my-venues');
  return response.data.venues ?? [];
};

export const getVenueAnalytics = async (period = '30d') => {
  const response = await apiClient.get('/venue/analytics', { params: { period } });
  return response.data;
};

export const getVenueDetail = async (id: string | number): Promise<Venue> => {
  const response = await apiClient.get<Venue>(`/venues/${id}`);
  return response.data;
};
