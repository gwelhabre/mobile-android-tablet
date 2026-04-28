import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ForumScreen from '../../screens/community/ForumScreen';
import BlogScreen from '../../screens/community/BlogScreen';

export type CommunityStackParamList = {
  Forum: undefined;
  Blog: undefined;
};

const Stack = createNativeStackNavigator<CommunityStackParamList>();

const CommunityStack: React.FC = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Forum" component={ForumScreen} />
    <Stack.Screen name="Blog" component={BlogScreen} />
  </Stack.Navigator>
);

export default CommunityStack;
