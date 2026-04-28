import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import FeedScreen from '../../screens/home/FeedScreen';

export type HomeStackParamList = {
  Feed: undefined;
};

const Stack = createNativeStackNavigator<HomeStackParamList>();

const HomeStack: React.FC = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Feed" component={FeedScreen} />
  </Stack.Navigator>
);

export default HomeStack;
