import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { FilterProvider } from '@/context/FilterContext';
import { RevenueCatService } from '@/services/revenuecat';
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
  const [rcReady, setRcReady] = useState(false);

  useEffect(() => {
    const setup = async () => {
      await RevenueCatService.initialize();
      setRcReady(true);
      await SplashScreen.hideAsync();
    };
    setup();
  }, []);

  // Sorun 3: null yerine siyah ekran — splash kapandıktan sonra beyaz flash yok
  if (!rcReady) return <View style={{ flex: 1, backgroundColor: '#000' }} />;

  return (
    <QueryClientProvider client={queryClient}>
      <FilterProvider>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen 
            name="event/[id]" 
            options={{ 
              presentation: 'card',
              headerShown: false,
            }} 
          />
          <Stack.Screen 
            name="paywall" 
            options={{ 
              presentation: 'modal',
              headerShown: false,
            }} 
          />
        </Stack>
        <StatusBar style="light" />
      </FilterProvider>
    </QueryClientProvider>
  );
}
