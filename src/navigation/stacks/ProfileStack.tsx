import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProfileScreen from '../../screens/profile/ProfileScreen';
import SettingsScreen from '../../screens/profile/SettingsScreen';
import EditProfileScreen from '../../screens/profile/EditProfileScreen';
import ChangePasswordScreen from '../../screens/profile/ChangePasswordScreen';
import DeleteAccountScreen from '../../screens/profile/DeleteAccountScreen';
import BlockedUsersScreen from '../../screens/profile/BlockedUsersScreen';
import EventPlannerDashboardScreen from '../../screens/eventPlanner/EventPlannerDashboardScreen';
import InfoScreen from '../../screens/info/InfoScreen';

export type ProfileStackParamList = {
  Profile: undefined;
  Settings: { initialCategory?: string; navItem?: string } | undefined;
  EditProfile: undefined;
  ChangePassword: undefined;
  DeleteAccount: undefined;
  BlockedUsers: undefined;
  EventPlannerDashboard: undefined;
  Info: { topic: string };
};

const Stack = createNativeStackNavigator<ProfileStackParamList>();

const ProfileStack: React.FC = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Profile" component={ProfileScreen} />
    <Stack.Screen name="Settings" component={SettingsScreen} />
    <Stack.Screen name="EditProfile" component={EditProfileScreen} />
    <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
    <Stack.Screen name="DeleteAccount" component={DeleteAccountScreen} />
    <Stack.Screen name="BlockedUsers" component={BlockedUsersScreen} />
    <Stack.Screen name="EventPlannerDashboard" component={EventPlannerDashboardScreen} />
    <Stack.Screen name="Info" component={InfoScreen} />
  </Stack.Navigator>
);

export default ProfileStack;
