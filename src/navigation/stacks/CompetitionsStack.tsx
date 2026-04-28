import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import CompetitionsScreen from '../../screens/competitions/CompetitionsScreen';
import CompetitionDetailScreen from '../../screens/competitions/CompetitionDetailScreen';

export type CompetitionsStackParamList = {
  Competitions: undefined;
  CompetitionDetail: { competitionId: string };
};

const Stack = createNativeStackNavigator<CompetitionsStackParamList>();

const CompetitionsStack: React.FC = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Competitions" component={CompetitionsScreen} />
    <Stack.Screen name="CompetitionDetail" component={CompetitionDetailScreen} />
  </Stack.Navigator>
);

export default CompetitionsStack;
