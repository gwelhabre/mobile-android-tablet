export type UserRole = 'fan' | 'dj' | 'venue_manager' | 'event_planner' | 'admin';

export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  role: UserRole;
  avatarUrl?: string;
  bio?: string;
  city?: string;
  country?: string;
  createdAt: string;
  isVerified: boolean;
  followersCount: number;
  followingCount: number;
}

export interface DJProfile {
  id: string;
  userId: string;
  user: User;
  stageName: string;
  genres: string[];
  bio: string;
  city: string;
  country: string;
  avatarUrl?: string;
  bannerUrl?: string;
  rankingScore: number;
  rankingPosition: number;
  followersCount: number;
  isFollowing?: boolean;
  giftShowcase?: GiftShowcase;
  totalGiftsReceived: number;
  totalEarnings: number;
  isAvailableForBooking: boolean;
  bookingRate?: number;
  socialLinks?: {
    instagram?: string;
    twitter?: string;
    soundcloud?: string;
    spotify?: string;
  };
  sets?: DigitalSet[];
  upcomingEvents?: Event[];
}

export interface Event {
  id: string;
  title: string;
  description: string;
  venueId: string;
  venueName: string;
  venueCity: string;
  djId?: string;
  djName?: string;
  djAvatarUrl?: string;
  startDate: string;
  endDate: string;
  ticketPrice?: number;
  ticketCount?: number;
  ticketsSold?: number;
  status: 'upcoming' | 'live' | 'past' | 'cancelled';
  coverImageUrl?: string;
  genres?: string[];
  isRsvpd?: boolean;
  attendeesCount?: number;
}

export interface TableReservationInvite {
  id: string;
  userId?: string;
  displayName?: string;
  email?: string;
  inviteKind: 'free' | 'split';
  attendanceStatus: 'pending' | 'confirmed' | 'declined';
  paymentExpected: boolean;
  proposedToPay: boolean;
  paymentStatus: 'not_required' | 'accepted' | 'proposed' | 'paid' | 'unfunded' | 'declined';
  shareAmount?: number;
  respondedAt?: string;
  paidAt?: string;
}

export interface TableReservation {
  id: string;
  eventId: string;
  venueId: string;
  partySize: number;
  tableFee: number;
  currency: string;
  status: 'pending_confirmations' | 'split_pending' | 'paid' | 'cancelled' | 'expired';
  freeInviteLink: string;
  splitInviteLink: string;
  expiresAt: string;
  splitAt?: string;
  paidAt?: string;
  event?: Event;
  venue?: Venue;
  invites: TableReservationInvite[];
  summary?: {
    confirmedCount: number;
    declinedCount: number;
    payingCount: number;
    paidInviteCount: number;
    unpaidInviteCount: number;
    expectedResponses: number;
  };
}

export interface LiveStream {
  id: string;
  djId: string;
  djName: string;
  djAvatarUrl?: string;
  title: string;
  description?: string;
  venueName?: string;
  viewerCount: number;
  startedAt: string;
  streamUrl?: string;
  thumbnailUrl?: string;
  isActive: boolean;
  totalGiftsValue: number;
  chatEnabled: boolean;
  genres?: string[];
}

export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  pendingBalance: number;
  totalEarned: number;
  totalSpent: number;
  currency: string;
  transactions: WalletTransaction[];
}

