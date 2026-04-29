import React from 'react';
import { View, Text, ScrollView, StyleSheet, Linking, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/common/Header';

type Topic =
  | 'about'
  | 'help'
  | 'legal'
  | 'privacy'
  | 'terms'
  | 'cookies'
  | 'pricing'
  | 'contact'
  | 'careers'
  | 'status';

const CONTENT: Record<Topic, { title: string; sections: Array<{ heading?: string; body: string }> }> = {
  about: {
    title: 'About DiskRider',
    sections: [
      { body: 'DiskRider is the home for DJs, venues, and dance-music fans. Discover live sets, book DJs, plan events, and run marketplace storefronts — all in one place.' },
      { heading: 'Our mission', body: 'Lower the friction between artists and the rooms that host them, while sharing fair value with every participant.' },
    ],
  },
  help: {
    title: 'Help Center',
    sections: [
      { heading: 'Getting started', body: 'Sign up, pick a role (fan, DJ, venue manager, event planner), and explore the dashboard for your role.' },
      { heading: 'Booking a DJ', body: 'Open a DJ profile and tap "Propose Booking" to start a deal. Both sides can negotiate before accepting.' },
      { heading: 'Going live', body: 'Venue managers can stream from a venue dashboard or directly from an event. DJs can post videos and reels from their dashboard.' },
      { heading: 'Need more help?', body: 'Email support@diskrider.live and we will get back within 24 hours.' },
    ],
  },
  legal: {
    title: 'Legal',
    sections: [
      { body: 'DiskRider provides a platform for DJs, venues, and event planners to connect, book, and transact. By using the service you agree to our Terms of Service and Privacy Policy.' },
      { heading: 'Acceptable use', body: 'No harassment, copyright violation, or fraudulent listings. Violations may result in account suspension.' },
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    sections: [
      { body: 'We collect the data you provide (account info, payment details where applicable) and the data needed to operate the platform (events viewed, gifts sent, booking history).' },
      { heading: 'How we use it', body: 'To run your account, process transactions, and improve the product. We do not sell personal data.' },
      { heading: 'Your rights', body: 'You can request export or deletion of your data at any time from Settings → Account.' },
    ],
  },
  terms: {
    title: 'Terms of Service',
    sections: [
      { body: 'By using DiskRider you agree to these terms. We may update them; we will notify you of material changes.' },
      { heading: 'Payments', body: 'Tips, gifts, and marketplace purchases are non-refundable except where required by law or platform policy. Platform commission supports moderation, infrastructure, and the DiskRider community.' },
      { heading: 'Termination', body: 'We may terminate accounts for violations of acceptable use. You can close your account at any time from Settings.' },
    ],
  },
  cookies: {
    title: 'Cookie Policy',
    sections: [
      { body: 'On the web app, we use cookies for authentication and session state. The mobile apps use secure local storage for the same purpose.' },
      { heading: 'Analytics', body: 'We use anonymized event analytics to improve the product. You can opt out from Settings → Privacy.' },
    ],
  },
  pricing: {
    title: 'Pricing',
    sections: [
      { heading: 'For fans', body: 'Free to use. Tips, gifts, and table reservations carry a small platform commission (shown at checkout).' },
      { heading: 'For DJs', body: 'Free profile and dashboard. We take a percentage of marketplace sales and tips, distributed to support the dance-music ecosystem.' },
      { heading: 'For venues', body: 'Free dashboard. Stream and analytics included. Bookings carry a flat 5% platform fee.' },
      { heading: 'For event planners', body: 'Quote-request fee is $30 per request, paid by the requester. Planners keep 100% of the agreed quotation amount.' },
    ],
  },
  contact: {
    title: 'Contact Us',
    sections: [
      { heading: 'Support', body: 'support@diskrider.live — replies within 24 hours.' },
      { heading: 'Press & partnerships', body: 'press@diskrider.live' },
      { heading: 'Trust & safety', body: 'safety@diskrider.live for moderation issues, harassment, or copyright concerns.' },
    ],
  },
  careers: {
    title: 'Careers',
    sections: [
      { body: 'We are a small team building the home for dance-music. If you love product, music, or live events, we would love to hear from you.' },
      { heading: 'Open roles', body: 'We hire opportunistically. Send us your portfolio at jobs@diskrider.live with the role you are interested in.' },
    ],
  },
  status: {
    title: 'System Status',
    sections: [
      { heading: 'API', body: 'All systems operational.' },
      { heading: 'Streaming', body: 'All systems operational.' },
      { heading: 'Marketplace', body: 'All systems operational.' },
      { body: 'Live status available on the web at diskrider.live/status.' },
    ],
  },
};

const InfoScreen: React.FC = () => {
  const route = useRoute<RouteProp<Record<string, { topic: Topic }>, string>>();
  const topic = (route.params?.topic ?? 'about') as Topic;
  const data = CONTENT[topic] ?? CONTENT.about;

  const openMail = (email: string) => Linking.openURL(`mailto:${email}`);

  return (
    <SafeAreaView style={styles.safe}>
      <Header title={data.title} showBack />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {data.sections.map((section, idx) => (
          <View key={idx} style={styles.section}>
            {section.heading ? <Text style={styles.heading}>{section.heading}</Text> : null}
            <Text style={styles.body}>{section.body}</Text>
            {section.body.match(/[\w.+-]+@[\w-]+\.[a-z]{2,}/i) && (
              <TouchableOpacity
                style={styles.mailBtn}
                onPress={() => {
                  const m = section.body.match(/[\w.+-]+@[\w-]+\.[a-z]{2,}/i);
                  if (m) openMail(m[0]);
                }}
              >
                <Ionicons name="mail-outline" size={14} color="#67e8f9" />
                <Text style={styles.mailBtnText}>Send email</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0a0a0f' },
  content: { padding: 18, gap: 18, paddingBottom: 36 },
  section: { gap: 8 },
  heading: { color: '#67e8f9', fontSize: 14, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 },
  body: { color: '#d1d5db', fontSize: 14, lineHeight: 22 },
  mailBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#06b6d455' },
  mailBtnText: { color: '#67e8f9', fontSize: 12, fontWeight: '700' },
});

export default InfoScreen;
