import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DJsScreen from '../../screens/discover/DJsScreen';
import DJProfileScreen from '../../screens/discover/DJProfileScreen';
import VenuesScreen from '../../screens/discover/VenuesScreen';
import EventsScreen from '../../screens/discover/EventsScreen';
import EventDetailScreen from '../../screens/discover/EventDetailScreen';
import VenueBroadcastScreen from '../../screens/venue/VenueBroadcastScreen';
import VenueDetailScreen from '../../screens/discover/VenueDetailScreen';
import PlanYourEventScreen from '../../screens/discover/PlanYourEventScreen';

export type DiscoverStackParamList = {
  DJs: undefined;
  DJProfile: { djId: string };
  Venues: undefined;
  VenueDetail: { venueId: string };
  Events: undefined;
  EventDetail: { eventId: string };
  VenueBroadcast: { eventId?: string } | undefined;
  PlanYourEvent: undefined;
};

const Stack = createNativeStackNavigator<DiscoverStackParamList>();

const DiscoverStack: React.FC = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="DJs" component={DJsScreen} />
    <Stack.Screen name="DJProfile" component={DJProfileScreen} />
    <Stack.Screen name="Venues" component={VenuesScreen} />
    <Stack.Screen name="Events" component={EventsScreen} />
    <Stack.Screen name="EventDetail" component={EventDetailScreen} />
    <Stack.Screen name="VenueDetail" component={VenueDetailScreen} />
    <Stack.Screen name="VenueBroadcast" component={VenueBroadcastScreen} />
    <Stack.Screen name="PlanYourEvent" component={PlanYourEventScreen} />
  </Stack.Navigator>
);

export default DiscoverStack;
