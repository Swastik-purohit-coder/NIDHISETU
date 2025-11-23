import 'react-native-reanimated';

import { NavigationIndependentTree } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';

import { AppProviders } from '@/context/AppProviders';
import { AppNavigator } from '@/navigation/AppNavigator';

export default function RootLayout() {
  return (
    <AppProviders>
      <NavigationIndependentTree>
        <AppNavigator />
      </NavigationIndependentTree>
      <StatusBar style="auto" />
    </AppProviders>
  );
}
