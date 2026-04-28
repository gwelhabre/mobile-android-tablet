import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { CompetitionsStackParamList } from '../../navigation/stacks/CompetitionsStack';
import PageHeader from '../../components/layout/PageHeader';
import TwoPane from '../../components/layout/TwoPane';
import Avatar from '../../components/common/Avatar';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Snackbar from '../../components/common/Snackbar';
import { getCompetitionById, voteInCompetition } from '../../api/rankings';
import { Competition, CompetitionEntry } from '../../types';
import { useAuth } from '../../context/AuthContext';

type RouteType = RouteProp<CompetitionsStackParamList, 'CompetitionDetail'>;

const CompetitionDetailScreen: React.FC = () => {
  const route = useRoute<RouteType>();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { competitionId } = route.params;

  const [competition, setCompetition] = useState<Competition | null>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState<string | null>(null);
  const [voted, setVoted] = useState<Set<string>>(new Set());
  const [snackbar, setSnackbar] = useState('');
  const [snackType, setSnackType] = useState<'default' | 'success' | 'error'>('default');

  useEffect(() => {
    getCompetitionById(competitionId)
      .then(setCompetition)
      .catch(() => setSnackbar('Failed to load competition'))
      .finally(() => setLoading(false));
  }, [competitionId]);

  const handleVote = async (entryId: string) => {
    if (!competition || voted.has(entryId)) return;
    setVoting(entryId);
    try {
      await voteInCompetition(competition.id, entryId);
      setVoted((prev) => new Set(prev).add(entryId));
      setCompetition((prev) => prev ? {
        ...prev,
        entries: prev.entries?.map((e) => e.id === entryId ? { ...e, votes: e.votes + 1 } : e),
      } : prev);
      setSnackbar('Vote cast successfully!');
      setSnackType('success');
    } catch {
      setSnackbar('Voting failed');
      setSnackType('error');
    } finally {
      setVoting(null);
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;
  if (!competition) return null;

  const statusColors: Record<string, string> = {
    upcoming: '#3b82f6', open: '#10b981', voting: '#a855f7', ended: '#6b7280',
  };

  const sortedEntries = [...(competition.entries || [])].sort((a, b) => b.votes - a.votes);

  const leftContent = (
    <View style={styles.leftContainer}>
      {/* Cover */}
      <View style={styles.coverArea}>
        <View style={styles.coverBg} />
        <View style={styles.coverContent}>
          <Badge label={competition.status.toUpperCase()} color={statusColors[competition.status]} />
          <Badge label={competition.format.toUpperCase()} color="#06b6d4" />
        </View>
      </View>

      {/* Title & Prize */}
      <Text style={styles.compTitle}>{competition.title}</Text>
      <View style={styles.prizeRow}>
        <MaterialCommunityIcons name="trophy" size={20} color="#f59e0b" />
        <Text style={styles.prizeAmount}>${competition.prizePool.toLocaleString()}</Text>
        <Text style={styles.prizeLabel}>Prize Pool</Text>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{competition.entryCount}</Text>
          <Text style={styles.statLabel}>Entries</Text>
        </View>
        {competition.maxEntries && (
          <>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{competition.maxEntries}</Text>
              <Text style={styles.statLabel}>Max</Text>
            </View>
          </>
        )}
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>{competition.genre || 'Any'}</Text>
          <Text style={styles.statLabel}>Genre</Text>
        </View>
      </View>

      {/* Dates */}
      <Card style={styles.datesCard} outlined>
        <View style={styles.dateRow}>
          <MaterialCommunityIcons name="calendar-start" size={16} color="#3b82f6" />
          <Text style={styles.dateLabel}>Opens:</Text>
          <Text style={styles.dateValue}>
            {new Date(competition.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </Text>
        </View>
        <View style={styles.dateRow}>
          <MaterialCommunityIcons name="calendar-end" size={16} color="#ef4444" />
          <Text style={styles.dateLabel}>Closes:</Text>
          <Text style={styles.dateValue}>
            {new Date(competition.endDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </Text>
        </View>
      </Card>

      {/* Description */}
      <Text style={styles.description}>{competition.description}</Text>

      {/* Prizes */}
      {competition.prizes && competition.prizes.length > 0 && (
        <View style={styles.prizesSection}>
          <Text style={styles.sectionTitle}>Prize Distribution</Text>
          {competition.prizes.map((p) => (
            <View key={p.position} style={styles.prizeItem}>
              <View style={styles.positionBadge}>
                <Text style={styles.positionText}>{p.position}</Text>
              </View>
              <Text style={styles.prizeDesc}>{p.description}</Text>
              <Text style={styles.prizeVal}>${p.amount.toLocaleString()}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Entry Button */}
      {(competition.status === 'open') && user?.role === 'dj' && (
        <Button
          label="Enter Competition"
          onPress={() => {
            setSnackbar('Entry submitted! Select a set in your profile.');
            setSnackType('success');
          }}
          icon="plus-circle"
          fullWidth
          size="lg"
          style={{ marginTop: 8 }}
        />
      )}
    </View>
  );

  const rightContent = (
    <View style={styles.rightContainer}>
      <Text style={styles.leaderboardTitle}>Leaderboard</Text>
      {sortedEntries.length === 0 ? (
        <View style={styles.emptyLeaderboard}>
          <MaterialCommunityIcons name="account-group-outline" size={36} color="#374151" />
          <Text style={styles.emptyText}>No entries yet</Text>
        </View>
      ) : (
        <FlatList
          data={sortedEntries}
          keyExtractor={(e) => e.id}
          scrollEnabled={false}
          contentContainerStyle={{ gap: 8 }}
          renderItem={({ item, index }) => (
            <View style={[styles.entryRow, index === 0 && styles.topEntry]}>
              <View style={[styles.entryRank, index < 3 && styles.topRank]}>
                {index === 0 ? (
                  <MaterialCommunityIcons name="crown" size={16} color="#f59e0b" />
                ) : (
                  <Text style={styles.rankNum}>{index + 1}</Text>
                )}
              </View>
              <Avatar uri={item.djAvatarUrl} name={item.djName} size={38} />
              <View style={styles.entryInfo}>
                <Text style={styles.entryDJ}>{item.djName}</Text>
                <Text style={styles.entrySet}>{item.setTitle}</Text>
              </View>
              <View style={styles.entryRight}>
                <Text style={styles.voteCount}>{item.votes} votes</Text>
                {competition.status === 'voting' && !voted.has(item.id) && (
                  <TouchableOpacity
                    style={styles.voteBtn}
                    onPress={() => handleVote(item.id)}
                    disabled={voting === item.id}
                    activeOpacity={0.75}
                  >
                    <MaterialCommunityIcons name="thumb-up" size={14} color="#a855f7" />
                    <Text style={styles.voteBtnText}>Vote</Text>
                  </TouchableOpacity>
                )}
                {voted.has(item.id) && (
                  <Badge label="Voted" color="#10b981" small />
                )}
              </View>
            </View>
          )}
        />
      )}
    </View>
  );

  return (
    <View style={styles.root}>
      <PageHeader
        title={competition.title}
        subtitle="Competition Details"
        showBack
        onBack={() => navigation.goBack()}
      />
      <TwoPane
        leftContent={leftContent}
        rightContent={rightContent}
        leftFlex={2}
        rightFlex={3}
      />
      <Snackbar message={snackbar} visible={!!snackbar} onDismiss={() => setSnackbar('')} type={snackType} />
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0a0a0f' },
  leftContainer: { gap: 14 },
  rightContainer: { gap: 12 },
  coverArea: { height: 100, borderRadius: 14, overflow: 'hidden', position: 'relative' },
  coverBg: { ...StyleSheet.absoluteFillObject, backgroundColor: '#1a0f2e' },
  coverContent: { flex: 1, flexDirection: 'row', gap: 8, padding: 12, alignItems: 'flex-end' },
  compTitle: { color: '#f3f4f6', fontSize: 20, fontWeight: '800', lineHeight: 26 },
  prizeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  prizeAmount: { color: '#f59e0b', fontSize: 22, fontWeight: '800' },
  prizeLabel: { color: '#6b7280', fontSize: 13 },
  statsRow: {
    flexDirection: 'row', backgroundColor: '#12121a', borderRadius: 12,
    borderWidth: 1, borderColor: '#1e1e2e', padding: 12,
  },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  statValue: { color: '#f3f4f6', fontSize: 16, fontWeight: '700' },
  statLabel: { color: '#6b7280', fontSize: 11 },
  statDivider: { width: 1, backgroundColor: '#1e1e2e', marginHorizontal: 4 },
  datesCard: { gap: 10 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dateLabel: { color: '#6b7280', fontSize: 12, fontWeight: '600', width: 56 },
  dateValue: { color: '#f3f4f6', fontSize: 13, fontWeight: '500' },
  description: { color: '#9ca3af', fontSize: 14, lineHeight: 22 },
  prizesSection: { gap: 8 },
  sectionTitle: { color: '#9ca3af', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  prizeItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#1a1a2e' },
  positionBadge: { width: 28, height: 28, borderRadius: 7, backgroundColor: '#1a1a2e', justifyContent: 'center', alignItems: 'center' },
  positionText: { color: '#9ca3af', fontSize: 13, fontWeight: '700' },
  prizeDesc: { flex: 1, color: '#9ca3af', fontSize: 13 },
  prizeVal: { color: '#f59e0b', fontSize: 13, fontWeight: '700' },
  leaderboardTitle: { color: '#f3f4f6', fontSize: 18, fontWeight: '700' },
  emptyLeaderboard: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyText: { color: '#4b5563', fontSize: 13 },
  entryRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#12121a', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#1e1e2e',
  },
  topEntry: { borderColor: '#f59e0b40', backgroundColor: '#1a1500' },
  entryRank: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#1a1a2e', justifyContent: 'center', alignItems: 'center' },
  topRank: { backgroundColor: '#f59e0b20' },
  rankNum: { color: '#9ca3af', fontSize: 14, fontWeight: '700' },
  entryInfo: { flex: 1 },
  entryDJ: { color: '#f3f4f6', fontSize: 13, fontWeight: '600' },
  entrySet: { color: '#6b7280', fontSize: 11, marginTop: 2 },
  entryRight: { alignItems: 'flex-end', gap: 6 },
  voteCount: { color: '#a855f7', fontSize: 14, fontWeight: '700' },
  voteBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(168,85,247,0.15)', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: '#a855f740',
  },
  voteBtnText: { color: '#a855f7', fontSize: 12, fontWeight: '600' },
});

export default CompetitionDetailScreen;
