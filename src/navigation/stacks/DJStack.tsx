import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DJDashboardScreen from '../../screens/dj/DJDashboardScreen';
import DJAnalyticsScreen from '../../screens/dj/DJAnalyticsScreen';
import DJSetsScreen from '../../screens/dj/DJSetsScreen';
import DJDealsScreen from '../../screens/dj/DJDealsScreen';

export type DJStackParamList = {
  DJDashboard: undefined;
  DJAnalytics: undefined;
  DJSets: undefined;
  DJDeals: undefined;
};

const Stack = createNativeStackNavigator<DJStackParamList>();

const DJStack: React.FC = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="DJDashboard" component={DJDashboardScreen} />
    <Stack.Screen name="DJAnalytics" component={DJAnalyticsScreen} />
    <Stack.Screen name="DJSets" component={DJSetsScreen} />
    <Stack.Screen name="DJDeals" component={DJDealsScreen} />
  </Stack.Navigator>
);

export default DJStack;
