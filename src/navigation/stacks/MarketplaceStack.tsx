import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MarketplaceScreen from '../../screens/marketplace/MarketplaceScreen';
import ProductDetailScreen from '../../screens/marketplace/ProductDetailScreen';

export type MarketplaceStackParamList = {
  Marketplace: undefined;
  ProductDetail: { productId: string };
};

const Stack = createNativeStackNavigator<MarketplaceStackParamList>();

const MarketplaceStack: React.FC = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Marketplace" component={MarketplaceScreen} />
    <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
  </Stack.Navigator>
);

export default MarketplaceStack;
