import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import type { FilterSettings } from '@/types/events';
import { RevenueCatService } from '@/services/revenuecat';

const STORAGE_KEY = '@worldpulse_filters';
const PRO_STATUS_KEY = '@worldpulse_is_pro_status';

export const defaultFilters: FilterSettings = {
  showEarthquakes: true,
  showWildfires: true,
  showFloods: true,
  showVolcanoes: true,
  showStorms: true,
  showNews: true,
  showConflicts: false,
  showUnrest: false,
  minMagnitude: 3.5,
};

export const [FilterProvider, useFilters] = createContextHook(() => {
  const [filters, setFilters] = useState<FilterSettings>(defaultFilters);
  // iPadOS 26 fix: isPro must be nullable for proper loading state
  const [isPro, setIsPro] = useState<boolean | null>(null);
  // Loading state tracks cache + RC initialization
  const [isLoading, setIsLoading] = useState(true);

  // K1: Tek effect — cache önce, RC live sonra (race condition yok)
  useEffect(() => {
    void loadFromCache();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // O2: AppState listener — uygulama öne gelince PRO durumunu yenile
  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        void loadLivePro();
      }
    };
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load from cache first, then query RevenueCat
  const loadFromCache = useCallback(async () => {
    try {
      const [stored, cachedPro] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY),
        AsyncStorage.getItem(PRO_STATUS_KEY),
      ]);

      if (stored) {
        const parsed = JSON.parse(stored);
        setFilters({
          ...defaultFilters,
          ...parsed,
          showNews: parsed.showNews !== undefined ? parsed.showNews : true,
        });
      }

      // iPadOS 26 fix: Set cached PRO status or default to false
      if (cachedPro !== null) {
        setIsPro(JSON.parse(cachedPro));
      } else {
        setIsPro(false); // Default to free if no cache
      }
    } catch (error) {
      console.error('Error loading cache:', error);
      setIsPro(false); // Fallback to free on error
    } finally {
      setIsLoading(false);
      // Query live status after cache is loaded
      void loadLivePro();
    }
  }, []);

  // Query live RevenueCat status
  const loadLivePro = useCallback(async () => {
    try {
      const livePro = await RevenueCatService.checkPremiumStatus();
      // Clear conflict cache if user downgrades to free
      if (!livePro) {
        await AsyncStorage.multiRemove(['@conflict_last_fetch', '@conflict_cached_events']);
      }
      setIsPro(livePro);
      await AsyncStorage.setItem(PRO_STATUS_KEY, JSON.stringify(livePro));
    } catch (error) {
      // iPadOS 26 fix: On error, keep current state (don't force to free)
      // Only log error, don't update isPro
      console.error('Error checking live PRO status:', error);
      // If isPro is still null (first load failed), default to false
      if (isPro === null) {
        setIsPro(false);
      }
    }
  }, [isPro]);

  const updateFilter = useCallback(async <K extends keyof FilterSettings>(
    key: K,
    value: FilterSettings[K]
  ) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newFilters));
    } catch (error) {
      console.error('Error saving filters:', error);
    }
  }, [filters]);

  const resetFilters = useCallback(async () => {
    setFilters(defaultFilters);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(defaultFilters));
    } catch (error) {
      console.error('Error resetting filters:', error);
    }
  }, []);

  return useMemo(() => ({
    filters,
    isLoading,
    isPro,
    setIsPro,
    updateFilter,
    resetFilters,
  }), [filters, isLoading, isPro, updateFilter, resetFilters]);
});
