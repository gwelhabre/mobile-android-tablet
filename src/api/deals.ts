import { Deal } from '../types';

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const asString = (value: unknown): string | undefined => {
  if (typeof value === 'string' && value.trim().length > 0) return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return undefined;
};

const asNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
};

const getFirstString = (...values: unknown[]): string | undefined => {
  for (const value of values) {
    const stringValue = asString(value);
    if (stringValue) return stringValue;
  }
  return undefined;
};

const getFirstNumber = (...values: unknown[]): number | undefined => {
  for (const value of values) {
    const numberValue = asNumber(value);
    if (numberValue !== undefined) return numberValue;
  }
  return undefined;
};

const getFirstId = (...values: unknown[]): string | undefined => {
  for (const value of values) {
    const stringValue = asString(value);
    if (stringValue) return stringValue;
  }
  return undefined;
};

const normalizeDealStatus = (status: unknown): Deal['status'] => {
  switch (getFirstString(status)) {
    case 'accepted':
    case 'agreed':
    case 'paid_deposit':
      return 'accepted';
    case 'completed':
      return 'completed';
    case 'rejected':
      return 'rejected';
    case 'cancelled':
    case 'canceled':
      return 'cancelled';
    case 'pending':
    case 'proposed':
    case 'negotiating':
    case 'disputed':
    default:
      return 'pending';
  }
};

const normalizePaymentStatus = (status: unknown): Deal['paymentStatus'] => {
  switch (getFirstString(status)) {
    case 'paid':
      return 'paid';
    case 'partial':
      return 'partial';
    default:
      return 'unpaid';
  }
};

export const normalizeDeal = (value: unknown): Deal | undefined => {
  if (!isRecord(value)) return undefined;

  const dj = isRecord(value.dj) ? value.dj : undefined;
  const venue = isRecord(value.venue) ? value.venue : undefined;
  const id = getFirstId(value.id);
  if (id === undefined) return undefined;

  const createdAt = getFirstString(value.createdAt) ?? new Date().toISOString();
  const updatedAt = getFirstString(value.updatedAt, createdAt) ?? createdAt;
  const eventDate = getFirstString(value.eventDate, value.proposedDate, createdAt) ?? createdAt;

  return {
    id,
    djId: getFirstId(value.djId, dj?.id) ?? '',
    djName: getFirstString(dj?.stageName, value.djName) ?? 'DJ',
    djAvatarUrl: getFirstString(dj?.avatar, dj?.profileImage, dj?.avatarUrl),
    venueId: getFirstId(value.venueId, venue?.id) ?? '',
    venueName: getFirstString(venue?.name, value.venueName) ?? 'Venue',
    venueCity: getFirstString(venue?.city, value.venueCity) ?? '',
    eventDate,
    amount: getFirstNumber(
      value.amount,
      value.agreedAmount,
      value.proposedAmount,
      value.agreedFee,
      value.proposedFee,
    ) ?? 0,
    currency: getFirstString(value.currency) ?? 'USD',
    status: normalizeDealStatus(value.status),
    notes: getFirstString(value.notes),
    createdAt,
    updatedAt,
    paymentStatus: normalizePaymentStatus(value.paymentStatus),
  };
};
