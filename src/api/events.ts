import apiClient from './client';
import { Event, Venue } from '../types';

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

const maxNumber = (...values: Array<number | undefined>) => {
  const numbers = values.filter((value): value is number => value !== undefined);
  return numbers.length > 0 ? Math.max(...numbers) : undefined;
};

const parseStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.map(asString).filter((item): item is string => Boolean(item));
  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.map(asString).filter((item): item is string => Boolean(item)) : [value];
    } catch {
      return [value];
    }
  }
  return [];
};

const normalizeStatus = (status?: string): Event['status'] => {
  if (status === 'live' || status === 'past' || status === 'cancelled') return status;
  if (status === 'ended') return 'past';
  if (status === 'canceled') return 'cancelled';
  return 'upcoming';
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

const normalizeVenue = (value: unknown): Venue | undefined => {
  if (!isRecord(value)) return undefined;
  const upcomingEvents = unwrapList(value.upcomingEvents ?? value.events, 'events')
    .map(normalizeEvent)
    .filter((event): event is Event => Boolean(event));

  return {
    id: firstString(value.id) ?? '',
    managerId: firstString(value.managerId) ?? '',
    name: firstString(value.name) ?? 'Venue',
    description: firstString(value.description),
    city: firstString(value.city) ?? '',
    country: firstString(value.country) ?? '',
    address: firstString(value.address),
    capacity: firstNumber(value.capacity),
    coverImageUrl: firstString(value.coverImageUrl, value.coverImage, value.coverUrl, value.imageUrl, value.avatar),
    logoUrl: firstString(value.logoUrl, value.avatar),
    genres: Array.isArray(value.genres) ? value.genres.map(asString).filter(Boolean) as string[] : undefined,
    upcomingEventsCount: firstNumber(value.upcomingEventsCount, value.eventsCount),
    totalEventsHosted: firstNumber(value.totalEventsHosted, value.eventsCount),
    rating: firstNumber(value.rating),
    followersCount: firstNumber(value.followersCount, value.followers),
    isFollowing: Boolean(value.isFollowing ?? value.following),
    contactEmail: firstString(value.contactEmail),
    contactPhone: firstString(value.contactPhone),
    upcomingEvents,
    events: upcomingEvents,
  };
};

const normalizeVenueFromEvent = (value: unknown): Venue | undefined => {
  if (!isRecord(value)) return undefined;

  const venue = isRecord(value.venue) ? value.venue : undefined;
  const id = firstString(venue?.id, value.venueId);
  const name = firstString(venue?.name, value.venueName);
  if (!id || !name) return undefined;
  const status = firstString(value.status)?.toLowerCase();
  const isUpcoming = !status || !['past', 'ended', 'cancelled', 'canceled'].includes(status);
  const activity = maxNumber(
    firstNumber(value.totalCheckIns),
    firstNumber(value.checkInCount, value.checkIns),
    firstNumber(value.rsvpCount),
    firstNumber(value.attendeesCount),
    firstNumber(value.ticketsSold)
  ) ?? 0;
  const capacity = firstNumber(venue?.capacity, value.capacity, value.maxCapacity, value.ticketCount) ?? (activity > 0 ? activity : undefined);

  return {
    id,
    managerId: firstString(venue?.managerId) ?? '',
    name,
    description: firstString(venue?.description),
    city: firstString(venue?.city, value.venueCity, value.city) ?? '',
    country: firstString(venue?.country, value.country) ?? '',
    address: firstString(venue?.address, value.address),
    capacity,
    coverImageUrl: firstString(venue?.coverImageUrl, venue?.coverImage, venue?.coverUrl, venue?.imageUrl, venue?.avatar),
    logoUrl: firstString(venue?.logoUrl, venue?.avatar),
    genres: parseStringArray(value.genres),
    upcomingEventsCount: isUpcoming ? 1 : 0,
    totalEventsHosted: 1,
    rating: firstNumber(venue?.rating),
    followersCount: firstNumber(venue?.followersCount, venue?.followers),
    isFollowing: Boolean(venue?.isFollowing ?? venue?.following),
    contactEmail: firstString(venue?.contactEmail),
    contactPhone: firstString(venue?.contactPhone),
  };
};

const mergeGenres = (first?: string[], second?: string[]) =>
  Array.from(new Set([...(first ?? []), ...(second ?? [])]));

const mergeVenue = (existing: Venue, venue: Venue): Venue => ({
  ...existing,
  managerId: existing.managerId || venue.managerId,
  name: existing.name || venue.name,
  description: existing.description || venue.description,
  city: existing.city || venue.city,
  country: existing.country || venue.country,
  address: existing.address || venue.address,
  capacity: maxNumber(existing.capacity, venue.capacity),
  coverImageUrl: existing.coverImageUrl || venue.coverImageUrl,
  logoUrl: existing.logoUrl || venue.logoUrl,
  genres: mergeGenres(existing.genres, venue.genres),
  upcomingEventsCount: (existing.upcomingEventsCount ?? 0) + (venue.upcomingEventsCount ?? 0),
  totalEventsHosted: (existing.totalEventsHosted ?? 0) + (venue.totalEventsHosted ?? 0),
  rating: maxNumber(existing.rating, venue.rating),
  followersCount: maxNumber(existing.followersCount, venue.followersCount),
  isFollowing: Boolean(existing.isFollowing || venue.isFollowing),
  contactEmail: existing.contactEmail || venue.contactEmail,
  contactPhone: existing.contactPhone || venue.contactPhone,
});

const uniqueVenues = (venues: Venue[]) => {
  const byId = new Map<string, Venue>();
  for (const venue of venues) {
    const existing = byId.get(venue.id);
    byId.set(venue.id, existing ? mergeVenue(existing, venue) : venue);
  }
  return Array.from(byId.values());
};

const filterVenues = (venues: Venue[], query?: string) => {
  const q = query?.trim().toLowerCase();
  if (!q) return venues;
  return venues.filter((venue) =>
    [venue.name, venue.city, venue.country, venue.address]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(q))
  );
};

