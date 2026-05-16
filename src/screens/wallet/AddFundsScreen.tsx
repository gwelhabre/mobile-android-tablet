import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import PageHeader from '../../components/layout/PageHeader';
import Button from '../../components/common/Button';
import Snackbar from '../../components/common/Snackbar';
import { getRidesPackages, createCheckout } from '../../api/wallet';
import { RidesPackage } from '../../types';

const AddFundsScreen: React.FC = () => {
  const navigation = useNavigation();
  const [packages, setPackages] = useState<RidesPackage[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loadingPackages, setLoadingPackages] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState('');
  const [snackType, setSnackType] = useState<'default' | 'success' | 'error'>('default');

  useEffect(() => {
    getRidesPackages()
      .then((items) => {
        setPackages(items);
        if (items.length) setSelectedId(items[0].id);
      })
      .catch(() => {
        setSnackbar('Could not load Rides packages.');
        setSnackType('error');
      })
      .finally(() => setLoadingPackages(false));
  }, []);

  const selected = packages.find((p) => p.id === selectedId) ?? null;

  const handleCheckout = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      const { url } = await createCheckout(selected.id);
      const returnUrl = Linking.createURL('wallet/topup-complete');
      const result = await WebBrowser.openAuthSessionAsync(url, returnUrl);
      if (result.type === 'success') {
        setSnackbar(`${selected.ridesAmount} Rides will appear once Whish confirms.`);
        setSnackType('success');
        setTimeout(() => navigation.goBack(), 2000);
      }
    } catch {
      setSnackbar('Could not start Whish checkout. Try again.');
      setSnackType('error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.root}>
      <PageHeader
        title="Add Funds"
        subtitle="Top up your Disk Rider wallet via Whish"
        showBack
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.centerCard}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pick a Rides Package</Text>
            {loadingPackages ? (
              <ActivityIndicator color="#a855f7" />
            ) : packages.length === 0 ? (
              <Text style={styles.empty}>No packages available.</Text>
            ) : (
              <View style={styles.packageList}>
                {packages.map((pkg) => {
                  const active = pkg.id === selectedId;
                  return (
                    <TouchableOpacity
                      key={pkg.id}
                      style={[styles.pkgRow, active && styles.pkgRowActive]}
                      onPress={() => setSelectedId(pkg.id)}
                      activeOpacity={0.75}
                    >
                      <View style={styles.pkgLeft}>
                        <MaterialCommunityIcons
                          name="diamond-stone"
                          size={20}
                          color={active ? '#fbbf24' : '#6b7280'}
                        />
                        <Text style={[styles.pkgAmount, active && styles.pkgAmountActive]}>
                          {pkg.ridesAmount.toLocaleString()} Rides
                        </Text>
                      </View>
                      <Text style={[styles.pkgPrice, active && styles.pkgPriceActive]}>
                        ${pkg.priceUsd.toFixed(2)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          <Button
            label={selected ? `Continue to Whish — $${selected.priceUsd.toFixed(2)}` : 'Pick a package'}
            onPress={handleCheckout}
            loading={submitting}
            disabled={!selected}
            fullWidth
            size="lg"
            icon="wallet-plus"
            style={styles.addBtn}
          />

          <View style={styles.notice}>
            <MaterialCommunityIcons name="lock" size={14} color="#93c5fd" />
            <Text style={styles.noticeText}>Payment is processed securely by Whish.</Text>
          </View>
        </View>
      </ScrollView>

      <Snackbar message={snackbar} visible={!!snackbar} onDismiss={() => setSnackbar('')} type={snackType} />
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0a0a0f' },
  content: { flexGrow: 1, padding: 20, alignItems: 'center' },
  centerCard: {
    width: '100%', maxWidth: 560,
    backgroundColor: '#12121a', borderRadius: 20, padding: 28,
    borderWidth: 1, borderColor: '#1e1e2e', gap: 20,
  },
  section: { gap: 14 },
  sectionTitle: { color: '#9ca3af', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  empty: { color: '#6b7280', fontSize: 14, textAlign: 'center', paddingVertical: 20 },
  packageList: { gap: 10 },
  pkgRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#0a0a0f', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
    borderWidth: 1.5, borderColor: '#1e1e2e',
  },
  pkgRowActive: { borderColor: '#a855f7', backgroundColor: '#1a0f2e' },
  pkgLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pkgAmount: { color: '#9ca3af', fontSize: 16, fontWeight: '700' },
  pkgAmountActive: { color: '#f3f4f6' },
  pkgPrice: { color: '#9ca3af', fontSize: 14, fontWeight: '600' },
  pkgPriceActive: { color: '#c4b5fd' },
  addBtn: { borderRadius: 14 },
  notice: {
    flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(59,130,246,0.1)', borderRadius: 10,
    borderWidth: 1, borderColor: '#3b82f650', padding: 10,
  },
  noticeText: { color: '#93c5fd', fontSize: 13 },
});

export default AddFundsScreen;
