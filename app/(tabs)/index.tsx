import React, { useCallback, useState, useEffect, useMemo } from 'react';
import { StyleSheet, View, Text, Platform, Pressable, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '@/constants/colors';
import { fetchAllEvents } from '@/services/api';
import { useFilters } from '@/context/FilterContext';
import { RefreshFAB } from '@/components/RefreshFAB';
import { BottomFilterSheet } from '@/components/BottomFilterSheet';
import { useDeviceType } from '@/hooks/useDeviceType';
import type { EventCategory, WorldEvent } from '@/types/events';

// Platform-safe map import - Leaflet only on web, MapLibre on native
type MapComponent = React.ComponentType<{ events: WorldEvent[]; onMarkerPress: (id: string) => void }>;
const MapView: MapComponent = Platform.OS === 'web'
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  ? require('@/components/WorldMap.web').WorldMap
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  : require('@/components/WorldMapNative').WorldMapNative;

const MONO = Platform.OS === 'ios' ? 'Courier New' : 'monospace';

const CATEGORY_LEGEND: { category: EventCategory; color: string; label: string }[] = [
  { category: 'conflict',   color: Colors.category.conflict,   label: 'CONFLICTS' },
  { category: 'unrest',     color: Colors.category.unrest,     label: 'UNREST' },
  { category: 'earthquake', color: Colors.category.earthquake, label: 'QUAKES' },
  { category: 'wildfire',   color: Colors.category.wildfire,   label: 'FIRES' },
  { category: 'flood',      color: Colors.category.flood,      label: 'FLOODS' },
  { category: 'volcano',    color: Colors.category.volcano,    label: 'VOLCANOES' },
  { category: 'storm',      color: Colors.category.storm,      label: 'STORMS' },
  { category: 'news',       color: Colors.category.news,       label: 'NEWS' },
];

export default function MapScreen() {
  const router = useRouter();
  const [filterSheetVisible, setFilterSheetVisible] = useState(false);
  const { filters, isPro, updateFilter } = useFilters();
  const deviceInfo = useDeviceType();

  // Show paywall modal on first launch after onboarding (if user closed it without purchasing)
  useEffect(() => {
    const checkFirstLaunch = async () => {
      try {
        const hasSeenPaywall = await AsyncStorage.getItem('@worldpulse_paywall_shown');
        const onboardingComplete = await AsyncStorage.getItem('@worldpulse_onboarding_completed');
        
        // Only show paywall if:
        // 1. User has completed onboarding
        // 2. User hasn't seen paywall yet
        // 3. User is not pro
        if (onboardingComplete === 'true' && !hasSeenPaywall && isPro === false) {
          await AsyncStorage.setItem('@worldpulse_paywall_shown', 'true');
          // Small delay to let the app settle
          setTimeout(() => {
            router.push('/paywall' as any);
          }, 1000);
        }
      } catch (error) {
        console.error('Error checking paywall status:', error);
      }
    };
    
    if (isPro !== null) {
      checkFirstLaunch();
    }
  }, [isPro, router]);

  // All hooks must be called before any early return
  const disabledCategories: EventCategory[] = isPro ? [] : ['conflict', 'unrest'];

  const [selectedCategories, setSelectedCategories] = useState<EventCategory[]>([]);
  const [categoriesLoaded, setCategoriesLoaded] = useState(false);

  // Load selected categories from AsyncStorage on mount
  useEffect(() => {
    const loadSelectedCategories = async () => {
      try {
        const stored = await AsyncStorage.getItem('@worldpulse_selected_categories');
        if (stored) {
          const parsed: EventCategory[] = JSON.parse(stored);
          setSelectedCategories(parsed);
        } else {
          // Initialize from filters (settings)
          const base: EventCategory[] = [];
          if (filters.showEarthquakes) base.push('earthquake');
          if (filters.showWildfires) base.push('wildfire');
          if (filters.showFloods) base.push('flood');
          if (filters.showVolcanoes) base.push('volcano');
          if (filters.showStorms) base.push('storm');
          if (filters.showNews) base.push('news');
          if (filters.showConflicts) base.push('conflict');
          if (filters.showUnrest) base.push('unrest');
          setSelectedCategories(base);
          // Save initial state
          await AsyncStorage.setItem('@worldpulse_selected_categories', JSON.stringify(base));
        }
      } catch (error) {
        console.error('Error loading selected categories:', error);
        // Fallback to defaults
        const base: EventCategory[] = ['earthquake', 'wildfire', 'flood', 'volcano', 'storm', 'news'];
        setSelectedCategories(base);
      } finally {
        setCategoriesLoaded(true);
      }
    };
    loadSelectedCategories();
  }, [filters]);

  // Sync selectedCategories when settings filters change
  useEffect(() => {
    if (!categoriesLoaded) return;
    
    const syncFromFilters = async () => {
      const base: EventCategory[] = [];
      if (filters.showEarthquakes) base.push('earthquake');
      if (filters.showWildfires) base.push('wildfire');
      if (filters.showFloods) base.push('flood');
      if (filters.showVolcanoes) base.push('volcano');
      if (filters.showStorms) base.push('storm');
      if (filters.showNews) base.push('news');
      if (filters.showConflicts) base.push('conflict');
      if (filters.showUnrest) base.push('unrest');
      
      setSelectedCategories(base);
      await AsyncStorage.setItem('@worldpulse_selected_categories', JSON.stringify(base));
    };
    
    syncFromFilters();
  }, [filters, categoriesLoaded]);

  const { data: events = [], isLoading, refetch } = useQuery({
    queryKey: ['all-events', isPro],
    queryFn: () => fetchAllEvents(!!isPro),
    refetchInterval: 5 * 60 * 1000,
    enabled: isPro !== null, // don't fetch until PRO status is known
  });

  // Apply only magnitude filter and PRO restrictions, not category filters
  const filteredByMagnitude = useMemo(() => {
    return events.filter((event) => {
      // Non-PRO users never see real conflict/unrest
      if (!isPro && (event.category === 'conflict' || event.category === 'unrest')) {
        return false;
      }
      // Only apply magnitude filter for earthquakes
      if (event.category === 'earthquake' && event.magnitude && event.magnitude < filters.minMagnitude) {
        return false;
      }
      return true;
    });
  }, [events, filters.minMagnitude, isPro]);

  // When isPro resolves from null → true, add conflict/unrest to selected categories if not already there
  React.useEffect(() => {
    if (isPro === true && categoriesLoaded) {
      setSelectedCategories((prev) => {
        const proCategories: EventCategory[] = ['conflict', 'unrest'];
        const missing = proCategories.filter((c) => !prev.includes(c));
        if (missing.length > 0) {
          const updated = [...missing, ...prev];
          // Save to AsyncStorage
          AsyncStorage.setItem('@worldpulse_selected_categories', JSON.stringify(updated)).catch(console.error);
          return updated;
        }
        return prev;
      });
    }
  }, [isPro, categoriesLoaded]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const EVENTS_PER_PAGE = 30;

  // Apply category filter based on selectedCategories (map toggles)
  const allVisibleEvents = filteredByMagnitude.filter(
    (e) => selectedCategories.includes(e.category) && e.coordinates !== null
  );

  // Pagination logic
  const totalPages = Math.ceil(allVisibleEvents.length / EVENTS_PER_PAGE);
  const startIndex = (currentPage - 1) * EVENTS_PER_PAGE;
  const endIndex = startIndex + EVENTS_PER_PAGE;
  const visibleEvents = allVisibleEvents.slice(startIndex, endIndex);

  // Reset to page 1 when categories change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategories]);

  const handlePrevPage = useCallback(() => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  }, []);

  const handleNextPage = useCallback(() => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  }, [totalPages]);

  const handleLatestPage = useCallback(() => {
    setCurrentPage(1);
  }, []);

  const handleToggleCategory = useCallback((category: EventCategory) => {
    if (isPro === false && (category === 'conflict' || category === 'unrest')) {
      return;
    }
    setSelectedCategories((prev) => {
      const updated = prev.includes(category) 
        ? prev.filter((c) => c !== category) 
        : [...prev, category];
      
      // Save to AsyncStorage
      AsyncStorage.setItem('@worldpulse_selected_categories', JSON.stringify(updated)).catch(console.error);
      
      // Sync with settings filters
      const isEnabled = updated.includes(category);
      switch (category) {
        case 'earthquake':
          updateFilter('showEarthquakes', isEnabled);
          break;
        case 'wildfire':
          updateFilter('showWildfires', isEnabled);
          break;
        case 'flood':
          updateFilter('showFloods', isEnabled);
          break;
        case 'volcano':
          updateFilter('showVolcanoes', isEnabled);
          break;
        case 'storm':
          updateFilter('showStorms', isEnabled);
          break;
        case 'news':
          updateFilter('showNews', isEnabled);
          break;
        case 'conflict':
          updateFilter('showConflicts', isEnabled);
          break;
        case 'unrest':
          updateFilter('showUnrest', isEnabled);
          break;
      }
      
      return updated;
    });
  }, [isPro, updateFilter]);

  const handleMarkerPress = useCallback((_id: string) => {
    // Panel WorldMapNative içinde handle ediliyor
    // Web'de de WorldMapWeb içinde handle ediliyor
  }, []);

  // Loading state while PRO status is being determined
  if (isPro === null) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color="#00FF64" size="large" />
        <Text style={{ color: '#00FF64', marginTop: 12, fontFamily: MONO, fontSize: 12 }}>VERIFYING ACCESS...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView events={visibleEvents} onMarkerPress={handleMarkerPress} />

      <View style={[
        styles.topBar,
        deviceInfo.type === 'tablet' && styles.topBarTablet
      ]}>
        <Text style={[
          styles.appTitle,
          deviceInfo.type === 'tablet' && styles.appTitleTablet
        ]}>WORLD MONITOR</Text>
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      </View>

      <View style={[
        styles.bottomBar,
        deviceInfo.type === 'tablet' && styles.bottomBarTablet
      ]}>
        <View style={[
          styles.legend,
          deviceInfo.type === 'tablet' && styles.legendTablet
        ]}>
          {CATEGORY_LEGEND.map((item) => {
            const isLocked = !isPro && (item.category === 'conflict' || item.category === 'unrest');
            return (
              <View key={item.category} style={[
                styles.legendItem, 
                isLocked && { opacity: 0.3 },
                deviceInfo.type === 'tablet' && styles.legendItemTablet
              ]}>
                <View style={[
                  styles.legendDot, 
                  { backgroundColor: item.color },
                  deviceInfo.type === 'tablet' && styles.legendDotTablet
                ]} />
                <Text style={[
                  styles.legendLabel,
                  deviceInfo.type === 'tablet' && styles.legendLabelTablet
                ]}>{item.label}</Text>
              </View>
            );
          })}
        </View>
        <Pressable style={[
          styles.filterButton,
          deviceInfo.type === 'tablet' && styles.filterButtonTablet
        ]} onPress={() => setFilterSheetVisible(true)}>
          <Text style={[
            styles.filterButtonText,
            deviceInfo.type === 'tablet' && styles.filterButtonTextTablet
          ]}>⚙ FILTER</Text>
        </Pressable>
      </View>

      <RefreshFAB onRefresh={refetch} isLoading={isLoading} />

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <View style={[
          styles.paginationContainer,
          deviceInfo.type === 'tablet' && styles.paginationContainerTablet
        ]}>
          <Pressable 
            style={[styles.paginationButton, currentPage === 1 && styles.paginationButtonDisabled]}
            onPress={handlePrevPage}
            disabled={currentPage === 1}
          >
            <Text style={[styles.paginationButtonText, currentPage === 1 && styles.paginationButtonTextDisabled]}>←</Text>
          </Pressable>
          
          <View style={styles.paginationInfo}>
            <Text style={styles.paginationText}>{currentPage}/{totalPages}</Text>
            <Text style={styles.paginationSubtext}>{allVisibleEvents.length} events</Text>
          </View>
          
          <Pressable 
            style={[styles.paginationButton, currentPage === totalPages && styles.paginationButtonDisabled]}
            onPress={handleNextPage}
            disabled={currentPage === totalPages}
          >
            <Text style={[styles.paginationButtonText, currentPage === totalPages && styles.paginationButtonTextDisabled]}>→</Text>
          </Pressable>
          
          {currentPage > 1 && (
            <Pressable style={styles.latestButton} onPress={handleLatestPage}>
              <Text style={styles.latestButtonText}>LATEST</Text>
            </Pressable>
          )}
        </View>
      )}

      <BottomFilterSheet
        isVisible={filterSheetVisible}
        onClose={() => setFilterSheetVisible(false)}
        selectedCategories={selectedCategories}
        onToggleCategory={handleToggleCategory}
        disabledCategories={disabledCategories}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  topBar: {
    position: 'absolute', top: 0, left: 0, right: 0,
    paddingTop: 52, paddingHorizontal: 16, paddingBottom: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  topBarTablet: {
    paddingTop: 60,
    paddingHorizontal: 32,
    paddingBottom: 16,
  },
  appTitle: { fontSize: 18, fontWeight: '800', color: '#FFF', letterSpacing: 3, fontFamily: MONO },
  appTitleTablet: {
    fontSize: 24,
    letterSpacing: 4,
  },
  liveBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(0,255,100,0.12)', borderWidth: 1, borderColor: '#00FF64',
    borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4, gap: 6,
  },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#00FF64' },
  liveText: { color: '#00FF64', fontSize: 11, fontWeight: '800', letterSpacing: 1.5, fontFamily: MONO },
  bottomBar: {
    position: 'absolute', bottom: 20, left: 0, right: 0,
    paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: 'rgba(0,0,0,0.65)', gap: 8,
  },
  bottomBarTablet: {
    bottom: 32,
    paddingHorizontal: 32,
    paddingVertical: 16,
    gap: 12,
  },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  legendTablet: {
    gap: 16,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendItemTablet: {
    gap: 8,
  },
  legendDot: { width: 10, height: 10, borderRadius: 2 },
  legendDotTablet: {
    width: 14,
    height: 14,
    borderRadius: 3,
  },
  legendLabel: { color: '#CCC', fontSize: 9, fontWeight: '700', letterSpacing: 0.8, fontFamily: MONO },
  legendLabelTablet: {
    fontSize: 12,
    letterSpacing: 1,
  },
  filterButton: {
    alignSelf: 'flex-end', borderWidth: 1, borderColor: '#00FF6440',
    borderRadius: 4, paddingHorizontal: 10, paddingVertical: 4,
  },
  filterButtonTablet: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  filterButtonText: { color: '#00FF64', fontSize: 11, fontWeight: '700', letterSpacing: 1, fontFamily: MONO },
  filterButtonTextTablet: {
    fontSize: 14,
    letterSpacing: 1.5,
  },
  paginationContainer: {
    position: 'absolute',
    top: 52,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,255,100,0.3)',
  },
  paginationContainerTablet: {
    top: 60,
    right: 32,
    padding: 12,
    gap: 12,
  },
  paginationButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: 'rgba(0,255,100,0.15)',
    borderWidth: 1,
    borderColor: '#00FF64',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paginationButtonDisabled: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderColor: 'rgba(255,255,255,0.2)',
  },
  paginationButtonText: {
    color: '#00FF64',
    fontSize: 16,
    fontWeight: '800',
  },
  paginationButtonTextDisabled: {
    color: 'rgba(255,255,255,0.3)',
  },
  paginationInfo: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  paginationText: {
    color: '#00FF64',
    fontSize: 13,
    fontWeight: '800',
    fontFamily: MONO,
    letterSpacing: 1,
  },
  paginationSubtext: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 9,
    fontWeight: '600',
    fontFamily: MONO,
    marginTop: 2,
  },
  latestButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#FF4D00',
    borderWidth: 1,
    borderColor: '#FF6B00',
  },
  latestButtonText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    fontFamily: MONO,
  },
});