const getVenuesFromEvents = async (query?: string, limit = 50): Promise<Venue[]> => {
  const response = await apiClient.get<unknown>('/events', { params: { limit } });
  const venues = unwrapList(response.data, 'events')
    .map(normalizeVenueFromEvent)
    .filter((venue): venue is Venue => Boolean(venue));
  return filterVenues(uniqueVenues(venues), query);
};

const normalizeEvent = (value: unknown): Event | undefined => {
  const source = isRecord(value) && isRecord(value.event) ? value.event : value;
  if (!isRecord(source)) return undefined;

  const id = firstString(source.id);
  if (!id) return undefined;

  const venue = isRecord(source.venue) ? source.venue : undefined;
  const dj = isRecord(source.dj) ? source.dj : undefined;
  const start = firstString(source.startDate, source.date, source.startTime, source.createdAt) ?? new Date().toISOString();
  const end = firstString(source.endDate, source.endTime) ?? start;

  return {
    id,
    title: firstString(source.title) ?? 'Untitled event',
    description: firstString(source.description) ?? '',
    venueId: firstString(source.venueId, venue?.id) ?? '',
    venueName: firstString(source.venueName, venue?.name) ?? 'Venue',
    venueCity: firstString(source.venueCity, source.city, venue?.city) ?? '',
    djId: firstString(source.djId, dj?.id),
    djName: firstString(source.djName, dj?.stageName, dj?.displayName),
    djAvatarUrl: firstString(source.djAvatarUrl, dj?.profileImage, dj?.avatar),
    startDate: start,
    endDate: end,
    ticketPrice: firstNumber(source.ticketPrice, source.price),
    ticketCount: firstNumber(source.ticketCount, source.capacity, source.maxCapacity, source.totalCheckIns),
    ticketsSold: firstNumber(source.ticketsSold, source.rsvpCount, source.attendeesCount, source.totalCheckIns),
    status: normalizeStatus(firstString(source.status)),
    coverImageUrl: firstString(source.coverImageUrl, source.coverUrl, source.imageUrl, source.coverImage),
    genres: parseStringArray(source.genres),
    isRsvpd: Boolean(source.isRsvpd ?? source.isRsvped ?? source.hasUserRsvped),
    attendeesCount: firstNumber(source.attendeesCount, source.rsvpCount, source.ticketsSold, source.totalCheckIns),
  };
};

