import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Colors } from '@/constants/colors';
import { fetchAllEvents } from '@/services/api';
import { useFilters } from '@/context/FilterContext';
import { useFilteredEvents } from '@/hooks/useFilteredEvents';
import { useDeviceType } from '@/hooks/useDeviceType';
import { EventCard } from '@/components/EventCard';
import { SkeletonCard } from '@/components/SkeletonCard';
import { FilterChips } from '@/components/FilterChips';
import type { EventCategory, WorldEvent } from '@/types/events';

export default function ListScreen() {
  const deviceInfo = useDeviceType();
  const [selectedCategories, setSelectedCategories] = useState<EventCategory[]>([
    'conflict', 'unrest', 'earthquake', 'wildfire', 'flood', 'volcano', 'storm', 'news'
  ]);

  const { filters, isPro } = useFilters();
  
  if (isPro === null) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={Colors.accent.primary} size="large" />
      </View>
    );
  }

  const { data: events = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['all-events', isPro],
    queryFn: () => fetchAllEvents(!!isPro),
    refetchInterval: 5 * 60 * 1000,
  });

  const filteredEvents = useFilteredEvents(events, filters, isPro, true);

  const visibleEvents = filteredEvents.filter((e) =>
    selectedCategories.includes(e.category)
  );

  const handleToggleCategory = useCallback((category: EventCategory) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: WorldEvent }) => <EventCard event={item} />,
    []
  );

  const keyExtractor = useCallback((item: WorldEvent) => item.id, []);

  // iPad için grid layout
  const numColumns = deviceInfo.type === 'tablet' 
    ? (deviceInfo.isLandscape ? 3 : 2) 
    : 1;

  const ListHeader = (
    <View>
      <View style={[
        styles.header,
        deviceInfo.type === 'tablet' && styles.headerTablet
      ]}>
        <Text style={[
          styles.title,
          deviceInfo.type === 'tablet' && styles.titleTablet
        ]}>Events</Text>
        <Text style={[
          styles.subtitle,
          deviceInfo.type === 'tablet' && styles.subtitleTablet
        ]}>{visibleEvents.length} events worldwide</Text>
      </View>
      <FilterChips
        selectedCategories={selectedCategories}
        onToggleCategory={handleToggleCategory}
      />
    </View>
  );

  const ListEmpty = isLoading ? (
    <View>
      {Array.from({ length: 6 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </View>
  ) : (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>🌍</Text>
      <Text style={styles.emptyTitle}>No events found</Text>
      <Text style={styles.emptySubtitle}>Try adjusting your filters</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        key={`list-${numColumns}`} // Force re-render on column change
        data={visibleEvents}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        numColumns={numColumns}
        columnWrapperStyle={numColumns > 1 ? styles.columnWrapper : undefined}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmpty}
        contentContainerStyle={[
          styles.listContent,
          deviceInfo.type === 'tablet' && styles.listContentTablet
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={Colors.accent.primary}
            colors={[Colors.accent.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  listContent: {
    paddingBottom: 24,
  },
  listContentTablet: {
    paddingBottom: 40,
  },
  columnWrapper: {
    paddingHorizontal: 16,
    gap: 16,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 8,
  },
  headerTablet: {
    paddingHorizontal: 32,
    paddingTop: 80,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
  },
  titleTablet: {
    fontSize: 40,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  subtitleTablet: {
    fontSize: 18,
    marginTop: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
