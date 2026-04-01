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
  // K1: false başlangıç değeri — null yerine false, "bilinmiyor" state'i kaldırıldı
  const [isPro, setIsPro] = useState<boolean>(false);
  // O1: cache yüklenene kadar true, cache okunur okunmaz false
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

  // O1: Cache'i okur okumaz isLoading'i kapat — kullanıcı spinner görmez
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

      if (cachedPro) {
        setIsPro(JSON.parse(cachedPro));
      }
    } catch (error) {
      console.error('Error loading cache:', error);
    } finally {
      setIsLoading(false);
      // K1: Cache bittikten SONRA RC'yi sorgula — race condition yok
      void loadLivePro();
    }
  }, []);

  // RC live sorgusu — cache'den sonra çağrılır, AppState'de de tetiklenir
  const loadLivePro = useCallback(async () => {
    try {
      const livePro = await RevenueCatService.checkPremiumStatus();
      // Sorun 1: PRO → FREE geçişinde conflict cache'i temizle
      if (!livePro) {
        await AsyncStorage.multiRemove(['@conflict_last_fetch', '@conflict_cached_events']);
      }
      setIsPro(livePro);
      await AsyncStorage.setItem(PRO_STATUS_KEY, JSON.stringify(livePro));
    } catch (error) {
      // Sorun 2: RC hata alırsa mevcut isPro state'ini koru (setIsPro çağırma)
      // Ağ yoksa veya RC çökerse kullanıcıyı yanlışlıkla FREE'ye düşürme
      console.error('Error checking live PRO status:', error);
    }
  }, []);

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
