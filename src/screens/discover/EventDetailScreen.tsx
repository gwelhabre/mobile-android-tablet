import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  Share,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../../components/common/Avatar';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Snackbar from '../../components/common/Snackbar';
import { getEventById, rsvpEvent, cancelRsvp } from '../../api/events';
import { Event, TableReservation } from '../../types';
import { createTableReservation, getTableReservations, splitAndPayTableReservation } from '../../api/tableReservations';
import { postEventComment } from '../../api/comments';

interface EventDetailProps {
  eventId?: string;
  eventData?: Event;
  route?: { params: { eventId: string } };
}

const statusColors: Record<string, string> = {
  upcoming: '#3b82f6', live: '#ef4444', past: '#6b7280', cancelled: '#9ca3af',
};

const EventDetailScreen: React.FC<EventDetailProps> = ({ eventId, eventData, route }) => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const resolvedEventId = eventId ?? route?.params.eventId ?? eventData?.id ?? '';
  const [event, setEvent] = useState<Event | null>(eventData || null);
  const [loading, setLoading] = useState(!eventData);
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [isRsvpd, setIsRsvpd] = useState(eventData?.isRsvpd || false);
  const [reservation, setReservation] = useState<TableReservation | null>(null);
  const [partySize, setPartySize] = useState('2');
  const [tableFee, setTableFee] = useState('0');
  const [reservationLoading, setReservationLoading] = useState(false);
  const [splitLoading, setSplitLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [snackbar, setSnackbar] = useState('');
  const [snackType, setSnackType] = useState<'default' | 'success' | 'error'>('default');

  useEffect(() => {
    setEvent(eventData || null);
    setLoading(!eventData);
    Promise.all([
      getEventById(resolvedEventId),
      getTableReservations(resolvedEventId).catch(() => []),
    ])
      .then(([data, reservations]) => {
        setEvent(data);
        setIsRsvpd(data.isRsvpd || false);
        setReservation(reservations[0] ?? null);
      })
      .catch(() => {
        if (!eventData) setSnackbar('Failed to load event');
      })
      .finally(() => setLoading(false));
  }, [resolvedEventId, eventData]);

  const handleRsvp = async () => {
    if (!event) return;
    setRsvpLoading(true);
    try {
      if (isRsvpd) {
        await cancelRsvp(event.id);
        setIsRsvpd(false);
        setSnackbar('RSVP cancelled');
        setSnackType('default');
      } else {
        await rsvpEvent(event.id);
        setIsRsvpd(true);
        setSnackbar("You're going! RSVP confirmed");
        setSnackType('success');
      }
    } catch {
      setSnackbar('Action failed');
      setSnackType('error');
    } finally {
      setRsvpLoading(false);
    }
  };

  const handlePostComment = async () => {
    if (!event || !commentText.trim()) return;
    setCommentLoading(true);
    try {
      const comment = await postEventComment(event.id, commentText.trim());
      setCommentText('');
      setSnackbar(`${comment.displayName} posted to the event feed`);
      setSnackType('success');
    } catch {
      setSnackbar('Could not post to the feed');
      setSnackType('error');
    } finally {
      setCommentLoading(false);
    }
  };

  const handleCreateReservation = async () => {
    if (!event) return;
    const parsedPartySize = Number(partySize);
    const parsedTableFee = Number(tableFee);
    if (!Number.isInteger(parsedPartySize) || parsedPartySize < 2) {
      Alert.alert('Minimum table size', 'A table reservation needs at least 2 people.');
      return;
    }
    if (!Number.isFinite(parsedTableFee) || parsedTableFee < 0) {
      Alert.alert('Invalid table fee', 'Enter a valid table fee.');
      return;
    }
    setReservationLoading(true);
    try {
      const nextReservation = await createTableReservation({ eventId: event.id, partySize: parsedPartySize, tableFee: parsedTableFee });
      setReservation(nextReservation);
      setSnackbar('Reservation started');
      setSnackType('success');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error || 'Could not start the table reservation.');
    } finally {
      setReservationLoading(false);
    }
  };

  const handleShareLink = async (kind: 'free' | 'split') => {
    if (!reservation || !event) return;
    const link = kind === 'free' ? reservation.freeInviteLink : reservation.splitInviteLink;
    await Share.share({ message: `${event.title} table invite: ${link}`, url: link });
  };

  const handleSplitAndPay = async () => {
    if (!reservation) return;
    setSplitLoading(true);
    try {
      const nextReservation = await splitAndPayTableReservation(reservation.id);
      setReservation(nextReservation);
      setSnackbar(nextReservation.status === 'paid' ? 'Reservation paid' : 'Split started');
      setSnackType('success');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error || 'Could not split and pay this reservation.');
    } finally {
      setSplitLoading(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading event..." />;
  if (!event) return null;

  const startDate = new Date(event.startDate);
  const endDate = new Date(event.endDate);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Header Image Area */}
      <View style={styles.coverArea}>
        <View style={styles.coverBg} />
        <View style={styles.coverOverlay}>
          <Badge
            label={event.status.toUpperCase()}
            color={statusColors[event.status]}
            style={styles.statusBadge}
          />
          {event.status === 'live' && (
            <View style={styles.liveIndicator}>
              <View style={styles.livePulse} />
              <Text style={styles.liveText}>HAPPENING NOW</Text>
            </View>
          )}
        </View>
      </View>

      {/* Title */}
      <View style={styles.titleSection}>
        <Text style={styles.title}>{event.title}</Text>
        {event.genres && event.genres.length > 0 && (
          <View style={styles.genreRow}>
            {event.genres.map((g) => <Badge key={g} label={g} color="#a855f7" small />)}
          </View>
        )}
      </View>

      {user?.role === 'venue_manager' && (event.status === 'upcoming' || event.status === 'live') && (
        <TouchableOpacity
          style={styles.goLiveBtn}
          onPress={() => navigation.navigate('VenueBroadcast', { eventId: String(event.id) })}
          activeOpacity={0.85}
        >
          <View style={styles.goLiveDot} />
          <Text style={styles.goLiveBtnText}>Go Live</Text>
        </TouchableOpacity>
      )}

      {/* Info Grid */}
      <View style={styles.infoGrid}>
        <View style={styles.infoItem}>
          <MaterialCommunityIcons name="calendar" size={16} color="#a855f7" />
          <View>
            <Text style={styles.infoLabel}>Date</Text>
            <Text style={styles.infoValue}>
              {startDate.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}
            </Text>
          </View>
        </View>
        <View style={styles.infoItem}>
          <MaterialCommunityIcons name="clock-outline" size={16} color="#a855f7" />
          <View>
            <Text style={styles.infoLabel}>Time</Text>
            <Text style={styles.infoValue}>
              {startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} —{' '}
              {endDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        </View>
        <View style={styles.infoItem}>
          <MaterialCommunityIcons name="map-marker" size={16} color="#a855f7" />
          <View>
            <Text style={styles.infoLabel}>Venue</Text>
            <Text style={styles.infoValue}>{event.venueName}</Text>
            <Text style={styles.infoSub}>{event.venueCity}</Text>
          </View>
        </View>
        {event.ticketPrice !== undefined && (
          <View style={styles.infoItem}>
            <MaterialCommunityIcons name="ticket" size={16} color="#10b981" />
            <View>
              <Text style={styles.infoLabel}>Tickets</Text>
              <Text style={[styles.infoValue, { color: '#10b981' }]}>
                {event.ticketPrice === 0 ? 'Free' : `$${event.ticketPrice}`}
              </Text>
              {event.ticketCount !== undefined && (
                <Text style={styles.infoSub}>
                  {event.ticketsSold || 0} / {event.ticketCount} sold
                </Text>
              )}
            </View>
          </View>
        )}
      </View>

      {/* DJ Card */}
      {event.djName && (
        <Card style={styles.djCard} outlined>
          <Text style={styles.cardSectionTitle}>Performing DJ</Text>
          <View style={styles.djRow}>
            <Avatar uri={event.djAvatarUrl} name={event.djName} size={48} />
            <View style={styles.djInfo}>
              <Text style={styles.djName}>{event.djName}</Text>
              <Badge label="DJ" color="#a855f7" small />
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#4b5563" />
          </View>
        </Card>
      )}

      {/* Attendees */}
      {event.attendeesCount !== undefined && (
        <View style={styles.attendeesRow}>
          <MaterialCommunityIcons name="account-multiple" size={16} color="#6b7280" />
          <Text style={styles.attendeesText}>
            {event.attendeesCount} {event.attendeesCount === 1 ? 'person' : 'people'} attending
          </Text>
        </View>
      )}

      {/* Description */}
      {event.description && (
        <View style={styles.descSection}>
          <Text style={styles.descTitle}>About this event</Text>
          <Text style={styles.descText}>{event.description}</Text>
        </View>
      )}

      <Card style={styles.sayCard} outlined>
        <Text style={styles.cardSectionTitle}>Say Something</Text>
        <TextInput
          value={commentText}
          onChangeText={setCommentText}
          style={styles.sayInput}
          placeholder="Say something from this event..."
          placeholderTextColor="#4b5563"
          multiline
          maxLength={280}
        />
        <Button
          label="Post to Feed"
          onPress={handlePostComment}
          loading={commentLoading}
          disabled={!commentText.trim()}
          fullWidth
        />
      </Card>

      {/* Actions */}
      <View style={styles.actions}>
        {event.status !== 'past' && event.status !== 'cancelled' && (
          <Button
            label={isRsvpd ? "Cancel RSVP" : "RSVP"}
            onPress={handleRsvp}
            loading={rsvpLoading}
            variant={isRsvpd ? 'outlined' : 'filled'}
            icon={isRsvpd ? 'calendar-remove' : 'calendar-check'}
            size="lg"
            style={styles.actionBtn}
          />
        )}
        {event.status === 'live' && event.liveStream?.id ? (
          <Button
            label="Join Stream"
            onPress={() => (navigation as any).navigate('LiveTab', { screen: 'LiveStream', params: { streamId: event.liveStream.id, djId: event.djId, djName: event.djName } })}
            variant="filled"
            icon="broadcast"
            size="lg"
            color="#ef4444"
            style={styles.actionBtn}
          />
        ) : null}
      </View>

      {(event.status === 'upcoming' || event.status === 'live') && (
        <Card style={styles.reservationCard} outlined>
          <Text style={styles.cardSectionTitle}>Table Reservation</Text>
          {reservation ? (
            <>
              <View style={styles.reservationHeader}>
                <Text style={styles.reservationTitle}>Table for {reservation.partySize}</Text>
                <Badge label={reservation.status.replace(/_/g, ' ')} color={reservation.status === 'paid' ? '#10b981' : '#a855f7'} small />
              </View>
              <Text style={styles.reservationMeta}>
                ${reservation.tableFee.toFixed(2)} total - confirm by {new Date(reservation.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
              <View style={styles.reservationLinks}>
                <Button label="Free Invite" onPress={() => handleShareLink('free')} variant="outlined" size="sm" style={styles.reservationLinkBtn} />
                <Button label="Split Invite" onPress={() => handleShareLink('split')} variant="outlined" size="sm" style={styles.reservationLinkBtn} />
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryText}>{reservation.summary?.confirmedCount ?? 1} confirmed</Text>
                <Text style={styles.summaryText}>{reservation.summary?.unpaidInviteCount ?? 0} unpaid</Text>
                <Text style={styles.summaryText}>{reservation.summary?.declinedCount ?? 0} declined</Text>
              </View>
              {reservation.invites.map((invite) => (
                <View key={invite.id} style={styles.inviteRow}>
                  <Text style={styles.inviteName}>{invite.displayName || invite.email || 'Invitee'}</Text>
                  <Text style={styles.inviteStatus}>
                    {invite.attendanceStatus}{invite.paymentExpected || invite.proposedToPay ? ` - ${invite.paymentStatus}` : ' - no split'}
                  </Text>
                </View>
              ))}
              <Button label="Split and Pay" onPress={handleSplitAndPay} loading={splitLoading} disabled={reservation.status === 'paid'} fullWidth />
            </>
          ) : (
            <>
              <Text style={styles.reservationMeta}>Create a table, then share free and split-payment invite links. Invites expire after 6 hours.</Text>
              <View style={styles.inputRow}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>People</Text>
                  <TextInput value={partySize} onChangeText={setPartySize} keyboardType="number-pad" style={styles.input} placeholder="2" placeholderTextColor="#4b5563" />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Table fee</Text>
                  <TextInput value={tableFee} onChangeText={setTableFee} keyboardType="decimal-pad" style={styles.input} placeholder="0" placeholderTextColor="#4b5563" />
                </View>
              </View>
              <Button label="Book Table" onPress={handleCreateReservation} loading={reservationLoading} fullWidth />
            </>
          )}
        </Card>
      )}

      <Snackbar message={snackbar} visible={!!snackbar} onDismiss={() => setSnackbar('')} type={snackType} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 80 },
  coverArea: { height: 160, position: 'relative', marginBottom: 16 },
  coverBg: { ...StyleSheet.absoluteFillObject, backgroundColor: '#1a0f2e' },
  coverOverlay: {
    ...StyleSheet.absoluteFillObject,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  statusBadge: {},
  liveIndicator: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  livePulse: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ef4444' },
  liveText: { color: '#ef4444', fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  titleSection: { paddingHorizontal: 16, marginBottom: 16, gap: 8 },
  goLiveBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#2d0a0a', borderWidth: 1, borderColor: '#ef4444',
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, marginHorizontal: 16, marginBottom: 12,
  },
  goLiveDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#ef4444' },
  goLiveBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  title: { color: '#f3f4f6', fontSize: 22, fontWeight: '800', lineHeight: 28 },
  genreRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  infoGrid: {
    marginHorizontal: 16, backgroundColor: '#12121a', borderRadius: 14,
    borderWidth: 1, borderColor: '#1e1e2e', padding: 16,
    flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 16,
  },
  infoItem: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', minWidth: '45%', flex: 1 },
  infoLabel: { color: '#4b5563', fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8 },
  infoValue: { color: '#f3f4f6', fontSize: 13, fontWeight: '600', marginTop: 1 },
  infoSub: { color: '#6b7280', fontSize: 11 },
  djCard: { marginHorizontal: 16, marginBottom: 12, gap: 10 },
  cardSectionTitle: { color: '#6b7280', fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  djRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  djInfo: { flex: 1, gap: 3 },
  djName: { color: '#f3f4f6', fontSize: 15, fontWeight: '600' },
  attendeesRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, marginBottom: 12 },
  attendeesText: { color: '#6b7280', fontSize: 13 },
  descSection: { paddingHorizontal: 16, marginBottom: 16 },
  descTitle: { color: '#9ca3af', fontSize: 12, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 },
  descText: { color: '#9ca3af', fontSize: 14, lineHeight: 22 },
  sayCard: { marginHorizontal: 16, marginBottom: 16, gap: 10 },
  sayInput: {
    minHeight: 78,
    color: '#f3f4f6',
    backgroundColor: '#0a0a0f',
    borderWidth: 1,
    borderColor: '#27273a',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    textAlignVertical: 'top',
  },
  actions: { paddingHorizontal: 16, flexDirection: 'row', gap: 12, marginTop: 8 },
  actionBtn: { flex: 1 },
  reservationCard: { marginHorizontal: 16, marginTop: 8, marginBottom: 16, gap: 12 },
  reservationHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  reservationTitle: { color: '#f3f4f6', fontSize: 16, fontWeight: '800', flex: 1 },
  reservationMeta: { color: '#9ca3af', fontSize: 13, lineHeight: 19 },
  reservationLinks: { flexDirection: 'row', gap: 10 },
  reservationLinkBtn: { flex: 1 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#0a0a0f', borderRadius: 10, padding: 10 },
  summaryText: { color: '#d1d5db', fontSize: 12, fontWeight: '700' },
  inviteRow: { borderTopWidth: 1, borderTopColor: '#1e1e2e', paddingTop: 8 },
  inviteName: { color: '#f3f4f6', fontSize: 13, fontWeight: '700' },
  inviteStatus: { color: '#9ca3af', fontSize: 12, marginTop: 2 },
  inputRow: { flexDirection: 'row', gap: 12 },
  inputGroup: { flex: 1, gap: 6 },
  inputLabel: { color: '#9ca3af', fontSize: 12, fontWeight: '700' },
  input: { color: '#f3f4f6', backgroundColor: '#0a0a0f', borderWidth: 1, borderColor: '#27273a', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
});

export default EventDetailScreen;
