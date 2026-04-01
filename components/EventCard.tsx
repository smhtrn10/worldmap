import React, { useCallback } from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import type { WorldEvent } from '@/types/events';
import { formatTimeAgo, getCategoryEmoji, getSeverityLabel } from '@/utils/formatters';
import { BlurView } from 'expo-blur';
import { useFilters } from '@/context/FilterContext';
import { Lock } from 'lucide-react-native';

interface EventCardProps {
  event: WorldEvent;
}

export function EventCard({ event }: EventCardProps) {
  const router = useRouter();
  const { isPro } = useFilters();
  const isLocked = isPro === false && (event.category === 'conflict' || event.category === 'unrest');

  const handlePress = useCallback(() => {
    if (isLocked) {
      router.push('/paywall' as any);
      return;
    }
    router.push({
      pathname: '/event/[id]',
      params: { id: event.id },
    });
  }, [router, event.id, isLocked]);

  const getSeverityColor = () => {
    switch (event.severity) {
      case 'critical':
        return Colors.severity.critical;
      case 'high':
        return Colors.severity.high;
      case 'medium':
        return Colors.severity.medium;
      case 'low':
        return Colors.severity.low;
      default:
        return Colors.textMuted;
    }
  };

  const getCategoryColor = () => {
    switch (event.category) {
      case 'conflict':
        return Colors.category.conflict;
      case 'unrest':
        return Colors.category.unrest;
      case 'earthquake':
        return Colors.category.earthquake;
      case 'wildfire':
        return Colors.category.wildfire;
      case 'flood':
        return Colors.category.flood;
      case 'volcano':
        return Colors.category.volcano;
      case 'storm':
        return Colors.category.storm;
      case 'news':
        return Colors.category.news;
      default:
        return Colors.category.other;
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.container,
        pressed && !isLocked && styles.pressed,
        isLocked && styles.lockedContainer,
      ]}
      testID="event-card"
    >
      <View style={[styles.iconContainer, { backgroundColor: getCategoryColor() + '20' }]}>
        <Text style={styles.icon}>{getCategoryEmoji(event.category)}</Text>
      </View>
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}>
            {isLocked ? '━━━━━━ RESTRICTED ━━━━━━' : event.title}
          </Text>
          {isLocked ? (
            <View style={styles.proBadge}>
              <Text style={styles.proBadgeText}>PRO</Text>
            </View>
          ) : (
            <View style={[styles.badge, { backgroundColor: getSeverityColor() + '20' }]}>
              <Text style={[styles.badgeText, { color: getSeverityColor() }]}>
                {getSeverityLabel(event.severity)}
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.footer}>
          <Text style={styles.location} numberOfLines={1}>
            {isLocked ? 'LOCATION HIDDEN' : (event.location || 'Unknown location')}
          </Text>
          <Text style={styles.time}>
            {formatTimeAgo(event.timestamp)}
          </Text>
        </View>

        {isLocked && (
          <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill}>
            <View style={styles.lockOverlay}>
              <Lock size={16} color="#FFD700" />
              <Text style={styles.unlockText}>Unlock with PRO</Text>
            </View>
          </BlurView>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pressed: {
    opacity: 0.8,
    backgroundColor: Colors.cardHover,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 24,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    marginRight: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  location: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
    marginRight: 8,
  },
  time: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  lockedContainer: {
    borderColor: '#FFD70040',
    overflow: 'hidden',
  },
  proBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  proBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#000',
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    gap: 4,
  },
  unlockText: {
    color: '#FFD700',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
