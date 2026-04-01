import React, { useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  Share,
  Linking,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Share2, MapPin, ExternalLink, ChevronLeft } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { fetchAllEvents } from '@/services/api';
import { useFilters } from '@/context/FilterContext';
import {
  formatTimeAgo,
  getCategoryEmoji,
  getCategoryLabel,
  getSeverityLabel,
  getMarkerColor,
} from '@/utils/formatters';
import { MiniMap } from '@/components/MiniMap';

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { isPro } = useFilters();
  const { data: events, isLoading } = useQuery({
    queryKey: ['all-events', isPro],
    queryFn: () => fetchAllEvents(!!isPro),
  });

  const event = useMemo(() => {
    return events?.find(e => e.id === id);
  }, [events, id]);

  const handleShare = useCallback(async () => {
    if (!event) return;
    
    try {
      await Share.share({
        title: event.title,
        message: `${event.title}\n\n${event.description || ''}\n\nShared via WorldPulse`,
        url: event.sourceUrl,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  }, [event]);

  const handleOpenInMaps = useCallback(() => {
    if (!event?.coordinates) return;
    
    const { latitude, longitude } = event.coordinates;
    const url = Platform.select({
      ios: `maps:0,0?q=${latitude},${longitude}`,
      android: `geo:0,0?q=${latitude},${longitude}`,
    });
    
    if (url) {
      void Linking.openURL(url);
    }
  }, [event]);

  const handleOpenSource = useCallback(() => {
    if (event?.sourceUrl) {
      void Linking.openURL(event.sourceUrl);
    }
  }, [event]);

  if (isLoading || !event) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  const severityColor = (() => {
    switch (event.severity) {
      case 'critical': return Colors.severity.critical;
      case 'high': return Colors.severity.high;
      case 'medium': return Colors.severity.medium;
      case 'low': return Colors.severity.low;
      default: return Colors.textMuted;
    }
  })();

  const markerColor = getMarkerColor(event.category, event.magnitude);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Event Details
        </Text>
        <Pressable onPress={handleShare} style={styles.shareButton}>
          <Share2 size={20} color={Colors.text} />
        </Pressable>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.iconSection}>
          <View style={[styles.iconContainer, { backgroundColor: markerColor + '20' }]}>
            <Text style={styles.icon}>{getCategoryEmoji(event.category)}</Text>
          </View>
          <View style={[styles.categoryBadge, { backgroundColor: markerColor + '20' }]}>
            <Text style={[styles.categoryText, { color: markerColor }]}>
              {getCategoryLabel(event.category)}
            </Text>
          </View>
        </View>

        <Text style={styles.title}>{event.title}</Text>

        <View style={styles.metaRow}>
          <View style={[styles.severityBadge, { backgroundColor: severityColor + '20' }]}>
            <Text style={[styles.severityText, { color: severityColor }]}>
              {getSeverityLabel(event.severity)}
            </Text>
          </View>
          <Text style={styles.time}>{formatTimeAgo(event.timestamp)}</Text>
        </View>

        {event.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{event.description}</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          <View style={styles.locationCard}>
            <MapPin size={18} color={Colors.accent.primary} />
            <Text style={styles.locationText}>
              {event.location || 'Unknown location'}
            </Text>
          </View>
        </View>

        {event.coordinates && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Map</Text>
            <View style={styles.mapContainer}>
              <MiniMap
                latitude={event.coordinates.latitude}
                longitude={event.coordinates.longitude}
                markerColor={markerColor}
              />
              <Pressable style={styles.openMapsButton} onPress={handleOpenInMaps}>
                <ExternalLink size={16} color={Colors.text} />
                <Text style={styles.openMapsText}>Open in Maps</Text>
              </Pressable>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Source</Text>
          <Pressable style={styles.sourceCard} onPress={handleOpenSource}>
            <View>
              <Text style={styles.sourceName}>
                {event.source === 'usgs' && 'USGS Earthquake Hazards'}
                {event.source === 'eonet' && 'NASA EONET'}
                {event.source === 'bbc' && 'BBC World News'}
              </Text>
              <Text style={styles.sourceTime}>
                Updated {formatTimeAgo(event.timestamp)}
              </Text>
            </View>
            <ExternalLink size={18} color={Colors.textSecondary} />
          </Pressable>
        </View>

        {event.magnitude && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Magnitude</Text>
            <View style={styles.magnitudeCard}>
              <Text style={styles.magnitudeValue}>M{event.magnitude.toFixed(1)}</Text>
              <Text style={styles.magnitudeLabel}>Richter Scale</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 12,
    backgroundColor: Colors.background,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  iconSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 28,
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 12,
    lineHeight: 32,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  severityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  severityText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  time: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  description: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 24,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  locationText: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
  },
  mapContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  map: {
    height: 200,
    width: '100%',
  },
  marker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.background,
  },
  openMapsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.card,
    padding: 12,
    gap: 8,
  },
  openMapsText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  sourceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sourceName: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.text,
  },
  sourceTime: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 4,
  },
  magnitudeCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  magnitudeValue: {
    fontSize: 36,
    fontWeight: '700',
    color: Colors.accent.primary,
  },
  magnitudeLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
  },
});
