import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LiveDirectoryScreen from '../../screens/live/LiveDirectoryScreen';
import LiveStreamScreen from '../../screens/live/LiveStreamScreen';

export type LiveStackParamList = {
  LiveDirectory: undefined;
  LiveStream: { streamId: string };
};

const Stack = createNativeStackNavigator<LiveStackParamList>();

const LiveStack: React.FC = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="LiveDirectory" component={LiveDirectoryScreen} />
    <Stack.Screen name="LiveStream" component={LiveStreamScreen} />
  </Stack.Navigator>
);

export default LiveStack;
