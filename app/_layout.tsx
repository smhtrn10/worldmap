import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FilterProvider } from '@/context/FilterContext';
import { RevenueCatService } from '@/services/revenuecat';
import { ReviewManager } from '@/utils/reviewManager';
void SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000,
    },
  },
});

export default function RootLayout() {
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);

  useEffect(() => {
    const setup = async () => {
      try {
        // Check onboarding status
        const onboardingStatus = await AsyncStorage.getItem('@worldpulse_onboarding_completed');
        console.log('[RootLayout] Onboarding status from storage:', onboardingStatus);
        const isComplete = onboardingStatus === 'true';
        console.log('[RootLayout] Onboarding complete:', isComplete);
        setOnboardingComplete(isComplete);

        // iPadOS 26 fix: Handle initialization errors gracefully (Run in background, don't await)
        RevenueCatService.initialize().catch(err => console.error('[RootLayout] RevenueCat init failed:', err));
      } catch (error) {
        console.error('[RootLayout] setup failed:', error);
        // Continue anyway - app should work without RC
      } finally {
        await SplashScreen.hideAsync();
      }
      
      // Track app opens for review system
      try {
        await ReviewManager.incrementAppOpens();
      } catch (error) {
        console.error('[RootLayout] Review tracking failed:', error);
      }
    };
    setup();
  }, []);

  // Show loading screen until onboarding status is loaded
  if (onboardingComplete === null) {
    console.log('[RootLayout] Loading... onboardingComplete:', onboardingComplete);
    return <View style={{ flex: 1, backgroundColor: '#000' }} />;
  }

  console.log('[RootLayout] Rendering Stack. onboardingComplete:', onboardingComplete);

  return (
    <QueryClientProvider client={queryClient}>
      <FilterProvider>
        <Stack screenOptions={{ headerShown: false }}>
          {!onboardingComplete ? (
            <Stack.Screen name="onboarding" />
          ) : (
            <>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen 
                name="event/[id]" 
                options={{ 
                  presentation: 'card',
                }} 
              />
              <Stack.Screen 
                name="paywall" 
                options={{ 
                  presentation: 'modal',
                }} 
              />
            </>
          )}
        </Stack>
        <StatusBar style="light" />
      </FilterProvider>
    </QueryClientProvider>
  );
}
