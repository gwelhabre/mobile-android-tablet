import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DJsScreen from '../../screens/discover/DJsScreen';
import DJProfileScreen from '../../screens/discover/DJProfileScreen';
import VenuesScreen from '../../screens/discover/VenuesScreen';
import EventsScreen from '../../screens/discover/EventsScreen';
import EventDetailScreen from '../../screens/discover/EventDetailScreen';
import VenueBroadcastScreen from '../../screens/venue/VenueBroadcastScreen';

export type DiscoverStackParamList = {
  DJs: undefined;
  DJProfile: { djId: string };
  Venues: undefined;
  Events: undefined;
  EventDetail: { eventId: string };
  VenueBroadcast: { eventId?: string } | undefined;
};

const Stack = createNativeStackNavigator<DiscoverStackParamList>();

const DiscoverStack: React.FC = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="DJs" component={DJsScreen} />
    <Stack.Screen name="DJProfile" component={DJProfileScreen} />
    <Stack.Screen name="Venues" component={VenuesScreen} />
    <Stack.Screen name="Events" component={EventsScreen} />
    <Stack.Screen name="EventDetail" component={EventDetailScreen} />
    <Stack.Screen name="VenueBroadcast" component={VenueBroadcastScreen} />
  </Stack.Navigator>
);

export default DiscoverStack;
