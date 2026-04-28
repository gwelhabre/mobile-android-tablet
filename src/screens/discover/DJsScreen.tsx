import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import PageHeader from '../../components/layout/PageHeader';
import TwoPane from '../../components/layout/TwoPane';
import DJCard from '../../components/dj/DJCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import Snackbar from '../../components/common/Snackbar';
import DJProfileDetail from './DJProfileScreen';
import { getDJs, searchDJs } from '../../api/dj';
import { DJProfile } from '../../types';

const DJsScreen: React.FC = () => {
  const navigation = useNavigation();
  const [djs, setDJs] = useState<DJProfile[]>([]);
  const [selectedDJ, setSelectedDJ] = useState<DJProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [snackbar, setSnackbar] = useState('');

  const fetchDJs = useCallback(async () => {
    try {
      const data = await getDJs();
      setDJs(data);
      if (data.length > 0 && !selectedDJ) setSelectedDJ(data[0]);
    } catch {
      setSnackbar('Failed to load DJs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchDJs(); }, [fetchDJs]);

  const handleSearch = useCallback(async (q: string) => {
    setSearchQuery(q);
    if (!q.trim()) {
      fetchDJs();
      return;
    }
    setSearching(true);
    try {
      const results = await searchDJs(q.trim());
      setDJs(results);
    } catch {
      setSnackbar('Search failed');
    } finally {
      setSearching(false);
    }
  }, [fetchDJs]);

  if (loading) return <LoadingSpinner fullScreen />;

  const leftContent = (
    <View style={styles.leftContainer}>
      {/* Search */}
      <View style={styles.searchBar}>
        <MaterialCommunityIcons name="magnify" size={20} color="#6b7280" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search DJs..."
          placeholderTextColor="#4b5563"
          value={searchQuery}
          onChangeText={handleSearch}
        />
        {searching && <MaterialCommunityIcons name="loading" size={18} color="#a855f7" />}
        {searchQuery ? (
          <TouchableOpacity onPress={() => handleSearch('')} activeOpacity={0.7}>
            <MaterialCommunityIcons name="close-circle" size={18} color="#6b7280" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* DJs Grid (2 columns) */}
      <FlatList
        data={djs}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        renderItem={({ item }) => (
          <View style={styles.djCardWrap}>
            <DJCard
              dj={item}
              onPress={() => setSelectedDJ(item)}
              isSelected={selectedDJ?.id === item.id}
            />
          </View>
        )}
        ListEmptyComponent={
          <EmptyState
            icon="account-music-outline"
            title="No DJs found"
            message={searchQuery ? `No results for "${searchQuery}"` : 'No DJs available'}
          />
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchDJs(); }} tintColor="#a855f7" />}
        showsVerticalScrollIndicator={false}
        scrollEnabled={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );

  const rightContent = selectedDJ ? (
    <DJProfileDetail djId={selectedDJ.id} djData={selectedDJ} />
  ) : (
    <EmptyState icon="account-music-outline" title="Select a DJ" message="Choose a DJ from the left to view their profile" />
  );

  return (
    <View style={styles.root}>
      <PageHeader
        title="Discover DJs"
        subtitle={`${djs.length} DJs available`}
        actions={[{ icon: 'home', onPress: () => navigation.dispatch(DrawerActions.jumpTo('HomeStack' as any)) }]}
      />
      <TwoPane
        leftContent={leftContent}
        rightContent={rightContent}
        leftFlex={2}
        rightFlex={3}
        scrollLeft={true}
        scrollRight={true}
      />
      <Snackbar message={snackbar} visible={!!snackbar} onDismiss={() => setSnackbar('')} type="error" />
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0a0a0f' },
  leftContainer: { gap: 12 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#0a0a0f', borderRadius: 12, borderWidth: 1.5,
    borderColor: '#1e1e2e', paddingHorizontal: 14, paddingVertical: 10,
    marginBottom: 4,
  },
  searchInput: { flex: 1, color: '#f3f4f6', fontSize: 14 },
  row: { gap: 8 },
  djCardWrap: { flex: 1 },
});

export default DJsScreen;
