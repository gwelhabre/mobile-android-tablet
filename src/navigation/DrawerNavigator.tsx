import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { useWindowDimensions } from 'react-native';
import DrawerContent from '../components/layout/DrawerContent';

import HomeStack from './stacks/HomeStack';
import DiscoverStack from './stacks/DiscoverStack';
import RankingsStack from './stacks/RankingsStack';
import LiveStack from './stacks/LiveStack';
import WalletStack from './stacks/WalletStack';
import MarketplaceStack from './stacks/MarketplaceStack';
import CommunityStack from './stacks/CommunityStack';
import DJStack from './stacks/DJStack';
import VenueStack from './stacks/VenueStack';
import CompetitionsStack from './stacks/CompetitionsStack';
import ProfileStack from './stacks/ProfileStack';
import NotificationsScreen from '../screens/notifications/NotificationsScreen';
import SearchScreen from '../screens/discover/SearchScreen';

export type DrawerParamList = {
  HomeStack: undefined;
  LiveStack: undefined;
  RankingsStack: undefined;
  SearchScreen: undefined;
  DiscoverStack: undefined;
  WalletStack: undefined;
  MarketplaceStack: undefined;
  CommunityStack: undefined;
  DJStack: undefined;
  VenueStack: undefined;
  CompetitionsStack: undefined;
  NotificationsScreen: undefined;
  ProfileStack: undefined;
};

const Drawer = createDrawerNavigator<DrawerParamList>();

const DrawerNavigator: React.FC = () => {
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 768;

  return (
    <Drawer.Navigator
      drawerContent={(props) => <DrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: isLargeScreen ? 'permanent' : 'front',
        drawerStyle: {
          backgroundColor: '#12121a',
          width: 260,
          borderRightWidth: 1,
          borderRightColor: '#1e1e2e',
        },
        sceneContainerStyle: {
          backgroundColor: '#0a0a0f',
        },
        overlayColor: 'rgba(0,0,0,0.6)',
      }}
    >
      <Drawer.Screen name="HomeStack" component={HomeStack} />
      <Drawer.Screen name="LiveStack" component={LiveStack} />
      <Drawer.Screen name="RankingsStack" component={RankingsStack} />
      <Drawer.Screen name="SearchScreen" component={SearchScreen} />
      <Drawer.Screen name="DiscoverStack" component={DiscoverStack} />
      <Drawer.Screen name="WalletStack" component={WalletStack} />
      <Drawer.Screen name="MarketplaceStack" component={MarketplaceStack} />
      <Drawer.Screen name="CommunityStack" component={CommunityStack} />
      <Drawer.Screen name="DJStack" component={DJStack} />
      <Drawer.Screen name="VenueStack" component={VenueStack} />
      <Drawer.Screen name="CompetitionsStack" component={CompetitionsStack} />
      <Drawer.Screen name="NotificationsScreen" component={NotificationsScreen} />
      <Drawer.Screen name="ProfileStack" component={ProfileStack} />
    </Drawer.Navigator>
  );
};

export default DrawerNavigator;
