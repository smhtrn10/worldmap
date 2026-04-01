import React from 'react';
import { StyleSheet, View, Text, Pressable, ScrollView } from 'react-native';
import { Colors } from '@/constants/colors';
import type { WorldEvent, EventCategory } from '@/types/events';

interface StatItem {
  category: EventCategory;
  emoji: string;
  labelKey: string;
  color: string;
}

const STATS: StatItem[] = [
  { category: 'conflict',   emoji: '💥', labelKey: 'Conflicts',  color: Colors.category.conflict },
  { category: 'unrest',     emoji: '✊', labelKey: 'Unrest',     color: Colors.category.unrest },
  { category: 'earthquake', emoji: '🔴', labelKey: 'Quakes',     color: Colors.category.earthquake },
  { category: 'wildfire',   emoji: '🔥', labelKey: 'Fires',      color: Colors.category.wildfire },
  { category: 'flood',      emoji: '🌊', labelKey: 'Floods',     color: Colors.category.flood },
  { category: 'volcano',    emoji: '🌋', labelKey: 'Volcanoes',  color: Colors.category.volcano },
  { category: 'storm',      emoji: '⛈️', labelKey: 'Storms',     color: Colors.category.storm },
  { category: 'news',       emoji: '📰', labelKey: 'News',       color: Colors.category.news },
];

interface StatsBarProps {
  events: WorldEvent[];
  selectedCategories: EventCategory[];
  onToggleCategory: (category: EventCategory) => void;
  onFilterPress?: () => void;
}

export function StatsBar({ events, selectedCategories, onToggleCategory }: StatsBarProps) {
  const counts = STATS.reduce<Record<EventCategory, number>>(
    (acc, stat) => {
      acc[stat.category] = events.filter((e) => e.category === stat.category).length;
      return acc;
    },
    {} as Record<EventCategory, number>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {STATS.map((stat) => {
          const isActive = selectedCategories.includes(stat.category);
          const count = counts[stat.category] ?? 0;
          return (
            <Pressable
              key={stat.category}
              onPress={() => onToggleCategory(stat.category)}
              style={[
                styles.statItem,
                isActive && { borderColor: stat.color, backgroundColor: stat.color + '15' },
              ]}
            >
              <Text style={styles.emoji}>{stat.emoji}</Text>
              <Text style={[styles.count, isActive && { color: stat.color }]}>{count}</Text>
              <Text style={styles.label}>{stat.labelKey}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card + 'CC',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
  },
  emoji: {
    fontSize: 14,
  },
  count: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  label: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
});
