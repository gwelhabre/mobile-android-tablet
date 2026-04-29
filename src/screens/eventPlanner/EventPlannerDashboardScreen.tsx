import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import {
  createEventPlanningPack,
  createEventQuotation,
  deleteEventPlanningPack,
  getEventPlannerRevenue,
  getEventPlanningPacks,
  getEventQuoteRequests,
  updateEventPlanningPack,
} from '../../api/eventPlanning';
import {
  EventPlannerRevenueLog,
  EventPlanningComponents,
  EventPlanningPack,
  EventQuoteRequest,
} from '../../types';

const parseLineItems = (raw: string, fallbackName: string, total: number) => {
  const lines = raw.split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return [{ name: fallbackName, amount: total }];
  return lines.map((line) => {
    const match = line.match(/^(.*?)[\s|—–-]+\$?(\d+(?:\.\d+)?)\s*$/);
    if (match) return { name: match[1].trim() || fallbackName, amount: Number(match[2]) };
    return { name: line, amount: 0 };
  });
};

const DEFAULT_COMPONENTS: EventPlanningComponents = {
  djSet: ['DJ set - 2 hours', 'Premium DJ set - 4 hours', 'DJ set with MC hosting'],
  lighting: ['Ambient uplighting', 'Dancefloor lighting', 'Moving heads and beams'],
  band: ['No live band', 'Solo singer', 'Singer and percussion duo', '4-piece live band', '5-piece party band'],
};

const DEFAULT_ADDONS = [
  'Beamer',
  'Huge subwoofers',
  'Extra singer',
  'Extra guitarist',
  'Stage beams',
  'Smoke machine',
  'LED screen',
];

const parseOptionLines = (value: string) =>
  value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

const EventPlannerDashboardScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [packs, setPacks] = useState<EventPlanningPack[]>([]);
  const [requests, setRequests] = useState<EventQuoteRequest[]>([]);
  const [revenue, setRevenue] = useState<EventPlannerRevenueLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPack, setEditingPack] = useState<EventPlanningPack | null>(null);
  const [quoteRequest, setQuoteRequest] = useState<EventQuoteRequest | null>(null);
  const [quoteTitle, setQuoteTitle] = useState('');
  const [quoteLineItems, setQuoteLineItems] = useState('');
  const [quoteTotal, setQuoteTotal] = useState('');
  const [quoteNotes, setQuoteNotes] = useState('');
  const [sendingQuote, setSendingQuote] = useState(false);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'draft' | 'published'>('published');
  const [djSetOptions, setDjSetOptions] = useState(DEFAULT_COMPONENTS.djSet.join('\n'));
  const [lightingOptions, setLightingOptions] = useState(DEFAULT_COMPONENTS.lighting.join('\n'));
  const [bandOptions, setBandOptions] = useState(DEFAULT_COMPONENTS.band.join('\n'));
  const [addonOptions, setAddonOptions] = useState(DEFAULT_ADDONS.join('\n'));
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const [packData, requestData, revenueData] = await Promise.all([
        getEventPlanningPacks(true),
        getEventQuoteRequests().catch(() => [] as EventQuoteRequest[]),
        getEventPlannerRevenue().catch(() => [] as EventPlannerRevenueLog[]),
      ]);
      setPacks(packData);
      setRequests(requestData);
      setRevenue(revenueData);
    } catch {
      setPacks([]);
      setRequests([]);
      setRevenue([]);
    }
  };

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    const made = revenue.filter((log) => log.status === 'made').reduce((sum, log) => sum + log.amount, 0);
    const locked = revenue.filter((log) => log.status === 'locked').reduce((sum, log) => sum + log.amount, 0);
    return {
      published: packs.filter((pack) => pack.status === 'published').length,
      drafts: packs.filter((pack) => pack.status === 'draft').length,
      newRequests: requests.filter((r) => r.status === 'submitted').length,
      quoted: requests.filter((r) => r.status === 'quoted').length,
      revenueMade: made,
      revenueLocked: locked,
    };
  }, [packs, requests, revenue]);

  const openQuoteModal = (request: EventQuoteRequest) => {
    setQuoteRequest(request);
    setQuoteTitle(request.pack?.title ? `${request.pack.title} quotation` : 'Event quotation');
    setQuoteLineItems('');
    setQuoteTotal('');
    setQuoteNotes('');
  };

  const submitQuote = async () => {
    if (!quoteRequest) return;
    const total = Number(quoteTotal);
    if (!quoteTitle.trim() || !Number.isFinite(total) || total <= 0) {
      Alert.alert('Missing quote details', 'Add a quotation name and a total greater than zero.');
      return;
    }
    setSendingQuote(true);
    try {
      await createEventQuotation({
        requestId: quoteRequest.id,
        title: quoteTitle.trim(),
        lineItems: parseLineItems(quoteLineItems, quoteTitle.trim(), total),
        total,
        notes: quoteNotes.trim() || undefined,
      });
      setQuoteRequest(null);
      await load();
      Alert.alert('Quotation sent', 'The requester can now review and choose payment.');
    } catch (err: any) {
      Alert.alert('Could not send quotation', err?.response?.data?.error ?? 'Please try again.');
    } finally {
      setSendingQuote(false);
    }
  };

  const resetForm = () => {
    setEditingPack(null);
    setTitle('');
    setSubtitle('');
    setBasePrice('');
    setDescription('');
    setStatus('published');
    setDjSetOptions(DEFAULT_COMPONENTS.djSet.join('\n'));
    setLightingOptions(DEFAULT_COMPONENTS.lighting.join('\n'));
    setBandOptions(DEFAULT_COMPONENTS.band.join('\n'));
    setAddonOptions(DEFAULT_ADDONS.join('\n'));
  };

  const openCreate = () => {
    resetForm();
    setModalVisible(true);
  };

  const openEdit = (pack: EventPlanningPack) => {
    setEditingPack(pack);
    setTitle(pack.title);
    setSubtitle(pack.subtitle ?? '');
    setBasePrice(pack.basePrice !== undefined && pack.basePrice !== null ? String(pack.basePrice) : '');
    setDescription(pack.description ?? '');
    setStatus(pack.status === 'draft' ? 'draft' : 'published');
    setDjSetOptions((pack.components?.djSet ?? []).join('\n'));
    setLightingOptions((pack.components?.lighting ?? []).join('\n'));
    setBandOptions((pack.components?.band ?? []).join('\n'));
    setAddonOptions((pack.addons ?? []).join('\n'));
    setModalVisible(true);
  };

  const refresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const savePack = async () => {
    if (!title.trim()) {
      Alert.alert('Missing title', 'Add a pack title before saving.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        subtitle: subtitle.trim() || undefined,
        description: description.trim() || undefined,
        basePrice: basePrice.trim() ? Number(basePrice) : editingPack ? null : undefined,
        status,
        components: {
          djSet: parseOptionLines(djSetOptions),
          lighting: parseOptionLines(lightingOptions),
          band: parseOptionLines(bandOptions),
        },
        addons: parseOptionLines(addonOptions),
      };

      if (editingPack) {
        await updateEventPlanningPack(editingPack.id, payload);
      } else {
        await createEventPlanningPack(payload);
      }

      const wasEditing = Boolean(editingPack);
      resetForm();
      setModalVisible(false);
      await load();
      Alert.alert(wasEditing ? 'Pack updated' : 'Pack saved', status === 'published' ? 'The pack is visible in Plan Your Event.' : 'The pack is saved as a draft.');
    } catch (err: any) {
      Alert.alert('Could not save pack', err?.response?.data?.error ?? 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const deletePack = (pack: EventPlanningPack) => {
    Alert.alert(
      'Delete pack',
      `"${pack.title}" will be removed from Plan Your Event. Existing quote requests keep their history.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteEventPlanningPack(pack.id);
              await load();
              Alert.alert('Pack deleted', 'The pack has been removed.');
            } catch (err: any) {
              Alert.alert('Could not delete pack', err?.response?.data?.error ?? 'Please try again.');
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#67e8f9" />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Event Planner</Text>
          <Text style={styles.headerSubtitle}>Published packs</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={openCreate}>
          <Ionicons name="add" size={22} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#06b6d4" colors={['#06b6d4']} />}
      >
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Manage Event Packs</Text>
          <Text style={styles.heroText}>Edit prices, descriptions, and visibility for the packs customers request quotes from.</Text>
        </View>

        <View style={styles.statsRow}>
          <Stat label="Published" value={loading ? '...' : String(stats.published)} icon="albums-outline" color="#06b6d4" />
          <Stat label="New Requests" value={loading ? '...' : String(stats.newRequests)} icon="clipboard-outline" color="#f59e0b" />
          <Stat label="Quoted" value={loading ? '...' : String(stats.quoted)} icon="send-outline" color="#10b981" />
        </View>
        <View style={styles.statsRow}>
          <Stat label="Revenue Made" value={loading ? '...' : `$${stats.revenueMade.toFixed(0)}`} icon="wallet-outline" color="#22c55e" />
          <Stat label="Revenue Locked" value={loading ? '...' : `$${stats.revenueLocked.toFixed(0)}`} icon="lock-closed-outline" color="#a855f7" />
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.primaryAction} onPress={openCreate}>
            <Ionicons name="add-circle-outline" size={20} color="#ffffff" />
            <Text style={styles.primaryActionText}>Publish Pack</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryAction}
            onPress={() => (navigation as any).navigate('DiscoverStack', { screen: 'PlanYourEvent' })}
          >
            <Ionicons name="eye-outline" size={20} color="#10b981" />
            <Text style={styles.secondaryActionText}>View Public Page</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Published Packs</Text>
        {packs.length === 0 && !loading ? (
          <View style={styles.emptyPanel}>
            <Ionicons name="file-tray-outline" size={26} color="#4b5563" />
            <Text style={styles.emptyText}>No packs published yet.</Text>
          </View>
        ) : (
          packs.map((pack) => (
            <View key={String(pack.id)} style={styles.packCard}>
              <View style={styles.packHeader}>
                <View style={styles.packTitleWrap}>
                  <Text style={styles.packTitle}>{pack.title}</Text>
                  {pack.subtitle ? <Text style={styles.packSubtitle}>{pack.subtitle}</Text> : null}
                </View>
                <View style={[styles.statusBadge, pack.status === 'published' ? styles.publishedBadge : styles.draftBadge]}>
                  <Text style={styles.statusBadgeText}>{pack.status}</Text>
                </View>
              </View>
              {pack.description ? <Text style={styles.packDescription}>{pack.description}</Text> : null}
              <Text style={styles.packPrice}>{pack.basePrice ? `From $${pack.basePrice.toFixed(2)}` : 'Priced by quote'}</Text>
              <View style={styles.packActions}>
                <TouchableOpacity style={[styles.packActionBtn, styles.editBtn]} onPress={() => openEdit(pack)}>
                  <Ionicons name="create-outline" size={16} color="#67e8f9" />
                  <Text style={styles.editText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.packActionBtn, styles.deleteBtn]} onPress={() => deletePack(pack)}>
                  <Ionicons name="trash-outline" size={16} color="#fca5a5" />
                  <Text style={styles.deleteText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        <Text style={styles.sectionTitle}>Quote Requests</Text>
        {requests.length === 0 ? (
          <View style={styles.emptyPanel}>
            <Ionicons name="clipboard-outline" size={26} color="#4b5563" />
            <Text style={styles.emptyText}>Incoming quote requests will appear here.</Text>
          </View>
        ) : (
          requests.map((request) => (
            <View key={String(request.id)} style={styles.packCard}>
              <View style={styles.packHeader}>
                <View style={styles.packTitleWrap}>
                  <Text style={styles.packTitle}>{request.pack?.title ?? 'Custom event request'}</Text>
                  <Text style={styles.packSubtitle}>{request.requester?.name ?? request.requester?.email ?? 'Requester'}</Text>
                </View>
                <View style={[styles.statusBadge, request.status === 'submitted' ? styles.draftBadge : styles.publishedBadge]}>
                  <Text style={styles.statusBadgeText}>{request.status}</Text>
                </View>
              </View>
              <View style={styles.detailGrid}>
                <Detail label="Date" value={String(request.eventDate).slice(0, 10)} />
                <Detail label="Time" value={`${request.startTime} - ${request.endTime}`} />
                <Detail label="Fee" value={request.quoteFeePaid ? '$30 paid' : 'Unpaid'} />
              </View>
              <Detail label="Location" value={request.location} full />
              <Detail
                label="Selections"
                value={Object.entries(request.selections ?? {}).map(([key, value]) => `${key}: ${value}`).join('\n') || 'None'}
                full
              />
              <Detail label="Addons" value={request.addons.length ? request.addons.join(', ') : 'None'} full />
              {request.note ? <Detail label="Notes" value={request.note} full /> : null}
              {(request.quotations ?? []).length > 0 && (
                <View style={styles.quoteList}>
                  {(request.quotations ?? []).map((quote) => (
                    <View key={String(quote.id)} style={styles.sentQuote}>
                      <Text style={styles.sentQuoteTitle}>{quote.title}</Text>
                      <Text style={styles.sentQuoteAmount}>{quote.currency} {quote.total.toFixed(2)}</Text>
                      <Text style={styles.sentQuoteStatus}>{quote.status.replace('_', ' ')}</Text>
                    </View>
                  ))}
                </View>
              )}
              <TouchableOpacity style={styles.sendQuoteBtn} onPress={() => openQuoteModal(request)}>
                <Ionicons name="send-outline" size={16} color="#ffffff" />
                <Text style={styles.sendQuoteText}>Send Quotation</Text>
              </TouchableOpacity>
            </View>
          ))
        )}

        <Text style={styles.sectionTitle}>Revenue Log</Text>
        {revenue.length === 0 ? (
          <View style={styles.emptyPanel}>
            <Ionicons name="wallet-outline" size={26} color="#4b5563" />
            <Text style={styles.emptyText}>Selected quotations will create locked or made revenue logs.</Text>
          </View>
        ) : (
          revenue.map((log) => (
            <View key={String(log.id)} style={styles.revenueRow}>
              <View style={styles.packTitleWrap}>
                <Text style={styles.revenueTitle}>{log.quotation?.title ?? log.description ?? 'Event quotation'}</Text>
                <Text style={styles.revenueMeta}>{String(log.createdAt).slice(0, 10)} · {log.paymentMethod ?? 'n/a'}</Text>
              </View>
              <View style={styles.revenueAmountWrap}>
                <Text style={styles.revenueAmount}>{log.currency} {log.amount.toFixed(2)}</Text>
                <Text style={[styles.revenueStatus, log.status === 'made' ? styles.revenueStatusMade : styles.revenueStatusLocked]}>{log.status}</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalKeyboard}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{editingPack ? 'Edit Pack' : 'Publish Pack'}</Text>
                <TouchableOpacity style={styles.closeBtn} onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={20} color="#ffffff" />
                </TouchableOpacity>
              </View>
              <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled">
                <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Pack title" placeholderTextColor="#4b5563" />
                <TextInput style={styles.input} value={subtitle} onChangeText={setSubtitle} placeholder="Sounds, lights, beams..." placeholderTextColor="#4b5563" />
                <TextInput style={styles.input} value={basePrice} onChangeText={setBasePrice} placeholder="Base price" placeholderTextColor="#4b5563" keyboardType="numeric" />
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Short description"
                  placeholderTextColor="#4b5563"
                  multiline
                  textAlignVertical="top"
                />
                <OptionEditor label="DJ Set Options" value={djSetOptions} onChangeText={setDjSetOptions} />
                <OptionEditor label="Lighting Options" value={lightingOptions} onChangeText={setLightingOptions} />
                <OptionEditor label="Band Options" value={bandOptions} onChangeText={setBandOptions} />
                <OptionEditor label="Addons" value={addonOptions} onChangeText={setAddonOptions} />
                <Text style={styles.optionHelp}>One option per line. Add, rename, reorder, or delete lines to change what customers can choose.</Text>
                <View style={styles.statusRow}>
                  {(['published', 'draft'] as const).map((item) => (
                    <TouchableOpacity
                      key={item}
                      style={[styles.statusOption, status === item && styles.statusOptionActive]}
                      onPress={() => setStatus(item)}
                    >
                      <Text style={[styles.statusOptionText, status === item && styles.statusOptionTextActive]}>
                        {item === 'published' ? 'Published' : 'Draft'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity style={[styles.saveBtn, saving && styles.saveBtnDisabled]} onPress={savePack} disabled={saving}>
                  <Text style={styles.saveBtnText}>{saving ? 'Saving...' : editingPack ? 'Save Changes' : 'Publish'}</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <Modal visible={!!quoteRequest} transparent animationType="fade" onRequestClose={() => setQuoteRequest(null)}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalKeyboard}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Send Quotation</Text>
                <TouchableOpacity style={styles.closeBtn} onPress={() => setQuoteRequest(null)}>
                  <Ionicons name="close" size={20} color="#ffffff" />
                </TouchableOpacity>
              </View>
              <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled">
                <TextInput style={styles.input} value={quoteTitle} onChangeText={setQuoteTitle} placeholder="Quotation name" placeholderTextColor="#4b5563" />
                <TextInput style={styles.input} value={quoteTotal} onChangeText={setQuoteTotal} placeholder="Total amount" placeholderTextColor="#4b5563" keyboardType="numeric" />
                <View style={styles.optionEditor}>
                  <Text style={styles.optionEditorLabel}>Line Items</Text>
                  <TextInput
                    style={[styles.input, styles.optionTextArea]}
                    value={quoteLineItems}
                    onChangeText={setQuoteLineItems}
                    multiline
                    textAlignVertical="top"
                    placeholder="One per line. Format: 'DJ set — 800' or 'Lighting'"
                    placeholderTextColor="#4b5563"
                  />
                </View>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={quoteNotes}
                  onChangeText={setQuoteNotes}
                  placeholder="Notes for the requester (optional)"
                  placeholderTextColor="#4b5563"
                  multiline
                  textAlignVertical="top"
                />
                <TouchableOpacity style={[styles.saveBtn, sendingQuote && styles.saveBtnDisabled]} onPress={submitQuote} disabled={sendingQuote}>
                  <Text style={styles.saveBtnText}>{sendingQuote ? 'Sending...' : 'Send Quotation'}</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const Detail = ({ label, value, full }: { label: string; value: string; full?: boolean }) => (
  <View style={[styles.detailItem, full && styles.detailItemFull]}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

const Stat = ({ label, value, icon, color }: { label: string; value: string; icon: any; color: string }) => (
  <View style={[styles.statCard, { borderColor: `${color}55` }]}>
    <Ionicons name={icon} size={20} color={color} />
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const OptionEditor = ({
  label,
  value,
  onChangeText,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
}) => (
  <View style={styles.optionEditor}>
    <Text style={styles.optionEditorLabel}>{label}</Text>
    <TextInput
      style={[styles.input, styles.optionTextArea]}
      value={value}
      onChangeText={onChangeText}
      multiline
      textAlignVertical="top"
      placeholder="One option per line"
      placeholderTextColor="#4b5563"
    />
  </View>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0a0a0f' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1f1f2e' },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#12121a', alignItems: 'center', justifyContent: 'center' },
  headerText: { flex: 1, alignItems: 'center' },
  headerTitle: { color: '#ffffff', fontSize: 17, fontWeight: '900' },
  headerSubtitle: { color: '#6b7280', fontSize: 12, marginTop: 1 },
  addBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#06b6d4', alignItems: 'center', justifyContent: 'center' },
  container: { padding: 16, gap: 14, paddingBottom: 36 },
  hero: { backgroundColor: '#101923', borderWidth: 1, borderColor: '#164e63', borderRadius: 16, padding: 16, gap: 6 },
  heroTitle: { color: '#ffffff', fontSize: 20, fontWeight: '900' },
  heroText: { color: '#94a3b8', fontSize: 13, lineHeight: 19 },
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1, backgroundColor: '#12121a', borderRadius: 14, borderWidth: 1, padding: 14, gap: 6 },
  statValue: { color: '#ffffff', fontSize: 22, fontWeight: '900' },
  statLabel: { color: '#6b7280', fontSize: 12 },
  actionRow: { flexDirection: 'row', gap: 10 },
  primaryAction: { flex: 1, minHeight: 46, borderRadius: 14, backgroundColor: '#06b6d4', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  primaryActionText: { color: '#ffffff', fontSize: 14, fontWeight: '900' },
  secondaryAction: { flex: 1, minHeight: 46, borderRadius: 14, borderWidth: 1, borderColor: '#10b98155', backgroundColor: 'rgba(16,185,129,0.08)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  secondaryActionText: { color: '#10b981', fontSize: 14, fontWeight: '900' },
  emptyPanel: { backgroundColor: '#12121a', borderRadius: 14, borderWidth: 1, borderColor: '#1f1f2e', padding: 22, alignItems: 'center', gap: 8 },
  emptyText: { color: '#6b7280', fontSize: 13, textAlign: 'center' },
  packCard: { backgroundColor: '#12121a', borderRadius: 16, borderWidth: 1, borderColor: '#1f1f2e', padding: 14, gap: 9 },
  packHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  packTitleWrap: { flex: 1 },
  packTitle: { color: '#ffffff', fontSize: 15, fontWeight: '900' },
  packSubtitle: { color: '#67e8f9', fontSize: 12, fontWeight: '700', marginTop: 3 },
  packDescription: { color: '#9ca3af', fontSize: 13, lineHeight: 18 },
  packPrice: { color: '#10b981', fontSize: 13, fontWeight: '900' },
  statusBadge: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4, borderWidth: 1 },
  publishedBadge: { backgroundColor: 'rgba(6,182,212,0.12)', borderColor: 'rgba(6,182,212,0.36)' },
  draftBadge: { backgroundColor: 'rgba(107,114,128,0.14)', borderColor: 'rgba(107,114,128,0.34)' },
  statusBadgeText: { color: '#e5e7eb', fontSize: 11, fontWeight: '900', textTransform: 'capitalize' },
  packActions: { flexDirection: 'row', gap: 8 },
  packActionBtn: { flex: 1, minHeight: 38, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 },
  editBtn: { borderColor: '#06b6d455', backgroundColor: 'rgba(6,182,212,0.08)' },
  deleteBtn: { borderColor: '#ef444455', backgroundColor: 'rgba(239,68,68,0.08)' },
  editText: { color: '#67e8f9', fontSize: 12, fontWeight: '900' },
  deleteText: { color: '#fca5a5', fontSize: 12, fontWeight: '900' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', justifyContent: 'center', padding: 18 },
  modalKeyboard: { width: '100%' },
  modalCard: { maxHeight: '88%', backgroundColor: '#12121a', borderRadius: 18, borderWidth: 1, borderColor: '#263241', padding: 16 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  modalTitle: { color: '#ffffff', fontSize: 18, fontWeight: '900' },
  closeBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#1f1f2e', alignItems: 'center', justifyContent: 'center' },
  modalBody: { gap: 12 },
  input: { backgroundColor: '#0a0a0f', borderWidth: 1, borderColor: '#2d2d3d', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: '#ffffff', fontSize: 15 },
  textArea: { minHeight: 104, lineHeight: 20 },
  optionEditor: { gap: 6 },
  optionEditorLabel: { color: '#9ca3af', fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 },
  optionTextArea: { minHeight: 96, lineHeight: 20 },
  optionHelp: { color: '#6b7280', fontSize: 12, lineHeight: 17 },
  statusRow: { flexDirection: 'row', gap: 8 },
  statusOption: { flex: 1, borderWidth: 1, borderColor: '#2d2d3d', borderRadius: 12, paddingVertical: 11, alignItems: 'center', backgroundColor: '#0a0a0f' },
  statusOptionActive: { borderColor: '#06b6d4', backgroundColor: 'rgba(6,182,212,0.12)' },
  statusOptionText: { color: '#6b7280', fontSize: 13, fontWeight: '900' },
  statusOptionTextActive: { color: '#67e8f9' },
  saveBtn: { minHeight: 46, borderRadius: 12, backgroundColor: '#06b6d4', alignItems: 'center', justifyContent: 'center' },
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnText: { color: '#ffffff', fontSize: 14, fontWeight: '900' },
  sectionTitle: { color: '#ffffff', fontSize: 15, fontWeight: '900', marginTop: 6 },
  detailGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  detailItem: { minWidth: 90 },
  detailItemFull: { width: '100%' },
  detailLabel: { color: '#6b7280', fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 },
  detailValue: { color: '#e5e7eb', fontSize: 13, lineHeight: 18, marginTop: 2 },
  quoteList: { gap: 6, paddingVertical: 4 },
  sentQuote: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#0a0a0f', borderRadius: 10, borderWidth: 1, borderColor: '#1f1f2e', padding: 10 },
  sentQuoteTitle: { color: '#e5e7eb', fontSize: 12, fontWeight: '700', flex: 1 },
  sentQuoteAmount: { color: '#10b981', fontSize: 12, fontWeight: '900' },
  sentQuoteStatus: { color: '#9ca3af', fontSize: 11, textTransform: 'capitalize' },
  sendQuoteBtn: { minHeight: 38, borderRadius: 10, backgroundColor: '#06b6d4', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 },
  sendQuoteText: { color: '#ffffff', fontSize: 12, fontWeight: '900' },
  revenueRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#12121a', borderRadius: 14, borderWidth: 1, borderColor: '#1f1f2e', padding: 14 },
  revenueTitle: { color: '#ffffff', fontSize: 14, fontWeight: '900' },
  revenueMeta: { color: '#6b7280', fontSize: 11, marginTop: 2 },
  revenueAmountWrap: { alignItems: 'flex-end' },
  revenueAmount: { color: '#10b981', fontSize: 15, fontWeight: '900' },
  revenueStatus: { fontSize: 11, fontWeight: '900', textTransform: 'uppercase', marginTop: 2 },
  revenueStatusMade: { color: '#22c55e' },
  revenueStatusLocked: { color: '#a855f7' },
});

export default EventPlannerDashboardScreen;
