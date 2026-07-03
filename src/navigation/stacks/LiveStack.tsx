import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LiveDirectoryScreen from '../../screens/live/LiveDirectoryScreen';
import LiveStreamScreen from '../../screens/live/LiveStreamScreen';
import GoLiveScreen from '../../screens/live/GoLiveScreen';

export type LiveStackParamList = {
  LiveDirectory: undefined;
  LiveStream: { streamId: string };
  GoLive: undefined;
};

const Stack = createNativeStackNavigator<LiveStackParamList>();

const LiveStack: React.FC = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="LiveDirectory" component={LiveDirectoryScreen} />
    <Stack.Screen name="LiveStream" component={LiveStreamScreen} />
    <Stack.Screen name="GoLive" component={GoLiveScreen} />
  </Stack.Navigator>
);

export default LiveStack;