export interface WalletTransaction {
  id: string;
  walletId: string;
  type: 'credit' | 'debit' | 'pending' | 'refund';
  amount: number;
  currency: string;
  description: string;
  reference?: string;
  status: 'completed' | 'pending' | 'failed';
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface MarketplaceProduct {
  id: string;
  sellerId: string;
  sellerName: string;
  sellerAvatarUrl?: string;
  title: string;
  description: string;
  category: 'digital_set' | 'sample_pack' | 'tutorial' | 'merchandise' | 'equipment' | 'ticket';
  price: number;
  currency: string;
  imageUrl?: string;
  downloadUrl?: string;
  totalSales: number;
  rating?: number;
  reviewCount?: number;
  isActive: boolean;
  createdAt: string;
  tags?: string[];
}

export interface MarketplaceOrder {
  id: string;
  buyerId: string;
  productId: string;
  product: MarketplaceProduct;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'refunded' | 'disputed';
  createdAt: string;
  downloadUrl?: string;
}

export interface Notification {
  id: string;
  userId?: string;
  type: 'gift' | 'follow' | 'booking' | 'deal' | 'competition' | 'system' | 'live' | 'ranking' | 'wallet' | 'like' | 'event' | 'comment';
  title: string;
  message: string;
  /** Use either `read` or `isRead`. Backend may send either. */
  read?: boolean;
  isRead?: boolean;
  createdAt: string;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface RankingEntry {
  rank: number;
  djId: string;
  stageName: string;
  avatar?: string;
  city: string;
  country: string;
  genre: string;
  score: number;
  followersCount: number;
  previousRank?: number | null;
  change: number;
  weeklyEarnings?: number;
}

export interface Competition {
  id: string;
  title: string;
  description: string;
  format: 'online' | 'live' | 'hybrid';
  genre?: string;
  prizePool: number;
  currency: string;
  startDate: string;
  endDate: string;
  status: 'upcoming' | 'open' | 'voting' | 'ended';
  entryCount: number;
  maxEntries?: number;
  coverImageUrl?: string;
  prizes?: { position: number; amount: number; description: string }[];
  entries?: CompetitionEntry[];
}

export interface CompetitionEntry {
  id: string;
  competitionId: string;
  djId: string;
  djName: string;
  djAvatarUrl?: string;
  setTitle: string;
  votes: number;
  position?: number;
  submittedAt: string;
}

export interface ForumThread {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatarUrl?: string;
  categoryId: string;
  categoryName: string;
  title: string;
  body: string;
  replyCount: number;
  viewCount: number;
  likeCount: number;
  isPinned: boolean;
  isLocked: boolean;
  lastActivityAt: string;
  createdAt: string;
  replies?: ForumReply[];
}

export interface ForumReply {
  id: string;
  threadId: string;
  authorId: string;
  authorName: string;
  authorAvatarUrl?: string;
  body: string;
  likeCount: number;
  createdAt: string;
}

export interface BlogPost {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatarUrl?: string;
  title: string;
  excerpt: string;
  body: string;
  category: string;
  tags: string[];
  coverImageUrl?: string;
  likeCount: number;
  commentCount: number;
  viewCount: number;
  publishedAt: string;
  readTimeMinutes: number;
}

export interface GiftCatalogItem {
  id: string;
  name: string;
  description?: string;
  emoji?: string;
  iconUrl?: string;
  animationUrl?: string;
  coinCost?: number;
  price?: number;
  category: 'basic' | 'premium' | 'legendary';
  isAvailable?: boolean;
}

export interface GiftShowcase {
  totalCount: number;
  grossAmount: number;
  djAmount: number;
  platformAmount: number;
  recentGifts: Array<{
    id: string;
    giftId: string;
    giftName: string;
    giftEmoji?: string | null;
    amount: number;
    djAmount: number;
    platformAmount: number;
    message?: string | null;
    isAnonymous: boolean;
    sender?: {
      id: string;
      name: string;
      avatarUrl?: string | null;
    } | null;
    createdAt: string;
  }>;
  notableSenders: Array<{
    userId: string;
    name: string;
    avatarUrl?: string | null;
    totalAmount: number;
    giftCount: number;
  }>;
  topGifts: Array<{
    giftId: string;
    name: string;
    emoji?: string | null;
    totalAmount: number;
    count: number;
  }>;
}

export interface PayoutRequest {
  id: string;
  userId?: string;
  amount: number;
  currency?: string;
  method: string;
  accountDetails?: string;
  notes?: string;
  status: 'pending' | 'approved' | 'processing' | 'completed' | 'rejected' | 'paid';
  requestedAt?: string;
  createdAt?: string;
  processedAt?: string;
  rejectionReason?: string;
}

export interface RidesPackage {
  id: string;
  ridesAmount: number;
  priceUsd: number;
  platform: string;
  isActive: boolean;
}

export interface WhishStatus {
  whishPhone: string | null;
  whishPhoneVerifiedAt: string | null;
  whishDisplayName: string | null;
}

export interface WhishVerificationStart {
  verificationId: string;
  displayName?: string | null;
  expiresAt: string;
}

export interface DigitalSet {
  id: string;
  djId: string;
  title: string;
  genre: string;
  duration?: number;
  bpm?: number;
  price: number;
  currency: string;
  coverImageUrl?: string;
  previewUrl?: string;
  downloadUrl?: string;
  totalSales: number;
  totalEarnings: number;
  isActive: boolean;
  uploadedAt: string;
  tracklist?: string[];
}

export interface Deal {
  id: string;
  djId: string;
  djName: string;
  djAvatarUrl?: string;
  venueId: string;
  venueName: string;
  venueCity: string;
  eventDate: string;
  amount: number;
  currency: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: string;
  updatedAt: string;
  paymentStatus: 'unpaid' | 'partial' | 'paid';
}

export interface BookingDeal {
  id: string;
  djId: string;
  djName: string;
  venueId: string;
  venueName: string;
  eventDate: string;
  eventTitle?: string;
  proposedAmount: number;
  agreedAmount?: number;
  currency: string;
  status: 'proposed' | 'negotiating' | 'accepted' | 'rejected' | 'completed' | 'cancelled';
  terms?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  streamId: string;
  userId: string;
  username: string;
  avatarUrl?: string;
  message: string;
  type: 'text' | 'gift' | 'system';
  giftItem?: GiftCatalogItem;
  sentAt: string;
}

export interface ForumCategory {
  id: string;
  name: string;
  description?: string;
  iconName: string;
  threadCount: number;
  color?: string;
}

export interface Venue {
  id: string;
  managerId?: string;
  name: string;
  description?: string;
  city: string;
  country?: string;
  address?: string;
  capacity?: number;
  type?: string;
  venueType?: string;
  coverImageUrl?: string;
  logoUrl?: string;
  genres?: string[];
  upcomingEventsCount?: number;
  totalEventsHosted?: number;
  rating?: number;
  followersCount?: number;
  isFollowing?: boolean;
  contactEmail?: string;
  contactPhone?: string;
  upcomingEvents?: Event[];
  events?: Event[];
}

export interface EventPlanningComponents {
  djSet: string[];
  lighting: string[];
  band: string[];
  [key: string]: string[];
}

export interface EventPlanningPack {
  id: number | string;
  title: string;
  subtitle?: string;
  description?: string;
  basePrice?: number | null;
  components: EventPlanningComponents;
  addons: string[];
  status: 'draft' | 'published' | 'archived';
  planner?: {
    id: number | string;
    displayName: string;
    companyName?: string;
    isVerified?: boolean;
    email?: string;
    contactName?: string;
  } | null;
}

export interface EventQuotation {
  id: number | string;
  requestId?: number | string;
  title: string;
  lineItems: Array<{ name: string; amount: number }>;
  notes?: string;
  total: number;
  currency: string;
  status: 'proposed' | 'selected' | 'paid_cash' | 'paid_wallet' | 'declined';
  createdAt: string;
}

export interface EventPlannerRevenueLog {
  id: number | string;
  requestId?: number | string;
  quotationId?: number | string;
  amount: number;
  currency: string;
  status: 'locked' | 'made';
  paymentMethod?: 'cash' | 'wallet';
  description?: string;
  createdAt: string;
  quotation?: {
    id: number | string;
    title: string;
    total: number;
  } | null;
}

export interface EventQuoteRequest {
  id: number | string;
  eventDate: string;
  startTime: string;
  endTime: string;
  location: string;
  selections: Record<string, string>;
  addons: string[];
  note?: string;
  quoteFee: number;
  quoteFeePaid: boolean;
  status: 'submitted' | 'quoted' | 'selected' | 'canceled';
  selectedQuotationId?: number | string;
  paymentMethod?: 'cash' | 'wallet';
  createdAt: string;
  pack?: EventPlanningPack | null;
  planner?: EventPlanningPack['planner'];
  requester?: {
    id: number | string;
    name?: string;
    email: string;
  } | null;
  quotations?: EventQuotation[];
}
