import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/common/Header';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Badge from '../../components/common/Badge';
import { EventPlanningPack, EventQuoteRequest, EventQuotation } from '../../types';
import {
  createEventQuoteRequest,
  getEventPlanningPacks,
  getEventQuoteRequests,
  rejectEventQuotation,
  selectEventQuotation,
} from '../../api/eventPlanning';

const GROUP_LABELS: Record<string, string> = {
  djSet: 'DJ Set',
  lighting: 'Lighting',
  band: 'Band',
};

const formatGroupLabel = (key: string) =>
  GROUP_LABELS[key] ?? key.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());

const today = () => new Date().toISOString().slice(0, 10);

const STATUS_COLORS: Record<string, string> = {
  submitted: '#6b7280',
  quoted: '#10b981',
  selected: '#3b82f6',
  canceled: '#ef4444',
  declined: '#ef4444',
};

const PlanYourEventScreen: React.FC = () => {
  const [packs, setPacks] = useState<EventPlanningPack[]>([]);
  const [quoteRequests, setQuoteRequests] = useState<EventQuoteRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPack, setSelectedPack] = useState<EventPlanningPack | null>(null);
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [eventDate, setEventDate] = useState(today());
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [location, setLocation] = useState('');
  const [note, setNote] = useState('');
  const [summaryVisible, setSummaryVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadPacks = async () => {
    try {
      const data = await getEventPlanningPacks();
      setPacks(data);
    } catch (_) {
      setPacks([]);
    }
  };

  const loadQuoteRequests = async () => {
    try {
      const data = await getEventQuoteRequests();
      setQuoteRequests(data);
    } catch (_) {
      setQuoteRequests([]);
    }
  };

  useEffect(() => {
    Promise.all([loadPacks(), loadQuoteRequests()]).finally(() => setLoading(false));
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadPacks(), loadQuoteRequests()]);
    setRefreshing(false);
  }, []);

  const selectPack = (pack: EventPlanningPack) => {
    const initialSelections: Record<string, string> = {};
    Object.entries(pack.components ?? {}).forEach(([group, options]) => {
      initialSelections[group] = options?.[0] ?? '';
    });
    setSelectedPack(pack);
    setSelections(initialSelections);
    setSelectedAddons([]);
    setSummaryVisible(false);
  };

  const groups = useMemo(
    () => Object.entries(selectedPack?.components ?? {}).filter(([, options]) => options.length > 0),
    [selectedPack],
  );

  const toggleAddon = (addon: string) => {
    setSelectedAddons((current) =>
      current.includes(addon) ? current.filter((item) => item !== addon) : [...current, addon],
    );
  };

  const showSummary = () => {
    if (!selectedPack) {
      Alert.alert('Select a pack', 'Choose one event pack to start your quote.');
      return;
    }
    if (!eventDate.trim() || !startTime.trim() || !endTime.trim() || !location.trim()) {
      Alert.alert('Missing event details', 'Add the available date, time range, and location.');
      return;
    }
    setSummaryVisible(true);
  };

  const confirmAndSend = async () => {
    if (!selectedPack) return;
    setSubmitting(true);
    try {
      const result = await createEventQuoteRequest({
        packId: selectedPack.id,
        eventDate,
        startTime,
        endTime,
        location,
        selections,
        addons: selectedAddons,
        note: note.trim() || undefined,
      });
      setSummaryVisible(false);
      Alert.alert(
        'Quote request sent',
        `Your $${result.quoteFee.toFixed(2)} quote fee was charged. Wallet balance: $${result.newBalance.toFixed(2)}.`,
      );
      await loadQuoteRequests();
    } catch (err: any) {
      const message = err?.response?.data?.error ?? 'Could not send the quote request.';
      Alert.alert('Quote request failed', message);
    } finally {
      setSubmitting(false);
    }
  };

  const chooseQuotation = async (quotation: EventQuotation, paymentMethod: 'cash' | 'wallet') => {
    try {
      await selectEventQuotation(quotation.id, paymentMethod);
      Alert.alert(
        'Quotation selected',
        paymentMethod === 'wallet'
          ? 'The quotation was paid from your wallet.'
          : 'The quotation was marked for cash payment.',
      );
      await loadQuoteRequests();
    } catch (err: any) {
      const message = err?.response?.data?.error ?? 'Could not select this quotation.';
      Alert.alert('Selection failed', message);
    }
  };

  const rejectQuotation = (quotation: EventQuotation) => {
    Alert.alert(
      'Reject quotation',
      'The event planner will be notified and you can keep discussing or wait for another quote.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              await rejectEventQuotation(quotation.id);
              Alert.alert('Quotation rejected', 'The planner has been notified.');
              await loadQuoteRequests();
            } catch (err: any) {
              const message = err?.response?.data?.error ?? 'Could not reject this quotation.';
              Alert.alert('Reject failed', message);
            }
          },
        },
      ],
    );
  };

  const contactPlanner = (request: EventQuoteRequest, quotation: EventQuotation) => {
    const email = request.planner?.email;
    if (!email) {
      Alert.alert('Contact unavailable', 'This planner has no contact email attached.');
      return;
    }
    const subject = encodeURIComponent(`Event quotation discussion: ${quotation.title}`);
    Linking.openURL(`mailto:${email}?subject=${subject}`);
  };

  if (loading) return <LoadingSpinner message="Loading event packs..." />;

  return (
    <SafeAreaView style={styles.safe}>
      <Header title="Plan Your Event" subtitle="Sounds, Lights, Beams, ..." showBack />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#06b6d4" colors={['#06b6d4']} />
          }
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.hero}>
            <View style={styles.heroIcon}>
              <Ionicons name="sparkles-outline" size={28} color="#67e8f9" />
            </View>
            <View style={styles.heroCopy}>
              <Text style={styles.heroTitle}>Build a private event brief</Text>
              <Text style={styles.heroText}>
                Pick a pack, choose the sound and show elements, then send it for a planner quote.
              </Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Published Packs</Text>
          {packs.map((pack) => {
            const isActive = selectedPack?.id === pack.id;
            return (
              <TouchableOpacity
                key={String(pack.id)}
                style={[styles.packCard, isActive && styles.packCardActive]}
                onPress={() => selectPack(pack)}
                activeOpacity={0.85}
              >
                <View style={styles.packTop}>
                  <View style={styles.packTitleWrap}>
                    <Text style={styles.packTitle}>{pack.title}</Text>
                    {pack.subtitle ? <Text style={styles.packSubtitle}>{pack.subtitle}</Text> : null}
                  </View>
                  <Badge label={pack.basePrice ? `From $${pack.basePrice}` : 'Quote'} color="#3b82f6" small />
                </View>
                {pack.description ? <Text style={styles.packDescription}>{pack.description}</Text> : null}
                <View style={styles.packFooter}>
                  <Text style={styles.plannerText}>
                    {pack.planner?.companyName ?? pack.planner?.displayName ?? 'DiskRider planner'}
                  </Text>
                  <Button
                    label={isActive ? 'Selected' : 'Get Quote'}
                    size="sm"
                    variant={isActive ? 'outlined' : 'filled'}
                    onPress={() => selectPack(pack)}
                    style={styles.quoteBtn}
                  />
                </View>
              </TouchableOpacity>
            );
          })}

          {selectedPack && (
            <View style={styles.builder}>
              <Text style={styles.sectionTitle}>Configure Quote</Text>

              {groups.map(([group, options]) => (
                <View key={group} style={styles.optionGroup}>
                  <Text style={styles.groupLabel}>{formatGroupLabel(group)}</Text>
                  <View style={styles.optionList}>
                    {options.map((option) => {
                      const active = selections[group] === option;
                      return (
                        <TouchableOpacity
                          key={option}
                          style={[styles.optionBtn, active && styles.optionBtnActive]}
                          onPress={() => setSelections((current) => ({ ...current, [group]: option }))}
                          activeOpacity={0.8}
                        >
                          <Ionicons
                            name={active ? 'radio-button-on' : 'radio-button-off'}
                            size={18}
                            color={active ? '#67e8f9' : '#6b7280'}
                          />
                          <Text style={[styles.optionText, active && styles.optionTextActive]} numberOfLines={2}>
                            {option}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ))}

              <View style={styles.optionGroup}>
                <Text style={styles.groupLabel}>Addons</Text>
                <View style={styles.addonGrid}>
                  {(selectedPack.addons ?? []).map((addon) => {
                    const active = selectedAddons.includes(addon);
                    return (
                      <TouchableOpacity
                        key={addon}
                        style={[styles.addonBtn, active && styles.addonBtnActive]}
                        onPress={() => toggleAddon(addon)}
                        activeOpacity={0.8}
                      >
                        <Ionicons
                          name={active ? 'checkmark-circle' : 'add-circle-outline'}
                          size={18}
                          color={active ? '#10b981' : '#6b7280'}
                        />
                        <Text style={[styles.addonText, active && styles.addonTextActive]} numberOfLines={2}>
                          {addon}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.formGrid}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Available Date</Text>
                  <TextInput
                    style={styles.input}
                    value={eventDate}
                    onChangeText={setEventDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#4b5563"
                  />
                </View>
                <View style={styles.timeRow}>
                  <View style={[styles.inputGroup, styles.timeInput]}>
                    <Text style={styles.inputLabel}>From</Text>
                    <TextInput
                      style={styles.input}
                      value={startTime}
                      onChangeText={setStartTime}
                      placeholder="20:00"
                      placeholderTextColor="#4b5563"
                    />
                  </View>
                  <View style={[styles.inputGroup, styles.timeInput]}>
                    <Text style={styles.inputLabel}>To</Text>
                    <TextInput
                      style={styles.input}
                      value={endTime}
                      onChangeText={setEndTime}
                      placeholder="01:00"
                      placeholderTextColor="#4b5563"
                    />
                  </View>
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Location</Text>
                  <TextInput
                    style={styles.input}
                    value={location}
                    onChangeText={setLocation}
                    placeholder="Venue, city, address"
                    placeholderTextColor="#4b5563"
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Notes Worth Mentioning</Text>
                  <TextInput
                    style={[styles.input, styles.noteInput]}
                    value={note}
                    onChangeText={setNote}
                    placeholder="Guest count, indoor/outdoor, power access, preferred vibe..."
                    placeholderTextColor="#4b5563"
                    multiline
                    textAlignVertical="top"
                  />
                </View>
              </View>

              <View style={styles.feeRow}>
                <View>
                  <Text style={styles.feeTitle}>Quote fee</Text>
                  <Text style={styles.feeText}>Charged when you confirm and send.</Text>
                </View>
                <Text style={styles.feeAmount}>$30</Text>
              </View>

              <Button label="Submit" onPress={showSummary} style={styles.submitBtn} fullWidth />
            </View>
          )}

          {quoteRequests.length > 0 && (
            <View style={styles.requestsSection}>
              <Text style={styles.sectionTitle}>My Quote Requests</Text>
              {quoteRequests.map((request) => (
                <View key={String(request.id)} style={styles.requestCard}>
                  <View style={styles.requestHeader}>
                    <View style={styles.requestTitleWrap}>
                      <Text style={styles.requestTitle}>{request.pack?.title ?? 'Custom event quote'}</Text>
                      <Text style={styles.requestMeta}>
                        {String(request.eventDate).slice(0, 10)} | {request.startTime} - {request.endTime}
                      </Text>
                      <Text style={styles.requestLocation} numberOfLines={1}>{request.location}</Text>
                    </View>
                    <Badge label={request.status} color={STATUS_COLORS[request.status] || '#6b7280'} small />
                  </View>

                  {(request.quotations ?? []).length === 0 ? (
                    <Text style={styles.noQuotesText}>Planner quotations will appear here.</Text>
                  ) : (
                    (request.quotations ?? []).map((quotation) => {
                      const isSelected = request.selectedQuotationId === quotation.id;
                      const canAct = !request.selectedQuotationId && quotation.status === 'proposed';
                      return (
                        <View key={String(quotation.id)} style={styles.quotationCard}>
                          <View style={styles.quotationTop}>
                            <Text style={styles.quotationTitle}>{quotation.title}</Text>
                            <Text style={styles.quotationTotal}>
                              {quotation.currency} {quotation.total.toFixed(2)}
                            </Text>
                          </View>
                          {quotation.lineItems.map((item, index) => (
                            <View key={`${quotation.id}-${index}`} style={styles.lineItem}>
                              <Text style={styles.lineName}>{item.name}</Text>
                              <Text style={styles.lineAmount}>${item.amount.toFixed(2)}</Text>
                            </View>
                          ))}
                          <View style={styles.quoteExplainBox}>
                            <Text style={styles.quoteExplainTitle}>Planner explanation</Text>
                            <Text style={styles.quoteNotes}>{quotation.notes || 'No extra notes were added by the planner.'}</Text>
                            <Text style={styles.quoteNotes}>
                              Status: {quotation.status.replace('_', ' ')}. You can discuss this quote with the planner, reject it, pay by cash, or pay through your wallet while it is still proposed.
                            </Text>
                          </View>
                          {isSelected ? (
                            <Badge label={request.paymentMethod ? `Selected - ${request.paymentMethod}` : 'Selected'} color="#10b981" small />
                          ) : null}
                          <View style={styles.contactRow}>
                            <TouchableOpacity style={styles.contactBtn} onPress={() => contactPlanner(request, quotation)}>
                              <Ionicons name="mail-outline" size={16} color="#67e8f9" />
                              <Text style={styles.contactText}>Contact Planner</Text>
                            </TouchableOpacity>
                          </View>
                          {canAct ? (
                            <>
                              <View style={styles.paymentBtns}>
                                <Button
                                  label="Reject"
                                  size="sm"
                                  variant="outlined"
                                  color="#ef4444"
                                  onPress={() => rejectQuotation(quotation)}
                                  style={styles.rejectBtn}
                                />
                                <Button
                                  label="Pay Cash"
                                  size="sm"
                                  variant="outlined"
                                  onPress={() => chooseQuotation(quotation, 'cash')}
                                  style={styles.paymentBtn}
                                />
                              </View>
                              <Button
                                label="Pay Through Wallet"
                                size="sm"
                                color="#10b981"
                                onPress={() => chooseQuotation(quotation, 'wallet')}
                                style={styles.walletPaymentBtn}
                                fullWidth
                              />
                            </>
                          ) : quotation.status === 'declined' ? (
                            <Badge label="Rejected" color="#ef4444" small />
                          ) : null}
                        </View>
                      );
                    })
                  )}
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={summaryVisible} transparent animationType="fade" onRequestClose={() => setSummaryVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Quote Summary</Text>
              <TouchableOpacity onPress={() => setSummaryVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color="#ffffff" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.summaryScroll} showsVerticalScrollIndicator={false}>
              <SummaryRow label="Pack" value={selectedPack?.title ?? ''} />
              <SummaryRow label="Date" value={eventDate} />
              <SummaryRow label="Time" value={`${startTime} - ${endTime}`} />
              <SummaryRow label="Location" value={location} />
              {Object.entries(selections).map(([group, value]) => (
                <SummaryRow key={group} label={formatGroupLabel(group)} value={value} />
              ))}
              <SummaryRow label="Addons" value={selectedAddons.length ? selectedAddons.join(', ') : 'None'} />
              <SummaryRow label="Notes" value={note.trim() || 'None'} />
              <View style={styles.summaryFee}>
                <Text style={styles.summaryFeeLabel}>Quote fee charged now</Text>
                <Text style={styles.summaryFeeAmount}>$30.00</Text>
              </View>
            </ScrollView>

            <Button
              label="Confirm & Send"
              onPress={confirmAndSend}
              loading={submitting}
              style={styles.confirmBtn}
              fullWidth
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const SummaryRow = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.summaryRow}>
    <Text style={styles.summaryLabel}>{label}</Text>
    <Text style={styles.summaryValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0a0a0f' },
  flex: { flex: 1 },
  content: { padding: 16, paddingBottom: 40, gap: 16 },
  hero: { flexDirection: 'row', gap: 14, backgroundColor: '#101923', borderWidth: 1, borderColor: '#164e63', borderRadius: 16, padding: 16 },
  heroIcon: { width: 52, height: 52, borderRadius: 14, backgroundColor: 'rgba(6,182,212,0.14)', alignItems: 'center', justifyContent: 'center' },
  heroCopy: { flex: 1 },
  heroTitle: { color: '#ffffff', fontSize: 17, fontWeight: '900', marginBottom: 4 },
  heroText: { color: '#94a3b8', fontSize: 13, lineHeight: 18 },
  sectionTitle: { color: '#ffffff', fontSize: 16, fontWeight: '900', marginTop: 4 },
  packCard: { backgroundColor: '#12121a', borderRadius: 16, borderWidth: 1, borderColor: '#1f1f2e', padding: 16, gap: 10 },
  packCardActive: { borderColor: '#06b6d4', backgroundColor: 'rgba(6,182,212,0.08)' },
  packTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  packTitleWrap: { flex: 1 },
  packTitle: { color: '#ffffff', fontSize: 16, fontWeight: '900' },
  packSubtitle: { color: '#67e8f9', fontSize: 12, fontWeight: '700', marginTop: 2 },
  packDescription: { color: '#9ca3af', fontSize: 13, lineHeight: 18 },
  packFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  plannerText: { color: '#6b7280', fontSize: 12, flex: 1 },
  quoteBtn: { minWidth: 102 },
  builder: { gap: 16 },
  optionGroup: { gap: 10 },
  groupLabel: { color: '#9ca3af', fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  optionList: { gap: 8 },
  optionBtn: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#12121a', borderWidth: 1, borderColor: '#1f1f2e', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  optionBtnActive: { borderColor: '#06b6d4', backgroundColor: 'rgba(6,182,212,0.1)' },
  optionText: { color: '#9ca3af', fontSize: 14, fontWeight: '600', flex: 1 },
  optionTextActive: { color: '#ffffff' },
  addonGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  addonBtn: { width: '48%', minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#12121a', borderWidth: 1, borderColor: '#1f1f2e', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 10 },
  addonBtnActive: { borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.1)' },
  addonText: { color: '#9ca3af', fontSize: 13, fontWeight: '600', flex: 1 },
  addonTextActive: { color: '#ffffff' },
  formGrid: { gap: 12 },
  inputGroup: { gap: 6 },
  inputLabel: { color: '#9ca3af', fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: '#12121a', borderWidth: 1, borderColor: '#1f1f2e', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: '#ffffff', fontSize: 15 },
  noteInput: { minHeight: 110, lineHeight: 20 },
  timeRow: { flexDirection: 'row', gap: 10 },
  timeInput: { flex: 1 },
  feeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#16131d', borderWidth: 1, borderColor: '#3b2a52', borderRadius: 14, padding: 14 },
  feeTitle: { color: '#ffffff', fontSize: 14, fontWeight: '800' },
  feeText: { color: '#9ca3af', fontSize: 12, marginTop: 2 },
  feeAmount: { color: '#67e8f9', fontSize: 22, fontWeight: '900' },
  submitBtn: { backgroundColor: '#06b6d4' },
  requestsSection: { gap: 12 },
  requestCard: { backgroundColor: '#12121a', borderRadius: 16, borderWidth: 1, borderColor: '#1f1f2e', padding: 14, gap: 12 },
  requestHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  requestTitleWrap: { flex: 1 },
  requestTitle: { color: '#ffffff', fontSize: 15, fontWeight: '900' },
  requestMeta: { color: '#67e8f9', fontSize: 12, fontWeight: '700', marginTop: 3 },
  requestLocation: { color: '#6b7280', fontSize: 12, marginTop: 3 },
  noQuotesText: { color: '#6b7280', fontSize: 13 },
  quotationCard: { backgroundColor: '#0a0a0f', borderRadius: 12, borderWidth: 1, borderColor: '#253041', padding: 12, gap: 8 },
  quotationTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  quotationTitle: { color: '#ffffff', fontSize: 14, fontWeight: '900', flex: 1 },
  quotationTotal: { color: '#10b981', fontSize: 14, fontWeight: '900' },
  lineItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  lineName: { color: '#9ca3af', fontSize: 12, flex: 1 },
  lineAmount: { color: '#e5e7eb', fontSize: 12, fontWeight: '700' },
  quoteExplainBox: { backgroundColor: '#12121a', borderWidth: 1, borderColor: '#1f1f2e', borderRadius: 10, padding: 10, gap: 5 },
  quoteExplainTitle: { color: '#6b7280', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 },
  quoteNotes: { color: '#9ca3af', fontSize: 12, lineHeight: 17 },
  contactRow: { flexDirection: 'row' },
  contactBtn: { flex: 1, minHeight: 38, borderRadius: 10, borderWidth: 1, borderColor: '#06b6d455', backgroundColor: 'rgba(6,182,212,0.08)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  contactText: { color: '#67e8f9', fontSize: 12, fontWeight: '900' },
  paymentBtns: { flexDirection: 'row', gap: 8 },
  paymentBtn: { flex: 1 },
  rejectBtn: { flex: 1 },
  walletPaymentBtn: { backgroundColor: '#10b981' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', justifyContent: 'center', padding: 18 },
  modalCard: { maxHeight: '86%', backgroundColor: '#12121a', borderRadius: 18, borderWidth: 1, borderColor: '#263241', padding: 16 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  modalTitle: { color: '#ffffff', fontSize: 18, fontWeight: '900' },
  closeBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#1f1f2e', alignItems: 'center', justifyContent: 'center' },
  summaryScroll: { marginBottom: 14 },
  summaryRow: { borderBottomWidth: 1, borderBottomColor: '#1f1f2e', paddingVertical: 10, gap: 3 },
  summaryLabel: { color: '#6b7280', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  summaryValue: { color: '#ffffff', fontSize: 14, lineHeight: 19 },
  summaryFee: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(6,182,212,0.1)', borderWidth: 1, borderColor: '#06b6d4', borderRadius: 12, padding: 12, marginTop: 12 },
  summaryFeeLabel: { color: '#cffafe', fontSize: 13, fontWeight: '800' },
  summaryFeeAmount: { color: '#67e8f9', fontSize: 18, fontWeight: '900' },
  confirmBtn: { backgroundColor: '#06b6d4' },
});

export default PlanYourEventScreen;
