import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Switch,
  RefreshControl,
  Modal,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import PageHeader from '../../components/layout/PageHeader';
import FAB from '../../components/layout/FAB';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import Snackbar from '../../components/common/Snackbar';
import { getDJSets, updateSet, deleteSet, createDJSet } from '../../api/dj';
import { DigitalSet } from '../../types';

const DJSetsScreen: React.FC = () => {
  const navigation = useNavigation();
  const [sets, setSets] = useState<DigitalSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [snackbar, setSnackbar] = useState('');
  const [snackType, setSnackType] = useState<'default' | 'success' | 'error'>('default');
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [price, setPrice] = useState('0');
  const [accessType, setAccessType] = useState<'free' | 'paid' | 'subscription'>('free');
  const [saving, setSaving] = useState(false);

  const submitSet = async () => {
    if (saving) return; // re-entrancy guard
    if (!title.trim()) {
      Alert.alert('Missing title', 'Set title is required.');
      return;
    }
    setSaving(true);
    try {
      await createDJSet({
        title: title.trim(),
        description: description.trim() || undefined,
        previewUrl: previewUrl.trim() || undefined,
        coverImage: coverImage.trim() || undefined,
        price: accessType === 'paid' ? Number(price) || 0 : 0,
        accessType,
        visibility: 'public',
      });
      setTitle(''); setDescription(''); setPreviewUrl(''); setCoverImage(''); setPrice('0'); setAccessType('free');
      setModalVisible(false);
      await fetchSets();
      setSnackbar('Set published');
      setSnackType('success');
    } catch (err: any) {
      setSnackbar(err?.response?.data?.error ?? 'Could not publish set');
      setSnackType('error');
    } finally {
      setSaving(false);
    }
  };

  const fetchSets = useCallback(async () => {
    try {
      const data = await getDJSets();
      setSets(data);
    } catch {
      setSnackbar('Failed to load sets');
      setSnackType('error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchSets(); }, [fetchSets]);

  const handleToggleActive = async (set: DigitalSet) => {
    try {
      const updated = await updateSet(set.id, { isActive: !set.isActive });
      setSets((prev) => prev.map((s) => s.id === set.id ? updated : s));
      setSnackbar(`Set ${updated.isActive ? 'activated' : 'deactivated'}`);
      setSnackType('success');
    } catch {
      setSnackbar('Failed to update set');
      setSnackType('error');
    }
  };

  const handleDelete = async (setId: string) => {
    try {
      await deleteSet(setId);
      setSets((prev) => prev.filter((s) => s.id !== setId));
      setSnackbar('Set deleted');
      setSnackType('default');
    } catch {
      setSnackbar('Failed to delete set');
      setSnackType('error');
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;

  const TableHeader = () => (
    <View style={styles.tableHeader}>
      <Text style={[styles.headerCell, styles.titleCol]}>Title</Text>
      <Text style={[styles.headerCell, styles.genreCol]}>Genre</Text>
      <Text style={[styles.headerCell, styles.bpmCol]}>BPM</Text>
      <Text style={[styles.headerCell, styles.priceCol]}>Price</Text>
      <Text style={[styles.headerCell, styles.salesCol]}>Sales</Text>
      <Text style={[styles.headerCell, styles.earningsCol]}>Earnings</Text>
      <Text style={[styles.headerCell, styles.statusCol]}>Active</Text>
      <Text style={[styles.headerCell, styles.actionsCol]}>Actions</Text>
    </View>
  );

  return (
    <View style={styles.root}>
      <PageHeader
        title="My Sets"
        subtitle={`${sets.length} digital sets`}
        showBack
        onBack={() => navigation.goBack()}
      />

      {sets.length === 0 ? (
        <EmptyState
          icon="music-note-plus"
          title="No sets yet"
          message="Upload your first digital set to start selling"
          actionLabel="Upload Set"
          onAction={() => setModalVisible(true)}
        />
      ) : (
        <View style={styles.tableContainer}>
          <TableHeader />
          <FlatList
            data={sets}
            keyExtractor={(s) => s.id}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchSets(); }} tintColor="#a855f7" />
            }
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
            renderItem={({ item }) => (
              <View style={styles.tableRow}>
                <View style={[styles.cell, styles.titleCol]}>
                  <View style={styles.setIconWrap}>
                    <MaterialCommunityIcons name="music-note" size={16} color="#a855f7" />
                  </View>
                  <View style={styles.setTitleGroup}>
                    <Text style={styles.setTitle} numberOfLines={1}>{item.title}</Text>
                    {item.duration && (
                      <Text style={styles.setDuration}>
                        {Math.floor(item.duration / 60)}:{(item.duration % 60).toString().padStart(2, '0')}
                      </Text>
                    )}
                  </View>
                </View>
                <Text style={[styles.cellText, styles.genreCol]}>{item.genre}</Text>
                <Text style={[styles.cellText, styles.bpmCol]}>{item.bpm || '--'}</Text>
                <Text style={[styles.cellText, styles.priceCol, styles.priceText]}>
                  ${item.price.toFixed(2)}
                </Text>
                <Text style={[styles.cellText, styles.salesCol]}>{item.totalSales}</Text>
                <Text style={[styles.cellText, styles.earningsCol, styles.earningText]}>
                  ${item.totalEarnings.toFixed(2)}
                </Text>
                <View style={[styles.cell, styles.statusCol]}>
                  <Switch
                    value={item.isActive}
                    onValueChange={() => handleToggleActive(item)}
                    trackColor={{ false: '#374151', true: '#7c3aed' }}
                    thumbColor={item.isActive ? '#a855f7' : '#6b7280'}
                  />
                </View>
                <View style={[styles.cell, styles.actionsCol]}>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => {}} activeOpacity={0.7}>
                    <MaterialCommunityIcons name="pencil" size={18} color="#3b82f6" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(item.id)} activeOpacity={0.7}>
                    <MaterialCommunityIcons name="delete-outline" size={18} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        </View>
      )}

      <FAB
        icon="plus"
        label="Upload Set"
        onPress={() => setModalVisible(true)}
        color="#a855f7"
      />

      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Set</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <MaterialCommunityIcons name="close" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.modalBody}>
              <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Set title" placeholderTextColor="#4b5563" />
              <TextInput style={[styles.input, { minHeight: 80 }]} value={description} onChangeText={setDescription} placeholder="Description" placeholderTextColor="#4b5563" multiline textAlignVertical="top" />
              <TextInput style={styles.input} value={previewUrl} onChangeText={setPreviewUrl} placeholder="Preview URL (audio)" placeholderTextColor="#4b5563" autoCapitalize="none" />
              <TextInput style={styles.input} value={coverImage} onChangeText={setCoverImage} placeholder="Cover image URL" placeholderTextColor="#4b5563" autoCapitalize="none" />
              <Text style={styles.modalLabel}>Access</Text>
              <View style={styles.chipRow}>
                {(['free', 'paid', 'subscription'] as const).map((t) => (
                  <TouchableOpacity key={t} style={[styles.chip, accessType === t && styles.chipActive]} onPress={() => setAccessType(t)}>
                    <Text style={[styles.chipText, accessType === t && styles.chipTextActive]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {accessType === 'paid' && (
                <TextInput style={styles.input} value={price} onChangeText={setPrice} placeholder="Price" placeholderTextColor="#4b5563" keyboardType="decimal-pad" />
              )}
              <Button label={saving ? 'Publishing...' : 'Publish Set'} onPress={submitSet} loading={saving} fullWidth />
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Snackbar message={snackbar} visible={!!snackbar} onDismiss={() => setSnackbar('')} type={snackType} />
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0a0a0f' },
  tableContainer: { flex: 1 },
  tableHeader: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 14,
    backgroundColor: '#12121a', borderBottomWidth: 1, borderBottomColor: '#1e1e2e',
  },
  headerCell: { color: '#4b5563', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  tableRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 14,
    borderBottomWidth: 1, borderBottomColor: '#1a1a2e',
  },
  cell: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cellText: { color: '#9ca3af', fontSize: 13 },
  titleCol: { flex: 3 },
  genreCol: { flex: 1 },
  bpmCol: { flex: 1, textAlign: 'right' },
  priceCol: { flex: 1, textAlign: 'right' },
  salesCol: { flex: 1, textAlign: 'right' },
  earningsCol: { flex: 1, textAlign: 'right' },
  statusCol: { flex: 1, justifyContent: 'center' },
  actionsCol: { flex: 1, justifyContent: 'flex-end' },
  priceText: { color: '#10b981', fontWeight: '600' },
  earningText: { color: '#a855f7', fontWeight: '600' },
  setIconWrap: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#1a0f2e', justifyContent: 'center', alignItems: 'center' },
  setTitleGroup: { flex: 1 },
  setTitle: { color: '#f3f4f6', fontSize: 13, fontWeight: '600' },
  setDuration: { color: '#6b7280', fontSize: 11 },
  actionBtn: { padding: 6 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', justifyContent: 'center', padding: 24 },
  modalCard: { maxHeight: '88%', backgroundColor: '#12121a', borderRadius: 18, borderWidth: 1, borderColor: '#263241', padding: 18, maxWidth: 520, alignSelf: 'center', width: '100%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: '900' },
  closeBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#1f1f2e', alignItems: 'center', justifyContent: 'center' },
  modalBody: { gap: 10 },
  input: { backgroundColor: '#0a0a0f', borderWidth: 1, borderColor: '#2d2d3d', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: '#fff', fontSize: 14 },
  modalLabel: { color: '#9ca3af', fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 4 },
  chipRow: { flexDirection: 'row', gap: 6 },
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, borderWidth: 1, borderColor: '#2d2d3d', backgroundColor: '#0a0a0f' },
  chipActive: { borderColor: '#a855f7', backgroundColor: 'rgba(168,85,247,0.12)' },
  chipText: { color: '#9ca3af', fontSize: 12, fontWeight: '700' },
  chipTextActive: { color: '#a855f7' },
});

export default DJSetsScreen;
