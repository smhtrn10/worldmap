import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Switch,
  Pressable,
  Linking,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { useFilters } from '@/context/FilterContext';
import { useDeviceType } from '@/hooks/useDeviceType';
import { getCategoryEmoji, getCategoryLabel } from '@/utils/formatters';
import { defaultFilters } from '@/context/FilterContext';
import type { EventCategory, FilterSettings } from '@/types/events';
import { LinearGradient } from 'expo-linear-gradient';
import { Star, ChevronRight, Heart } from 'lucide-react-native';
import { ReviewManager } from '@/utils/reviewManager';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CATEGORIES: { key: EventCategory; filterKey: keyof FilterSettings }[] = [
  { key: 'conflict',   filterKey: 'showConflicts' },
  { key: 'unrest',     filterKey: 'showUnrest' },
  { key: 'earthquake', filterKey: 'showEarthquakes' },
  { key: 'wildfire',   filterKey: 'showWildfires' },
  { key: 'flood',      filterKey: 'showFloods' },
  { key: 'volcano',    filterKey: 'showVolcanoes' },
  { key: 'storm',      filterKey: 'showStorms' },
  { key: 'news',       filterKey: 'showNews' },
];

export default function SettingsScreen() {
  const router = useRouter();
  const { filters, updateFilter, resetFilters, isPro } = useFilters();
  const deviceInfo = useDeviceType();
  
  if (isPro === null) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={Colors.accent.primary} size="large" />
        <Text style={{ color: Colors.textSecondary, marginTop: 12, fontSize: 13 }}>Verifying Access...</Text>
      </View>
    );
  }

  const getCategoryColor = (category: EventCategory) => {
    switch (category) {
      case 'earthquake': return Colors.category.earthquake;
      case 'wildfire': return Colors.category.wildfire;
      case 'flood': return Colors.category.flood;
      case 'volcano': return Colors.category.volcano;
      case 'storm': return Colors.category.storm;
      case 'news': return Colors.category.news;
      case 'conflict': return Colors.category.conflict;
      case 'unrest': return Colors.category.unrest;
      default: return Colors.category.other;
    }
  };

  const handleRateApp = async () => {
    if (Platform.OS === 'ios') {
      await ReviewManager.openAppStore();
    } else {
      Alert.alert(
        'Rate WorldPulse',
        'Would you like to rate us on the App Store?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Rate Now', 
            onPress: () => ReviewManager.openAppStore()
          }
        ]
      );
    }
  };

  const handleResetOnboarding = async () => {
    Alert.alert(
      '🔄 Reset Onboarding',
      'This will restart the onboarding flow. This is a dev feature.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.multiRemove([
                '@worldpulse_onboarding_completed',
                '@worldpulse_paywall_shown'
              ]);
              Alert.alert('✅ Success', 'Onboarding reset! Restart the app to see it again.');
            } catch (error) {
              Alert.alert('❌ Error', 'Failed to reset onboarding');
            }
          }
        }
      ]
    );
  };

  const handleResetProStatus = async () => {
    Alert.alert(
      '🔓 Reset PRO Status',
      'This will clear your PRO status cache and set you to FREE. This is a dev feature.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset to FREE',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.multiRemove([
                '@worldpulse_is_pro_status',
                '@worldpulse_paywall_shown',
                '@conflict_last_fetch',
                '@conflict_cached_events'
              ]);
              Alert.alert('✅ Success', 'PRO status cleared! Restart the app to see FREE mode.');
            } catch (error) {
              Alert.alert('❌ Error', 'Failed to reset PRO status');
            }
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={[
      styles.content,
      deviceInfo.type === 'tablet' && styles.contentTablet
    ]}>
      <View style={[
        styles.header,
        deviceInfo.type === 'tablet' && styles.headerTablet
      ]}>
        <View style={styles.titleRow}>
          <Text style={[
            styles.title,
            deviceInfo.type === 'tablet' && styles.titleTablet
          ]}>Settings</Text>
          <View style={[styles.statusBadge, isPro ? styles.proBadgeContainer : styles.freeBadgeContainer]}>
            <Text style={[styles.statusBadgeText, isPro ? styles.proBadgeText : styles.freeBadgeText]}>
              {isPro ? 'PRO' : 'FREE'}
            </Text>
          </View>
        </View>
        <Text style={[
          styles.subtitle,
          deviceInfo.type === 'tablet' && styles.subtitleTablet
        ]}>Customize your experience</Text>
      </View>

      {!isPro && (
        <Pressable 
          style={styles.upgradeBanner} 
          onPress={() => router.push('/paywall' as any)}
        >
          <LinearGradient
            colors={['#FFD700', '#FFA500']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.upgradeGradient}
          >
            <View style={styles.upgradeLeft}>
              <View style={styles.upgradeIconContainer}>
                <Star size={20} color="#000" fill="#000" />
              </View>
              <View>
                <Text style={styles.upgradeTitle}>Upgrade to PRO</Text>
                <Text style={styles.upgradeSubtitle}>Unlock Conflict & Unrest Maps</Text>
              </View>
            </View>
            <ChevronRight size={20} color="#000" />
          </LinearGradient>
        </Pressable>
      )}


      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Event Categories</Text>
        <Text style={styles.sectionDescription}>
          Choose which types of events to display
        </Text>
        
        <View style={styles.card}>
          {CATEGORIES.map((cat, index) => (
            <View
              key={cat.key}
              style={[
                styles.settingRow,
                index !== CATEGORIES.length - 1 && styles.settingRowBorder,
                !isPro && (cat.key === 'conflict' || cat.key === 'unrest') && { opacity: 0.5 }
              ]}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.iconContainer, { backgroundColor: getCategoryColor(cat.key) + '20' }]}>
                  <Text style={styles.icon}>{getCategoryEmoji(cat.key)}</Text>
                </View>
                <Text style={styles.settingLabel}>{getCategoryLabel(cat.key)}</Text>
                {!isPro && (cat.key === 'conflict' || cat.key === 'unrest') && (
                  <View style={styles.proBadge}>
                    <Text style={styles.proBadgeText}>PRO</Text>
                  </View>
                )}
              </View>
              <Switch
                disabled={!isPro && (cat.key === 'conflict' || cat.key === 'unrest')}
                value={filters[cat.filterKey] as boolean}
                onValueChange={(value) => {
                  updateFilter(cat.filterKey, value);
                }}
                trackColor={{ false: Colors.border, true: Colors.accent.primary + '80' }}
                thumbColor={filters[cat.filterKey] ? Colors.accent.primary : Colors.textMuted}
              />
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Earthquake Filter</Text>
        <Text style={styles.sectionDescription}>
          Minimum magnitude: {filters.minMagnitude.toFixed(1)}
        </Text>
        
        <View style={styles.card}>
          <View style={styles.sliderContainer}>
            <Pressable
              style={styles.sliderButton}
              onPress={() => updateFilter('minMagnitude', Math.max(3.5, filters.minMagnitude - 0.5))}
            >
              <Text style={styles.sliderButtonText}>−</Text>
            </Pressable>
            <View style={styles.sliderValue}>
              <Text style={styles.sliderValueText}>
                M{filters.minMagnitude.toFixed(1)}
              </Text>
            </View>
            <Pressable
              style={styles.sliderButton}
              onPress={() => updateFilter('minMagnitude', Math.min(8, filters.minMagnitude + 0.5))}
            >
              <Text style={styles.sliderButtonText}>+</Text>
            </Pressable>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data Sources</Text>
        <View style={styles.card}>
          <Pressable
            style={[styles.sourceRow, styles.sourceRowBorder]}
            onPress={() => Linking.openURL('https://earthquake.usgs.gov')}
          >
            <View>
              <Text style={styles.sourceName}>USGS Earthquake Hazards</Text>
              <Text style={styles.sourceUrl}>earthquake.usgs.gov</Text>
            </View>
            <Text style={styles.externalLink}>→</Text>
          </Pressable>
          
          <Pressable
            style={styles.sourceRow}
            onPress={() => Linking.openURL('https://eonet.gsfc.nasa.gov')}
          >
            <View>
              <Text style={styles.sourceName}>NASA EONET</Text>
              <Text style={styles.sourceUrl}>eonet.gsfc.nasa.gov</Text>
            </View>
            <Text style={styles.externalLink}>→</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>
        <View style={styles.card}>
          <Pressable
            style={styles.sourceRow}
            onPress={handleRateApp}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: '#FF6B6B20' }]}>
                <Heart size={18} color="#FF6B6B" fill="#FF6B6B" />
              </View>
              <View>
                <Text style={styles.sourceName}>Rate WorldPulse</Text>
                <Text style={styles.sourceUrl}>Help us improve with your feedback</Text>
              </View>
            </View>
            <Text style={styles.externalLink}>→</Text>
          </Pressable>
        </View>
      </View>

      {__DEV__ && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Developer Tools</Text>
          <View style={styles.card}>
            <Pressable
              style={[styles.sourceRow, styles.sourceRowBorder]}
              onPress={handleResetOnboarding}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.iconContainer, { backgroundColor: '#FFA50020' }]}>
                  <Text style={styles.icon}>🔄</Text>
                </View>
                <View>
                  <Text style={styles.sourceName}>Reset Onboarding</Text>
                  <Text style={styles.sourceUrl}>Restart the welcome flow</Text>
                </View>
              </View>
              <Text style={styles.externalLink}>→</Text>
            </Pressable>
            <Pressable
              style={styles.sourceRow}
              onPress={handleResetProStatus}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.iconContainer, { backgroundColor: '#FF6B6B20' }]}>
                  <Text style={styles.icon}>🔓</Text>
                </View>
                <View>
                  <Text style={styles.sourceName}>Reset PRO Status</Text>
                  <Text style={styles.sourceUrl}>Clear cache and set to FREE</Text>
                </View>
              </View>
              <Text style={styles.externalLink}>→</Text>
            </Pressable>
          </View>
        </View>
      )}

      <Pressable style={styles.resetButton} onPress={() => void resetFilters()}>
        <Text style={styles.resetButtonText}>Reset All Filters</Text>
      </Pressable>

      <View style={styles.footer}>
        <Pressable 
          onLongPress={() => router.push('/review-debug' as any)}
          delayLongPress={2000}
        >
          <Text style={styles.footerText}>WorldPulse v1.0.0</Text>
        </Pressable>
        <Text style={styles.footerSubtext}>Real-time global intelligence</Text>
        <View style={styles.footerLinks}>
          <Pressable onPress={() => Linking.openURL('https://www.apple.com/legal/internet-services/itunes/dev/stdeula/')}>
            <Text style={styles.footerLink}>Terms of Use</Text>
          </Pressable>
          <Text style={styles.footerDot}>·</Text>
          <Pressable onPress={() => Linking.openURL('https://semihtrn4.github.io/worldpulse_privacy/')}>
            <Text style={styles.footerLink}>Privacy Policy</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingBottom: 40,
  },
  contentTablet: {
    paddingBottom: 60,
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 24,
  },
  headerTablet: {
    paddingHorizontal: 32,
    paddingTop: 80,
    paddingBottom: 32,
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: Colors.textMuted,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  settingRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 18,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 16,
  },
  sliderButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sliderButtonText: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.text,
  },
  sliderValue: {
    minWidth: 80,
    alignItems: 'center',
  },
  sliderValueText: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.accent.primary,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  sourceRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  sourceName: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.text,
  },
  sourceUrl: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 2,
  },
  externalLink: {
    fontSize: 18,
    color: Colors.textSecondary,
  },
  resetButton: {
    marginHorizontal: 16,
    marginTop: 8,
    padding: 16,
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.severity.critical + '40',
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.severity.critical,
  },
  footer: {
    alignItems: 'center',
    marginTop: 32,
  },
  footerText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  footerSubtext: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 4,
  },
  footerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  footerLink: {
    fontSize: 12,
    color: Colors.textMuted,
    textDecorationLine: 'underline',
  },
  footerDot: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  proBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  upgradeBanner: {
    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#FFA500',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  upgradeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  upgradeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  upgradeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  upgradeTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#000',
  },
  upgradeSubtitle: {
    fontSize: 13,
    color: 'rgba(0,0,0,0.6)',
    fontWeight: '600',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  proBadgeContainer: {
    backgroundColor: 'rgba(255,215,0,0.1)',
    borderColor: '#FFD700',
  },
  freeBadgeContainer: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderColor: 'rgba(255,255,255,0.2)',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  proBadgeText: {
    color: '#FFD700',
  },
  freeBadgeText: {
    color: 'rgba(255,255,255,0.4)',
  },
});
