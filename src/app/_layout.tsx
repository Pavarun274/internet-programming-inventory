import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { DrawerMenu } from '@/components/drawer-menu';
import { MenuProvider } from '@/contexts/menu-context';

import { InventoryProvider } from '@/contexts/inventory-context';

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <InventoryProvider>
        <MenuProvider>
          <AnimatedSplashOverlay />
          <AppTabs />
          <DrawerMenu />
        </MenuProvider>
      </InventoryProvider>
    </ThemeProvider>
  );
}
