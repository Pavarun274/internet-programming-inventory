import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { DrawerMenu } from '@/components/drawer-menu';
import { LoginScreen } from '@/components/login-screen';
import { MenuProvider } from '@/contexts/menu-context';
import { AuthProvider } from '@/contexts/auth-context';
import { useAuth } from '@/hooks/use-auth';

import { InventoryProvider } from '@/contexts/inventory-context';

SplashScreen.preventAutoHideAsync();

function AuthGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  // While the stored session is being restored, render nothing — the native
  // splash screen (hidden by AnimatedSplashOverlay below, which mounts
  // unconditionally) still covers the screen at this point.
  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return <>{children}</>;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        {/* Rendered unconditionally (not gated on auth) so the native splash
            screen always gets dismissed, whether the user lands on the
            login screen or the authenticated app. */}
        <AnimatedSplashOverlay />
        <AuthGate>
          <InventoryProvider>
            <MenuProvider>
              <AppTabs />
              <DrawerMenu />
            </MenuProvider>
          </InventoryProvider>
        </AuthGate>
      </AuthProvider>
    </ThemeProvider>
  );
}
