import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';
import DrawerNavigator from './DrawerNavigator';

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();

const RootNavigator: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#a855f7" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <AuthStack.Navigator screenOptions={{ headerShown: false }}>
        <AuthStack.Screen name="Login" component={LoginScreen} />
        <AuthStack.Screen name="Signup" component={SignupScreen} />
      </AuthStack.Navigator>
    );
  }

  return <DrawerNavigator />;
};

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    backgroundColor: '#0a0a0f',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default RootNavigator;
