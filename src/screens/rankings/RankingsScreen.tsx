import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import PageHeader from '../../components/layout/PageHeader';
import RankingRow from '../../components/dj/RankingRow';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import Snackbar from '../../components/common/Snackbar';
import { getRankings } from '../../api/rankings';
import { RankingEntry } from '../../types';

const GENRES = ['All', 'House', 'Techno', 'Drum & Bass', 'Hip-Hop', 'Trance', 'Dubstep'];
const PERIODS = [
  { label: 'All Time', value: 'all_time' },
  { label: 'This Month', value: 'monthly' },
  { label: 'This Week', value: 'weekly' },
];

const FilterChip: React.FC<{ label: string; active: boolean; onPress: () => void }> = ({
  label, active, onPress,
}) => (
  <TouchableOpacity
    style={[styles.chip, active && styles.chipActive]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
  </TouchableOpacity>
);

const RankingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [selectedPeriod, setSelectedPeriod] = useState('all_time');
  const [snackbar, setSnackbar] = useState('');

  const fetchRankings = useCallback(async () => {
    try {
      const data = await getRankings(
        1, 100,
        selectedGenre !== 'All' ? selectedGenre : undefined,
        undefined,
        selectedPeriod
      );
      setRankings(data);
    } catch {
      setSnackbar('Failed to load rankings');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedGenre, selectedPeriod]);

  useEffect(() => {
    setLoading(true);
    fetchRankings();
  }, [fetchRankings]);

  const TableHeader = () => (
    <View style={styles.tableHeader}>
      <View style={styles.rankCol}>
        <Text style={styles.headerText}>#</Text>
      </View>
      <View style={styles.avatarSpacer} />
      <Text style={[styles.headerText, styles.djCol]}>DJ</Text>
      <Text style={[styles.headerText, styles.genreCol]}>Genre</Text>
      <Text style={[styles.headerText, styles.scoreCol]}>Score</Text>
      <Text style={[styles.headerText, styles.followersCol]}>Followers</Text>
      <Text style={[styles.headerText, styles.changeCol]}>Change</Text>
    </View>
  );

  return (
    <View style={styles.root}>
      <PageHeader
        title="DJ Rankings"
        subtitle={`Top ${rankings.length} DJs worldwide`}
        actions={[
          { icon: 'home', onPress: () => navigation.dispatch(DrawerActions.jumpTo('HomeStack' as any)) },
          { icon: 'refresh', onPress: () => { setRefreshing(true); fetchRankings(); } },
        ]}
      />

      {/* Filters */}
      <View style={styles.filtersArea}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          <View style={styles.filterGroup}>
            <MaterialCommunityIcons name="music-note" size={14} color="#6b7280" />
            {GENRES.map((g) => (
              <FilterChip
                key={g}
                label={g}
                active={selectedGenre === g}
                onPress={() => setSelectedGenre(g)}
              />
            ))}
          </View>
          <View style={styles.filterDivider} />
          <View style={styles.filterGroup}>
            <MaterialCommunityIcons name="calendar" size={14} color="#6b7280" />
            {PERIODS.map((p) => (
              <FilterChip
                key={p.value}
                label={p.label}
                active={selectedPeriod === p.value}
                onPress={() => setSelectedPeriod(p.value)}
              />
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Table */}
      <View style={styles.tableContainer}>
        <TableHeader />
        {loading ? (
          <LoadingSpinner message="Loading rankings..." />
        ) : rankings.length === 0 ? (
          <EmptyState icon="trophy-outline" title="No rankings available" />
        ) : (
          <FlatList
            data={rankings}
            keyExtractor={(item) => item.djId}
            renderItem={({ item }) => <RankingRow entry={item} />}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => { setRefreshing(true); fetchRankings(); }}
                tintColor="#a855f7"
              />
            }
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 80 }}
          />
        )}
      </View>

      <Snackbar message={snackbar} visible={!!snackbar} onDismiss={() => setSnackbar('')} type="error" />
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0a0a0f' },
  filtersArea: {
    borderBottomWidth: 1, borderBottomColor: '#1e1e2e', backgroundColor: '#12121a',
  },
  filterRow: { paddingHorizontal: 16, paddingVertical: 10, gap: 6, alignItems: 'center' },
  filterGroup: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  filterDivider: { width: 1, height: 24, backgroundColor: '#1e1e2e', marginHorizontal: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    backgroundColor: '#1e1e2e', borderWidth: 1, borderColor: 'transparent',
  },
  chipActive: { backgroundColor: 'rgba(168,85,247,0.2)', borderColor: '#a855f7' },
  chipText: { color: '#6b7280', fontSize: 13, fontWeight: '500' },
  chipTextActive: { color: '#a855f7', fontWeight: '600' },
  tableContainer: { flex: 1 },
  tableHeader: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 16,
    backgroundColor: '#12121a', borderBottomWidth: 1, borderBottomColor: '#1e1e2e',
    gap: 12,
  },
  headerText: { color: '#4b5563', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, textAlign: 'right' },
  rankCol: { width: 36 },
  avatarSpacer: { width: 40 },
  djCol: { flex: 2, textAlign: 'left' },
  genreCol: { flex: 1, textAlign: 'left' },
  scoreCol: { flex: 1 },
  followersCol: { flex: 1 },
  changeCol: { width: 50 },
});

export default RankingsScreen;
