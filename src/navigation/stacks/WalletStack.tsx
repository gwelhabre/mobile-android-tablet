import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import WalletScreen from '../../screens/wallet/WalletScreen';
import AddFundsScreen from '../../screens/wallet/AddFundsScreen';
import PayoutScreen from '../../screens/wallet/PayoutScreen';
import WhishSetupScreen from '../../screens/wallet/WhishSetupScreen';

export type WalletStackParamList = {
  Wallet: undefined;
  AddFunds: undefined;
  Payout: undefined;
  WhishSetup: undefined;
};

const Stack = createNativeStackNavigator<WalletStackParamList>();

const WalletStack: React.FC = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Wallet" component={WalletScreen} />
    <Stack.Screen name="AddFunds" component={AddFundsScreen} />
    <Stack.Screen name="Payout" component={PayoutScreen} />
    <Stack.Screen name="WhishSetup" component={WhishSetupScreen} />
  </Stack.Navigator>
);

export default WalletStack;
