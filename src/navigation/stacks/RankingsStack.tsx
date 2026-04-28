import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import RankingsScreen from '../../screens/rankings/RankingsScreen';

export type RankingsStackParamList = {
  Rankings: undefined;
};

const Stack = createNativeStackNavigator<RankingsStackParamList>();

const RankingsStack: React.FC = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Rankings" component={RankingsScreen} />
  </Stack.Navigator>
);

export default RankingsStack;
