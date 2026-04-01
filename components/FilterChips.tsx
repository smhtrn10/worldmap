import React from 'react';
import { ScrollView, StyleSheet, View, Text, Pressable } from 'react-native';
import { Colors } from '@/constants/colors';
import type { EventCategory } from '@/types/events';
import { Lock } from 'lucide-react-native';
import { useFilters } from '@/context/FilterContext';

interface FilterChipsProps {
  selectedCategories: EventCategory[];
  onToggleCategory: (category: EventCategory) => void;
  disabledCategories?: EventCategory[];
}

const categories: { key: EventCategory; labelKey: string; color: string }[] = [
  { key: 'conflict',   labelKey: 'Conflicts',   color: Colors.category.conflict },
  { key: 'unrest',     labelKey: 'Unrest',      color: Colors.category.unrest },
  { key: 'news',       labelKey: 'News',        color: Colors.category.news },
  { key: 'earthquake', labelKey: 'Earthquakes', color: Colors.category.earthquake },
  { key: 'wildfire',   labelKey: 'Wildfires',   color: Colors.category.wildfire },
  { key: 'flood',      labelKey: 'Floods',      color: Colors.category.flood },
  { key: 'volcano',    labelKey: 'Volcanoes',   color: Colors.category.volcano },
  { key: 'storm',      labelKey: 'Storms',      color: Colors.category.storm },
];

export function FilterChips({ 
  selectedCategories, 
  onToggleCategory,
  disabledCategories = []
}: FilterChipsProps) {
  const { isPro } = useFilters();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
      style={styles.scrollView}
    >
      {categories.map((category) => {
        const isSelected = selectedCategories.includes(category.key);
        const isDisabled = disabledCategories.includes(category.key);
        return (
          <Pressable
            key={category.key}
            onPress={() => !isDisabled && onToggleCategory(category.key)}
            style={[
              styles.chip,
              isSelected && { backgroundColor: category.color + '30', borderColor: category.color },
              isDisabled && { opacity: 0.4 },
            ]}
            testID={`filter-chip-${category.key}`}
          >
            <View style={[styles.dot, { backgroundColor: category.color }]} />
            <Text
              style={[
                styles.label,
                isSelected && { color: Colors.text },
              ]}
            >
              {category.labelKey}
            </Text>
            {isPro === false && (category.key === 'conflict' || category.key === 'unrest') && (
              <Lock size={10} color={Colors.textMuted} style={{ marginLeft: 4 }} />
            )}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    maxHeight: 56,
  },
  container: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
});
