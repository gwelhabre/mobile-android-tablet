import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ProfileStackParamList } from '../../navigation/stacks/ProfileStack';
import { useAuth } from '../../context/AuthContext';
import { updateProfile } from '../../api/auth';
import { getMyDJProfile, updateDJProfile } from '../../api/dj';
import { DJProfile } from '../../types';
import PageHeader from '../../components/layout/PageHeader';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Snackbar from '../../components/common/Snackbar';

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'EditProfile'>;

export default function EditProfileScreen() {
  const navigation = useNavigation<Nav>();
  const { user, updateUser } = useAuth();

  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');

  // DJ fields
  const [djProfile, setDjProfile] = useState<DJProfile | null>(null);
  const [stageName, setStageName] = useState('');
  const [genres, setGenres] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [instagram, setInstagram] = useState('');
  const [twitter, setTwitter] = useState('');
  const [soundcloud, setSoundcloud] = useState('');
  const [spotify, setSpotify] = useState('');

  const [saving, setSaving] = useState(false);
  const [loadingDj, setLoadingDj] = useState(false);
  const [snackbar, setSnackbar] = useState<{ visible: boolean; message: string; type: 'success' | 'error' }>({
    visible: false,
    message: '',
    type: 'success',
  });

  const isDj = user?.role === 'dj';

  useEffect(() => {
    if (isDj) {
      setLoadingDj(true);
      getMyDJProfile()
        .then(profile => {
          setDjProfile(profile);
          setStageName(profile.stageName ?? '');
          setGenres((profile.genres ?? []).join(', '));
          setCity(profile.city ?? '');
          setCountry(profile.country ?? '');
          setInstagram(profile.socialLinks?.instagram ?? '');
          setTwitter(profile.socialLinks?.twitter ?? '');
          setSoundcloud(profile.socialLinks?.soundcloud ?? '');
          setSpotify(profile.socialLinks?.spotify ?? '');
          if (profile.avatarUrl) setAvatarUrl(profile.avatarUrl);
        })
        .catch(() => {})
        .finally(() => setLoadingDj(false));
    }
  }, [isDj]);

  const showSnackbar = (message: string, type: 'success' | 'error') => {
    setSnackbar({ visible: true, message, type });
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const updatedUser = await updateProfile({
        displayName,
        avatarUrl: avatarUrl || undefined,
        bio: bio || undefined,
      });

      if (isDj) {
        const genreList = genres
          .split(',')
          .map(g => g.trim())
          .filter(Boolean);

        await updateDJProfile({
          stageName,
          bio,
          genres: genreList,
          city,
          country,
          avatarUrl: avatarUrl || undefined,
          socialLinks: {
            instagram: instagram || undefined,
            twitter: twitter || undefined,
            soundcloud: soundcloud || undefined,
            spotify: spotify || undefined,
          },
        });
      }

      updateUser({
        ...user,
        displayName: updatedUser.displayName ?? displayName,
        avatarUrl: avatarUrl || user.avatarUrl,
        bio: bio || user.bio,
      });

      showSnackbar('Profile updated successfully', 'success');
      setTimeout(() => navigation.goBack(), 1200);
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? 'Failed to update profile';
      showSnackbar(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const avatarPreview = avatarUrl
    ? { uri: avatarUrl }
    : null;

  return (
    <View style={styles.container}>
      <PageHeader
        title="Edit Profile"
        showBack
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Avatar section */}
        <View style={styles.twoCol}>
          <View style={styles.leftCol}>
            <Card style={styles.avatarCard}>
              <View style={styles.avatarCircle}>
                {avatarPreview ? (
                  <Image source={avatarPreview} style={styles.avatarImage} />
                ) : (
                  <Text style={styles.avatarPlaceholder}>
                    {(displayName || user?.email || '?')[0].toUpperCase()}
                  </Text>
                )}
              </View>
              <Text style={styles.fieldLabel}>Avatar URL</Text>
              <TextInput
                style={styles.input}
                value={avatarUrl}
                onChangeText={setAvatarUrl}
                placeholder="https://..."
                placeholderTextColor="#4b5563"
                autoCapitalize="none"
                keyboardType="url"
              />
            </Card>
          </View>

          <View style={styles.rightCol}>
            {/* Basic info */}
            <Card style={styles.card}>
              <Text style={styles.sectionTitle}>Basic Info</Text>

              <Text style={styles.fieldLabel}>Display Name</Text>
              <TextInput
                style={styles.input}
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Your name"
                placeholderTextColor="#4b5563"
              />

              <Text style={styles.fieldLabel}>Bio</Text>
              <TextInput
                style={[styles.input, styles.multilineInput]}
                value={bio}
                onChangeText={setBio}
                placeholder="Tell us about yourself..."
                placeholderTextColor="#4b5563"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </Card>

            {/* DJ fields */}
            {isDj && (
              <>
                {loadingDj ? (
                  <Card style={styles.card}>
                    <ActivityIndicator color="#a855f7" size="small" />
                  </Card>
                ) : (
                  <>
                    <Card style={styles.card}>
                      <Text style={styles.sectionTitle}>DJ Profile</Text>

                      <Text style={styles.fieldLabel}>Stage Name</Text>
                      <TextInput
                        style={styles.input}
                        value={stageName}
                        onChangeText={setStageName}
                        placeholder="Your DJ name"
                        placeholderTextColor="#4b5563"
                      />

                      <Text style={styles.fieldLabel}>Genres (comma separated)</Text>
                      <TextInput
                        style={styles.input}
                        value={genres}
                        onChangeText={setGenres}
                        placeholder="House, Techno, Drum & Bass"
                        placeholderTextColor="#4b5563"
                      />

                      <Text style={styles.fieldLabel}>City</Text>
                      <TextInput
                        style={styles.input}
                        value={city}
                        onChangeText={setCity}
                        placeholder="Base city"
                        placeholderTextColor="#4b5563"
                      />

                      <Text style={styles.fieldLabel}>Country</Text>
                      <TextInput
                        style={styles.input}
                        value={country}
                        onChangeText={setCountry}
                        placeholder="Country"
                        placeholderTextColor="#4b5563"
                      />
                    </Card>

                    <Card style={styles.card}>
                      <Text style={styles.sectionTitle}>Social Links</Text>

                      <Text style={styles.fieldLabel}>Instagram</Text>
                      <TextInput
                        style={styles.input}
                        value={instagram}
                        onChangeText={setInstagram}
                        placeholder="https://instagram.com/..."
                        placeholderTextColor="#4b5563"
                        autoCapitalize="none"
                        keyboardType="url"
                      />

                      <Text style={styles.fieldLabel}>SoundCloud</Text>
                      <TextInput
                        style={styles.input}
                        value={soundcloud}
                        onChangeText={setSoundcloud}
                        placeholder="https://soundcloud.com/..."
                        placeholderTextColor="#4b5563"
                        autoCapitalize="none"
                        keyboardType="url"
                      />

                      <Text style={styles.fieldLabel}>Spotify</Text>
                      <TextInput
                        style={styles.input}
                        value={spotify}
                        onChangeText={setSpotify}
                        placeholder="https://open.spotify.com/artist/..."
                        placeholderTextColor="#4b5563"
                        autoCapitalize="none"
                        keyboardType="url"
                      />

                      <Text style={styles.fieldLabel}>Twitter / X</Text>
                      <TextInput
                        style={styles.input}
                        value={twitter}
                        onChangeText={setTwitter}
                        placeholder="https://twitter.com/..."
                        placeholderTextColor="#4b5563"
                        autoCapitalize="none"
                        keyboardType="url"
                      />
                    </Card>
                  </>
                )}
              </>
            )}

            <Button
              label="Save Changes"
              onPress={handleSave}
              loading={saving}
              disabled={saving}
              fullWidth
              size="lg"
              style={styles.saveBtn}
            />
          </View>
        </View>
      </ScrollView>

      <Snackbar
        message={snackbar.message}
        visible={snackbar.visible}
        type={snackbar.type}
        onDismiss={() => setSnackbar(s => ({ ...s, visible: false }))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f' },
  scrollContent: { padding: 20, gap: 16, paddingBottom: 40 },
  twoCol: { flexDirection: 'row', gap: 16, alignItems: 'flex-start' },
  leftCol: { width: 240 },
  rightCol: { flex: 1, gap: 16 },
  avatarCard: { padding: 20, alignItems: 'center', gap: 16 },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#1e1e2e',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#a855f7',
  },
  avatarImage: { width: 100, height: 100, borderRadius: 50 },
  avatarPlaceholder: { color: '#a855f7', fontSize: 36, fontWeight: '700' },
  card: { padding: 20, gap: 12 },
  sectionTitle: { color: '#f3f4f6', fontSize: 16, fontWeight: '700', marginBottom: 4 },
  fieldLabel: { color: '#6b7280', fontSize: 12, fontWeight: '600', letterSpacing: 0.5 },
  input: {
    backgroundColor: '#1e1e2e',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#f3f4f6',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#2d2d3f',
  },
  multilineInput: { height: 96, paddingTop: 12 },
  saveBtn: { marginTop: 4 },
});
