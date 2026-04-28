import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import VenueDashboardScreen from '../../screens/venue/VenueDashboardScreen';
import VenueDealsScreen from '../../screens/venue/VenueDealsScreen';
import VenuePostEventScreen from '../../screens/venue/VenuePostEventScreen';
import VenueAnalyticsScreen from '../../screens/venue/VenueAnalyticsScreen';
import VenueBroadcastScreen from '../../screens/venue/VenueBroadcastScreen';
import DJsScreen from '../../screens/discover/DJsScreen';

export type VenueStackParamList = {
  VenueDashboard: undefined;
  VenueDeals: undefined;
  VenuePostEvent: undefined;
  VenueAnalytics: undefined;
  VenueFindDJs: undefined;
  VenueBroadcast: { eventId?: string } | undefined;
};

const Stack = createNativeStackNavigator<VenueStackParamList>();

const VenueStack: React.FC = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="VenueDashboard" component={VenueDashboardScreen} />
    <Stack.Screen name="VenueDeals" component={VenueDealsScreen} />
    <Stack.Screen name="VenuePostEvent" component={VenuePostEventScreen} />
    <Stack.Screen name="VenueAnalytics" component={VenueAnalyticsScreen} />
    <Stack.Screen name="VenueFindDJs" component={DJsScreen} />
    <Stack.Screen name="VenueBroadcast" component={VenueBroadcastScreen} />
  </Stack.Navigator>
);

export default VenueStack;
