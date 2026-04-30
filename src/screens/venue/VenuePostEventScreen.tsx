import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { createEvent } from '../../api/events';
import { getMyVenues } from '../../api/rankings';
import { getDJs } from '../../api/dj';
import { DJProfile } from '../../types';
import { isValidDateString, isValidTimeString } from '../../utils/validators';
import Header from '../../components/common/Header';

interface Venue {
  id: string;
  name: string;
  city: string | null;
}

const VenuePostEventScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  const [venues, setVenues] = useState<Venue[]>([]);
  const [selectedVenueId, setSelectedVenueId] = useState('');

  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [entryInfo, setEntryInfo] = useState('');
  const [genres, setGenres] = useState('');
  const [description, setDescription] = useState('');

  const [djQuery, setDjQuery] = useState('');
  const [djResults, setDjResults] = useState<DJProfile[]>([]);
  const [djSearching, setDjSearching] = useState(false);
  const [selectedDj, setSelectedDj] = useState<DJProfile | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    getMyVenues()
      .then(data => {
        setVenues(data);
        if (data.length > 0) setSelectedVenueId(data[0].id);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!djQuery.trim() || djQuery.length < 2) {
      setDjResults([]);
      return;
    }
    let cancelled = false;
    debounceRef.current = setTimeout(async () => {
      if (cancelled) return;
      setDjSearching(true);
      try {
        const data = await getDJs(djQuery.trim());
        if (!cancelled) setDjResults(data.slice(0, 8));
      } catch {
        if (!cancelled) setDjResults([]);
      } finally {
        if (!cancelled) setDjSearching(false);
      }
    }, 350);
    return () => {
      cancelled = true;
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [djQuery]);

  const buildIso = (date: string, time: string): string | undefined => {
    if (!date.trim()) return undefined;
    const t = time.trim() || '00:00';
    return `${date.trim()}T${t}:00`;
  };

  const handleSubmit = async () => {
    if (submitting) return; // re-entrancy guard
    if (!title.trim()) { Alert.alert('Error', 'Event title is required.'); return; }
    if (!selectedDj) { Alert.alert('Error', 'Please select a DJ.'); return; }
    if (!selectedVenueId) { Alert.alert('Error', 'No venue found. Make sure you have a venue profile.'); return; }
    if (!startDate.trim()) { Alert.alert('Error', 'Start date is required (YYYY-MM-DD).'); return; }
    if (!isValidDateString(startDate.trim())) { Alert.alert('Invalid date', 'Use YYYY-MM-DD format with a real date.'); return; }
    if (startTime.trim() && !isValidTimeString(startTime.trim())) { Alert.alert('Invalid time', 'Use HH:MM (24-hour) format.'); return; }
    if (endDate.trim() && !isValidDateString(endDate.trim())) { Alert.alert('Invalid end date', 'Use YYYY-MM-DD format with a real date.'); return; }
    if (endTime.trim() && !isValidTimeString(endTime.trim())) { Alert.alert('Invalid end time', 'Use HH:MM (24-hour) format.'); return; }

    const startIso = buildIso(startDate, startTime);
    if (!startIso) { Alert.alert('Error', 'Invalid start date.'); return; }
    const endIso = buildIso(endDate, endTime);

    const genreList = genres.split(',').map(g => g.trim()).filter(Boolean);

    setSubmitting(true);
    try {
      await createEvent({
        title: title.trim(),
        venueId: selectedVenueId,
        djId: String(selectedDj.id),
        startTime: startIso,
        endTime: endIso,
        description: description.trim() || undefined,
        entryInfo: entryInfo.trim() || undefined,
        genres: genreList.length > 0 ? genreList : undefined,
      });
      Alert.alert('Event Created!', 'Your event is now live on Disk Rider.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? 'Failed to create event. Please try again.';
      Alert.alert('Error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <Header title="Post Event" showBack />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

        {/* Event Details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Event Details</Text>

          <Text style={styles.label}>Title *</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Saturday Night Sessions"
            placeholderTextColor="#4b5563"
          />

          {venues.length > 1 && (
            <>
              <Text style={styles.label}>Venue</Text>
              <View style={styles.venueRow}>
                {venues.map(v => (
                  <TouchableOpacity
                    key={v.id}
                    style={[styles.venueChip, selectedVenueId === v.id && styles.venueChipActive]}
                    onPress={() => setSelectedVenueId(v.id)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.venueChipText, selectedVenueId === v.id && styles.venueChipTextActive]}>
                      {v.name}{v.city ? ` · ${v.city}` : ''}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          <View style={styles.row}>
            <View style={styles.halfField}>
              <Text style={styles.label}>Start Date *</Text>
              <TextInput
                style={styles.input}
                value={startDate}
                onChangeText={setStartDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#4b5563"
                keyboardType="numbers-and-punctuation"
              />
            </View>
            <View style={styles.halfField}>
              <Text style={styles.label}>Start Time</Text>
              <TextInput
                style={styles.input}
                value={startTime}
                onChangeText={setStartTime}
                placeholder="HH:MM"
                placeholderTextColor="#4b5563"
                keyboardType="numbers-and-punctuation"
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.halfField}>
              <Text style={styles.label}>End Date</Text>
              <TextInput
                style={styles.input}
                value={endDate}
                onChangeText={setEndDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#4b5563"
                keyboardType="numbers-and-punctuation"
              />
            </View>
            <View style={styles.halfField}>
              <Text style={styles.label}>End Time</Text>
              <TextInput
                style={styles.input}
                value={endTime}
                onChangeText={setEndTime}
                placeholder="HH:MM"
                placeholderTextColor="#4b5563"
                keyboardType="numbers-and-punctuation"
              />
            </View>
          </View>

          <Text style={styles.label}>Entry Info</Text>
          <TextInput
            style={styles.input}
            value={entryInfo}
            onChangeText={setEntryInfo}
            placeholder="e.g. Advance: $25 | Door: $35"
            placeholderTextColor="#4b5563"
          />

          <Text style={styles.label}>Genres</Text>
          <TextInput
            style={styles.input}
            value={genres}
            onChangeText={setGenres}
            placeholder="e.g. Techno, Afro House, Deep House"
            placeholderTextColor="#4b5563"
          />
          <Text style={styles.hint}>Comma-separated</Text>

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Describe the event…"
            placeholderTextColor="#4b5563"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* DJ Search */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Select DJ *</Text>

          {selectedDj ? (
            <View style={styles.selectedDjRow}>
              <View style={styles.djAvatar}>
                <Text style={styles.djAvatarText}>{selectedDj.stageName.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.djInfo}>
                <Text style={styles.djName}>{selectedDj.stageName}</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedDj(null)}>
                <Text style={styles.changeBtn}>Change</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.searchBar}>
                <Ionicons name="search-outline" size={16} color="#6b7280" />
                <TextInput
                  style={styles.searchInput}
                  value={djQuery}
                  onChangeText={setDjQuery}
                  placeholder="Search DJ by name…"
                  placeholderTextColor="#4b5563"
                  autoCapitalize="none"
                />
                {djSearching && <ActivityIndicator size="small" color="#a855f7" />}
              </View>

              {djResults.length > 0 && (
                <View style={styles.djList}>
                  {djResults.map(dj => (
                    <TouchableOpacity
                      key={String(dj.id)}
                      style={styles.djRow}
                      onPress={() => { setSelectedDj(dj); setDjQuery(''); setDjResults([]); }}
                      activeOpacity={0.7}
                    >
                      <View style={styles.djAvatar}>
                        <Text style={styles.djAvatarText}>{dj.stageName.charAt(0).toUpperCase()}</Text>
                      </View>
                      <View style={styles.djInfo}>
                        <Text style={styles.djName}>{dj.stageName}</Text>
                        {dj.genres?.length > 0 && (
                          <Text style={styles.djGenre}>{dj.genres.slice(0, 2).join(', ')}</Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {djQuery.length >= 2 && !djSearching && djResults.length === 0 && (
                <Text style={styles.noResults}>No DJs found for "{djQuery}"</Text>
              )}
            </>
          )}
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, (submitting || !title.trim() || !selectedDj || !startDate.trim()) && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={submitting || !title.trim() || !selectedDj || !startDate.trim()}
          activeOpacity={0.8}
        >
          {submitting
            ? <ActivityIndicator size="small" color="#fff" />
            : <Text style={styles.submitBtnText}>Create Event</Text>
          }
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0a0a0f' },
  container: { padding: 16, paddingBottom: 40, gap: 16 },
  card: {
    backgroundColor: '#12121a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1f1f2e',
    padding: 16,
    gap: 10,
  },
  cardTitle: { color: '#e5e7eb', fontSize: 15, fontWeight: '700', marginBottom: 4 },
  label: { color: '#9ca3af', fontSize: 12, fontWeight: '600', marginBottom: -4 },
  hint: { color: '#4b5563', fontSize: 11, marginTop: -6 },
  input: {
    backgroundColor: '#0a0a0f',
    borderWidth: 1,
    borderColor: '#1f1f2e',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#f3f4f6',
    fontSize: 14,
  },
  textArea: { minHeight: 72 },
  row: { flexDirection: 'row', gap: 10 },
  halfField: { flex: 1, gap: 4 },
  venueRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  venueChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#0a0a0f',
    borderWidth: 1,
    borderColor: '#1f1f2e',
  },
  venueChipActive: { backgroundColor: 'rgba(168,85,247,0.15)', borderColor: '#a855f7' },
  venueChipText: { color: '#6b7280', fontSize: 13 },
  venueChipTextActive: { color: '#a855f7', fontWeight: '600' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0a0a0f',
    borderWidth: 1,
    borderColor: '#1f1f2e',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: { flex: 1, color: '#f3f4f6', fontSize: 14, padding: 0 },
  djList: {
    borderWidth: 1,
    borderColor: '#1f1f2e',
    borderRadius: 10,
    overflow: 'hidden',
  },
  djRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a2e',
  },
  selectedDjRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(168,85,247,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.3)',
    borderRadius: 12,
    padding: 12,
  },
  djAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#3b0764',
    justifyContent: 'center',
    alignItems: 'center',
  },
  djAvatarText: { color: '#e9d5ff', fontSize: 16, fontWeight: '700' },
  djInfo: { flex: 1 },
  djName: { color: '#f3f4f6', fontSize: 14, fontWeight: '600' },
  djGenre: { color: '#6b7280', fontSize: 12, marginTop: 1 },
  changeBtn: { color: '#a855f7', fontSize: 13, fontWeight: '600' },
  noResults: { color: '#4b5563', fontSize: 13, textAlign: 'center', paddingVertical: 8 },
  submitBtn: {
    backgroundColor: '#a855f7',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnDisabled: { opacity: 0.45 },
  submitBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});

export default VenuePostEventScreen;
