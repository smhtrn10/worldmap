import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Colors } from '@/constants/colors';
import { useFilters } from '@/context/FilterContext';
import type { EventCategory } from '@/types/events';

interface FilterOption {
  category: EventCategory;
  emoji: string;
  labelKey: string;
  color: string;
}

const OPTIONS: FilterOption[] = [
  { category: 'conflict',   emoji: '💥', labelKey: 'Conflicts',  color: Colors.category.conflict },
  { category: 'unrest',     emoji: '✊', labelKey: 'Unrest',     color: Colors.category.unrest },
  { category: 'earthquake', emoji: '⚡', labelKey: 'Earthquakes',color: Colors.category.earthquake },
  { category: 'wildfire',   emoji: '🔥', labelKey: 'Wildfires',  color: Colors.category.wildfire },
  { category: 'flood',      emoji: '🌊', labelKey: 'Floods',     color: Colors.category.flood },
  { category: 'volcano',    emoji: '🌋', labelKey: 'Volcanoes',  color: Colors.category.volcano },
  { category: 'storm',      emoji: '⛈️', labelKey: 'Storms',     color: Colors.category.storm },
  { category: 'news',       emoji: '📡', labelKey: 'News',       color: Colors.category.news },
];

interface BottomFilterSheetProps {
  isVisible: boolean;
  onClose: () => void;
  selectedCategories: EventCategory[];
  onToggleCategory: (category: EventCategory) => void;
  disabledCategories?: EventCategory[];
}

export function BottomFilterSheet({
  isVisible,
  onClose,
  selectedCategories,
  onToggleCategory,
  disabledCategories = []
}: BottomFilterSheetProps) {
  const { isPro, filters } = useFilters();
  const slideAnim = useRef(new Animated.Value(500)).current;

  useEffect(() => {
    if (isVisible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        friction: 8,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 500,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [isVisible, slideAnim]);

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose} />
      <Animated.View
        style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}
      >
        <View style={styles.handle} />
        <Text style={styles.title}>Filter Events</Text>

        {OPTIONS.map((opt) => {
          // Use settings filters to determine if category is active
          let isSelected = false;
          switch (opt.category) {
            case 'earthquake': isSelected = filters.showEarthquakes; break;
            case 'wildfire': isSelected = filters.showWildfires; break;
            case 'flood': isSelected = filters.showFloods; break;
            case 'volcano': isSelected = filters.showVolcanoes; break;
            case 'storm': isSelected = filters.showStorms; break;
            case 'news': isSelected = filters.showNews; break;
            case 'conflict': isSelected = filters.showConflicts; break;
            case 'unrest': isSelected = filters.showUnrest; break;
          }
          
          const isLocked = isPro === false && (opt.category === 'conflict' || opt.category === 'unrest');
          const isDisabled = disabledCategories.includes(opt.category);
          
          return (
            <Pressable
              key={opt.category}
              style={[styles.option, (isLocked || isDisabled) && { opacity: 0.5 }]}
              onPress={() => !isLocked && !isDisabled && onToggleCategory(opt.category)}
            >
              <View style={[styles.dot, { backgroundColor: opt.color }]} />
              <Text style={styles.emoji}>{opt.emoji}</Text>
              <Text style={styles.label}>{opt.labelKey}</Text>
              {isLocked && (
                <View style={styles.proBadge}>
                  <Text style={styles.proBadgeText}>PRO</Text>
                </View>
              )}
              <View
                style={[
                  styles.checkbox,
                  isSelected && { backgroundColor: Colors.accent.primary, borderColor: Colors.accent.primary },
                  isLocked && { borderColor: Colors.border + '40' }
                ]}
              >
                {isSelected && !isLocked && <Text style={styles.checkIcon}>✓</Text>}
              </View>
            </Pressable>
          );
        })}

        <Pressable style={styles.doneButton} onPress={onClose}>
          <Text style={styles.doneText}>Done</Text>
        </Pressable>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    paddingHorizontal: 16,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 16,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  emoji: {
    fontSize: 20,
  },
  label: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkIcon: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  doneButton: {
    backgroundColor: Colors.accent.primary,
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
    alignItems: 'center',
  },
  doneText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  proBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  proBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#000',
  },
});
