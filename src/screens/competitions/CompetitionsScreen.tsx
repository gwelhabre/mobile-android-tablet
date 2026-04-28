import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CompetitionsStackParamList } from '../../navigation/stacks/CompetitionsStack';
import PageHeader from '../../components/layout/PageHeader';
import Badge from '../../components/common/Badge';
import Card from '../../components/common/Card';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import Snackbar from '../../components/common/Snackbar';
import { getCompetitions } from '../../api/rankings';
import { Competition } from '../../types';

type NavProp = NativeStackNavigationProp<CompetitionsStackParamList, 'Competitions'>;

const statusColors: Record<string, string> = {
  upcoming: '#3b82f6', open: '#10b981', voting: '#a855f7', ended: '#6b7280',
};

const formatColors: Record<string, string> = {
  online: '#06b6d4', live: '#ef4444', hybrid: '#f59e0b',
};

const CompetitionCard: React.FC<{ competition: Competition; onPress: () => void }> = ({
  competition, onPress,
}) => {
  const startDate = new Date(competition.startDate);
  const endDate = new Date(competition.endDate);
  const daysLeft = Math.max(0, Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

  return (
    <Card onPress={onPress} style={styles.compCard}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderBg} />
        <View style={styles.cardHeaderContent}>
          <Badge label={competition.format.toUpperCase()} color={formatColors[competition.format]} small />
          <Badge label={competition.status.toUpperCase()} color={statusColors[competition.status]} small />
        </View>
        <View style={styles.prizeArea}>
          <MaterialCommunityIcons name="trophy" size={20} color="#f59e0b" />
          <Text style={styles.prizeAmount}>${competition.prizePool.toLocaleString()}</Text>
        </View>
      </View>

      {/* Info */}
      <View style={styles.compInfo}>
        <Text style={styles.compTitle} numberOfLines={2}>{competition.title}</Text>
        {competition.genre && (
          <Badge label={competition.genre} color="#a855f7" small />
        )}
        <Text style={styles.compDesc} numberOfLines={2}>{competition.description}</Text>

        <View style={styles.compMeta}>
          <View style={styles.metaItem}>
            <MaterialCommunityIcons name="account-multiple" size={13} color="#6b7280" />
            <Text style={styles.metaText}>{competition.entryCount} entries</Text>
          </View>
          {competition.maxEntries && (
            <View style={styles.metaItem}>
              <MaterialCommunityIcons name="account-check" size={13} color="#6b7280" />
              <Text style={styles.metaText}>Max: {competition.maxEntries}</Text>
            </View>
          )}
          {competition.status !== 'ended' && (
            <View style={styles.metaItem}>
              <MaterialCommunityIcons name="clock-outline" size={13} color={daysLeft <= 3 ? '#ef4444' : '#6b7280'} />
              <Text style={[styles.metaText, daysLeft <= 3 && styles.urgentText]}>
                {daysLeft}d left
              </Text>
            </View>
          )}
        </View>

        <View style={styles.compDates}>
          <Text style={styles.dateText}>
            {startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} —{' '}
            {endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </Text>
        </View>
      </View>
    </Card>
  );
};

const CompetitionsScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [snackbar, setSnackbar] = useState('');

  const fetchCompetitions = useCallback(async () => {
    try {
      const data = await getCompetitions(filter !== 'all' ? filter : undefined);
      setCompetitions(data);
    } catch {
      setSnackbar('Failed to load competitions');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  useEffect(() => {
    setLoading(true);
    fetchCompetitions();
  }, [fetchCompetitions]);

  const FILTERS = ['all', 'upcoming', 'open', 'voting', 'ended'];

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <View style={styles.root}>
      <PageHeader
        title="Competitions"
        subtitle={`${competitions.length} competitions`}
        actions={[{ icon: 'home', onPress: () => navigation.dispatch(DrawerActions.jumpTo('HomeStack' as any)) }]}
      />

      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
            onPress={() => setFilter(f)}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {competitions.length === 0 ? (
        <EmptyState icon="tournament" title="No competitions" message="No competitions available right now" />
      ) : (
        <FlatList
          data={competitions}
          keyExtractor={(c) => c.id}
          numColumns={3}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.content}
          renderItem={({ item }) => (
            <View style={styles.cardWrap}>
              <CompetitionCard
                competition={item}
                onPress={() => navigation.navigate('CompetitionDetail', { competitionId: item.id })}
              />
            </View>
          )}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchCompetitions(); }} tintColor="#a855f7" />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      <Snackbar message={snackbar} visible={!!snackbar} onDismiss={() => setSnackbar('')} type="error" />
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0a0a0f' },
  filterRow: {
    flexDirection: 'row', gap: 6, paddingHorizontal: 14, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#1e1e2e',
  },
  filterChip: { paddingVertical: 5, paddingHorizontal: 14, borderRadius: 20, backgroundColor: '#12121a', borderWidth: 1, borderColor: '#1e1e2e' },
  filterChipActive: { backgroundColor: 'rgba(168,85,247,0.15)', borderColor: '#a855f7' },
  filterText: { color: '#6b7280', fontSize: 12, fontWeight: '500' },
  filterTextActive: { color: '#a855f7', fontWeight: '600' },
  content: { padding: 12, paddingBottom: 80 },
  row: { gap: 12, marginBottom: 12 },
  cardWrap: { flex: 1 },
  compCard: { overflow: 'hidden', padding: 0 },
  cardHeader: {
    height: 80, position: 'relative',
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    padding: 10,
  },
  cardHeaderBg: { ...StyleSheet.absoluteFillObject, backgroundColor: '#1a0f2e' },
  cardHeaderContent: { flexDirection: 'row', gap: 5, flexWrap: 'wrap', flex: 1 },
  prizeArea: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4,
  },
  prizeAmount: { color: '#f59e0b', fontSize: 13, fontWeight: '700' },
  compInfo: { padding: 12, gap: 6 },
  compTitle: { color: '#f3f4f6', fontSize: 14, fontWeight: '700', lineHeight: 19 },
  compDesc: { color: '#6b7280', fontSize: 11, lineHeight: 15 },
  compMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: { color: '#6b7280', fontSize: 11 },
  urgentText: { color: '#ef4444', fontWeight: '600' },
  compDates: { marginTop: 2 },
  dateText: { color: '#4b5563', fontSize: 10 },
});

export default CompetitionsScreen;