export const getEvents = async (page = 1, limit = 20, status?: string, genre?: string): Promise<Event[]> => {
  const response = await apiClient.get<unknown>('/events', {
    params: { page, limit, status, genre },
  });
  return unwrapList(response.data, 'events')
    .map(normalizeEvent)
    .filter((event): event is Event => Boolean(event));
};

export const getEventById = async (eventId: string): Promise<Event> => {
  const response = await apiClient.get<unknown>(`/events/${eventId}`);
  const event = normalizeEvent(response.data);
  if (!event) throw new Error('Invalid event response');
  return event;
};

export const rsvpEvent = async (eventId: string): Promise<void> => {
  await apiClient.post(`/events/${eventId}/rsvp`);
};

export const cancelRsvp = async (eventId: string): Promise<void> => {
  await apiClient.delete(`/events/${eventId}/rsvp`);
};

export const searchEvents = async (query: string): Promise<Event[]> => {
  const response = await apiClient.get<unknown>('/events/search', { params: { q: query } });
  return unwrapList(response.data, 'events')
    .map(normalizeEvent)
    .filter((event): event is Event => Boolean(event));
};

export const getVenues = async (page = 1, limit = 20, city?: string): Promise<Venue[]> => {
  try {
    const response = await apiClient.get<unknown>('/venues', {
      params: { page, limit, city },
    });
    return unwrapList(response.data, 'venues')
      .map(normalizeVenue)
      .filter((venue): venue is Venue => Boolean(venue));
  } catch (error: any) {
    if (error?.response?.status !== 404) throw error;
    return getVenuesFromEvents(city, limit);
  }
};

export const getVenueById = async (venueId: string): Promise<Venue> => {
  const response = await apiClient.get<unknown>(`/venues/${venueId}`);
  return normalizeVenue(response.data) ?? {
    id: venueId,
    name: 'Venue',
    city: '',
    country: '',
  };
};

export const searchVenues = async (query: string): Promise<Venue[]> => {
  try {
    const response = await apiClient.get<unknown>('/venues/search', { params: { q: query } });
    return unwrapList(response.data, 'venues')
      .map(normalizeVenue)
      .filter((venue): venue is Venue => Boolean(venue));
  } catch (error: any) {
    if (error?.response?.status !== 404) throw error;
    return getVenuesFromEvents(query);
  }
};

export const getVenueDashboard = async (): Promise<Record<string, unknown>> => {
  const response = await apiClient.get('/venues/me/dashboard');
  return response.data;
};

export const getVenueDeals = async (): Promise<import('../types').BookingDeal[]> => {
  const response = await apiClient.get<import('../types').BookingDeal[]>('/venues/me/deals');
  return response.data;
};

export const createDeal = async (data: Partial<import('../types').BookingDeal>): Promise<import('../types').BookingDeal> => {
  const response = await apiClient.post<import('../types').BookingDeal>('/deals', data);
  return response.data;
};

export const getUpcomingEvents = async (limit = 10): Promise<Event[]> => {
  const response = await apiClient.get<unknown>('/events', {
    params: { status: 'upcoming', limit },
  });
  return unwrapList(response.data, 'events')
    .map(normalizeEvent)
    .filter((event): event is Event => Boolean(event));
};

export const getLiveEvents = async (): Promise<Event[]> => {
  const response = await apiClient.get<unknown>('/events', {
    params: { status: 'live' },
  });
  return unwrapList(response.data, 'events')
    .map(normalizeEvent)
    .filter((event): event is Event => Boolean(event));
};

export const createEvent = async (payload: {
  title: string; venueId: string; djId: string; startTime: string;
  endTime?: string; description?: string; entryInfo?: string; genres?: string[];
}) => {
  const response = await apiClient.post('/events', payload);
  return response.data;
};
