import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ProfileStackParamList } from '../../navigation/stacks/ProfileStack';
import apiClient from '../../api/client';
import PageHeader from '../../components/layout/PageHeader';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'BlockedUsers'>;

export default function BlockedUsersScreen() {
  const navigation = useNavigation<Nav>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get('/users/me/blocked')
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <View style={styles.container}>
      <PageHeader
        title="Blocked Users"
        showBack
        onBack={() => navigation.goBack()}
      />
      <View style={styles.body}>
        {loading ? (
          <LoadingSpinner />
        ) : (
          <EmptyState
            icon="account-cancel-outline"
            title="No blocked users"
            message="Users you block will appear here"
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f' },
  body: { flex: 1 },
});
