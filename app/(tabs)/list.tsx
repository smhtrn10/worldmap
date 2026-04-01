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
import { EventCard } from '@/components/EventCard';
import { SkeletonCard } from '@/components/SkeletonCard';
import { FilterChips } from '@/components/FilterChips';
import type { EventCategory, WorldEvent } from '@/types/events';

export default function ListScreen() {
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

  const ListHeader = (
    <View>
      <View style={styles.header}>
        <Text style={styles.title}>Events</Text>
        <Text style={styles.subtitle}>{visibleEvents.length} events worldwide</Text>
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
        data={visibleEvents}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmpty}
        contentContainerStyle={styles.listContent}
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
  header: {
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
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
