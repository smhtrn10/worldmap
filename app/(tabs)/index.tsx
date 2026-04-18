import React, { useCallback, useState, useEffect } from 'react';
import { StyleSheet, View, Text, Platform, Pressable, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '@/constants/colors';
import { fetchAllEvents } from '@/services/api';
import { useFilters } from '@/context/FilterContext';
import { useFilteredEvents } from '@/hooks/useFilteredEvents';
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
  const { filters, isPro } = useFilters();
  const deviceInfo = useDeviceType();

  // Show paywall modal on first launch after onboarding
  useEffect(() => {
    const checkFirstLaunch = async () => {
      try {
        const hasSeenPaywall = await AsyncStorage.getItem('@worldpulse_paywall_shown');
        if (!hasSeenPaywall && isPro === false) {
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

  const [selectedCategories, setSelectedCategories] = useState<EventCategory[]>(() => {
    const base: EventCategory[] = ['earthquake', 'wildfire', 'flood', 'volcano', 'storm', 'news'];
    return base; // start with base; conflict/unrest added via effect when isPro resolves
  });

  const { data: events = [], isLoading, refetch } = useQuery({
    queryKey: ['all-events', isPro],
    queryFn: () => fetchAllEvents(!!isPro),
    refetchInterval: 5 * 60 * 1000,
    enabled: isPro !== null, // don't fetch until PRO status is known
  });

  const filteredEvents = useFilteredEvents(events, filters, isPro ?? false);

  // When isPro resolves from null → true, add conflict/unrest to selected categories
  React.useEffect(() => {
    if (isPro === true) {
      setSelectedCategories((prev) => {
        const proCategories: EventCategory[] = ['conflict', 'unrest'];
        const missing = proCategories.filter((c) => !prev.includes(c));
        return missing.length > 0 ? [...missing, ...prev] : prev;
      });
    }
  }, [isPro]);

  const visibleEvents = filteredEvents.filter(
    (e) => selectedCategories.includes(e.category) && e.coordinates !== null
  );

  const handleToggleCategory = useCallback((category: EventCategory) => {
    if (isPro === false && (category === 'conflict' || category === 'unrest')) {
      return;
    }
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    );
  }, [isPro]);

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
});
