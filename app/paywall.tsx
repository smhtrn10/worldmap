import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
  Linking,
  Animated,
  Easing,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { X, Check, Shield, Globe, Zap, Loader2, Lock, Flame, AlertTriangle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useQueryClient } from '@tanstack/react-query';
import { useFilters } from '@/context/FilterContext';
import { RevenueCatService } from '@/services/revenuecat';
import { PurchasesPackage, PACKAGE_TYPE } from 'react-native-purchases';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDeviceType } from '@/hooks/useDeviceType';
import { useVideoPlayer, VideoView } from 'expo-video';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── APP CONFIG ──────────────────────────────────────────────────────────────
const APP_CONFIG = {
  name: "World Plus",
  headline: "World Monitor Real-Time Intel",
  subtitle: "Elite intelligence network & strategic conflict mapping",
  counterVerb: "detecting live threats",
  ctaLabel: "Unlock Intelligence Access",
  trialDays: 3,
  accentColor: "#FF4D00", 
  gradientColors: ["#000000", "#050505", "#0a0a0a"] as const,
  benefits: [
    { icon: <Shield size={18} color="#FF4D00" />, text: "Global Conflict Network Access" },
    { icon: <Flame size={18} color="#FF4D00" />, text: "Real-time Strike & Fire Alerts" },
    { icon: <Globe size={18} color="#FF4D00" />, text: "Live Geographic Intelligence" },
    { icon: <Zap size={18} color="#FF4D00" />, text: "Instant High-Priority Notifications" },
    { icon: <Lock size={18} color="#FF4D00" />, text: "Secure End-to-End Intel Feed" },
  ],
};

const BASE_PLANS = [
  { id: 'WEEKLY', matchIds: ['$rc_weekly', 'weekly'], title: 'Weekly', fallbackPrice: '$1.99', period: 'week', sub: 'Critical intel access' },
  { id: 'MONTHLY', matchIds: ['$rc_monthly', 'monthly'], title: 'Monthly', fallbackPrice: '$4.99', period: 'month', sub: 'Strategic monitoring' },
  { id: 'ANNUAL', matchIds: ['$rc_annual', 'yearly'], title: 'Yearly', fallbackPrice: '$19.99', period: 'year', sub: 'Just $0.38/week', badge: 'ELITE ACCESS' },
];

const PLAN_TO_PACKAGE_TYPE: Record<string, PACKAGE_TYPE> = {
  'WEEKLY': PACKAGE_TYPE.WEEKLY,
  'MONTHLY': PACKAGE_TYPE.MONTHLY,
  'ANNUAL':  PACKAGE_TYPE.ANNUAL,
};

const VIDEO_SOURCE = require('@/assets/images/1.mp4');

export default function PaywallScreen() {
  const router = useRouter();
  const deviceInfo = useDeviceType();
  const { setIsPro } = useFilters();
  const queryClient = useQueryClient();
  
  const [selectedPlan, setSelectedPlan] = useState('ANNUAL');
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRestoring, setIsRestoring] = useState(false);
  const [showClose, setShowClose] = useState(false); // KATEGORİ 13: 7 saniye kuralı

  // Animations
  const [liveCount, setLiveCount] = useState(1362);
  const scanAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.5)).current;

  // Video Player
  const player = useVideoPlayer(VIDEO_SOURCE, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  // Enforce autoplay when screen is focused without blocking JS thread
  useFocusEffect(
    React.useCallback(() => {
      if (player) {
        setTimeout(() => {
          player.play();
        }, 150); // Give route transition time to finish
      }
    }, [player])
  );

  useEffect(() => {
    const loadOfferings = async () => {
      const available = await RevenueCatService.getOfferings();
      setPackages(available);
      setIsLoading(false);
    };
    loadOfferings();
  }, []);

  // Social proof drift
  useEffect(() => {
    const tick = () => {
      setLiveCount((n) => Math.max(1300, Math.min(1500, n + (Math.random() > 0.5 ? 1 : -1))));
      setTimeout(tick, Math.random() * 5000 + 3000);
    };
    const t = setTimeout(tick, 3000);
    return () => clearTimeout(t);
  }, []);

  // Main Loop Animations
  useEffect(() => {
    // Scan Line
    Animated.loop(
      Animated.timing(scanAnim, { toValue: 1, duration: 4000, easing: Easing.linear, useNativeDriver: true })
    ).start();

    // Node Pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.4, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,   duration: 800, useNativeDriver: true }),
      ])
    ).start();

    // Card Glow
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1,   duration: 2000, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.3, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // KATEGORİ 13: 7 saniye kuralı — Kapatma butonu gecikmeli görünsün
  useEffect(() => {
    const t = setTimeout(() => setShowClose(true), 7000);
    return () => clearTimeout(t);
  }, []);

  const scanTranslate = scanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-10, 260],
  });

  const handleContinue = async () => {
    const planConfig = BASE_PLANS.find(p => p.id === selectedPlan);
    const pkg = packages.find(p => p.packageType === PLAN_TO_PACKAGE_TYPE[selectedPlan] || planConfig?.matchIds.includes(p.identifier));
    if (!pkg) {
      if (__DEV__) {
        await AsyncStorage.setItem('@worldpulse_is_pro_status', JSON.stringify(true));
        setIsPro(true);
        void queryClient.invalidateQueries({ queryKey: ['all-events'] });
        router.back();
      }
      return;
    }
    setIsPurchasing(true);
    const success = await RevenueCatService.purchasePackage(pkg);
    setIsPurchasing(false);
    if (success) {
      setIsPro(true);
      void queryClient.invalidateQueries({ queryKey: ['all-events'] });
      router.back();
    }
  };

  const handleRestore = async () => {
    setIsRestoring(true);
    const success = await RevenueCatService.restorePurchases();
    setIsRestoring(false);
    if (success) {
      Alert.alert('Başarılı', 'Aboneliğin geri yüklendi!');
      setIsPro(true);
      void queryClient.invalidateQueries({ queryKey: ['all-events'] });
      router.back();
    } else {
      Alert.alert('Bulunamadı', 'Bu hesaba ait aktif abonelik yok.');
    }
  };

  return (
    <LinearGradient colors={APP_CONFIG.gradientColors} style={styles.mainContainer}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={[styles.scrollContent, deviceInfo.type === 'tablet' && styles.tabletScroll]} showsVerticalScrollIndicator={false}>
          
          <View style={styles.header}>
            {showClose && (
              <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
                <X size={24} color="rgba(255,255,255,0.3)" />
              </TouchableOpacity>
            )}
            <View style={styles.titleGroup}>
              <Text style={styles.headline}>{APP_CONFIG.headline}</Text>
              <Text style={styles.subtitle}>{APP_CONFIG.subtitle}</Text>
            </View>
          </View>

          <View style={styles.counterRow}>
            <View style={styles.counterBadge}>
              <Text style={styles.counterText}>📡 {liveCount} agents {APP_CONFIG.counterVerb}</Text>
            </View>
          </View>

          {/* VIDEO VISUAL */}
          <View style={styles.visualBox}>
            <VideoView
              style={styles.worldImage}
              player={player}
              nativeControls={false}
              contentFit="cover"
            />

            {/* Scan Line Overlay */}
            <Animated.View style={[styles.scanLine, { transform: [{ translateY: scanTranslate }] }]} />
            
            <View style={styles.activeTag}>
              <View style={styles.pulseDot} />
              <Text style={styles.activeTagText}>LIVE INTEL FEED</Text>
            </View>
          </View>

          <View style={styles.benefitsContainer}>
            {APP_CONFIG.benefits.map((b, idx) => (
              <View key={idx} style={styles.benefitRow}>
                <View style={styles.benefitIcon}>{b.icon}</View>
                <Text style={styles.benefitText}>{b.text}</Text>
              </View>
            ))}
          </View>

          <View style={styles.plansContainer}>
            {isLoading ? (
              <View style={styles.loadingPrices}>
                <Loader2 size={24} color={APP_CONFIG.accentColor} />
                <Text style={styles.loadingText}>Connecting to encrypted store...</Text>
              </View>
            ) : (
              BASE_PLANS.map((plan) => {
                const rcPkg = packages.find(p => p.packageType === PLAN_TO_PACKAGE_TYPE[plan.id] || plan.matchIds.includes(p.identifier));
                const displayPrice = rcPkg ? rcPkg.product.priceString : plan.fallbackPrice;
                const isSelected = selectedPlan === plan.id;
                const isAnnual = plan.id === 'ANNUAL';

                if (isAnnual) {
                  return (
                    <TouchableOpacity key={plan.id} onPress={() => setSelectedPlan(plan.id)} activeOpacity={0.9}>
                      <Animated.View style={[styles.card, styles.annualCard, { borderColor: isSelected ? APP_CONFIG.accentColor : 'rgba(255,77,0,0.2)', opacity: isSelected ? 1 : glowAnim }]}>
                        <View style={[styles.annualBadge, { backgroundColor: APP_CONFIG.accentColor }]}>
                          <Animated.Text style={[styles.badgeText, { transform: [{ scale: pulseAnim }] }]}>⭐ {plan.badge} ⭐</Animated.Text>
                        </View>
                        <View style={styles.cardContent}>
                          <View>
                            <Text style={styles.cardTitle}>{plan.title}</Text>
                            <Text style={[styles.cardSub, { color: APP_CONFIG.accentColor }]}>{plan.sub}</Text>
                          </View>
                          <Text style={styles.cardPrice}>{displayPrice}</Text>
                        </View>
                      </Animated.View>
                    </TouchableOpacity>
                  );
                }

                return (
                  <TouchableOpacity key={plan.id} onPress={() => setSelectedPlan(plan.id)} activeOpacity={0.8}>
                    <View style={[styles.card, isSelected && { borderColor: APP_CONFIG.accentColor, backgroundColor: 'rgba(255,77,0,0.05)' }]}>
                      <View style={styles.cardContent}>
                        <View>
                          <Text style={styles.cardTitleSmall}>{plan.title}</Text>
                          <Text style={styles.cardSubSmall}>{plan.sub}</Text>
                        </View>
                        <Text style={styles.cardPriceSmall}>{displayPrice}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>

          <TouchableOpacity onPress={handleContinue} disabled={isPurchasing || isLoading} style={styles.ctaButton}>
            <LinearGradient colors={[APP_CONFIG.accentColor, '#CC3D00']} style={styles.ctaGradient}>
              {isPurchasing ? <Loader2 size={24} color="#FFF" /> : <Text style={styles.ctaText}>{APP_CONFIG.ctaLabel}</Text>}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={handleRestore} 
            disabled={isRestoring} 
            style={styles.restoreButton}
          >
            <Text style={styles.restoreButtonText}>
              {isRestoring ? 'Restoring...' : 'Restore Purchases'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.cancelNote}>Secured payment. Cancel anytime from App Store settings.</Text>

          <View style={styles.footerRow}>
            <TouchableOpacity onPress={() => Linking.openURL('https://www.apple.com/legal/internet-services/itunes/dev/stdeula/')}>
              <Text style={styles.footerLink}>Terms</Text>
            </TouchableOpacity>
            <View style={styles.dot} />
            <TouchableOpacity onPress={() => Linking.openURL('https://semihtrn4.github.io/worldpulse_privacy/')}>
              <Text style={styles.footerLink}>Privacy</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContent: { padding: 20, paddingTop: 30, paddingBottom: 60 },
  tabletScroll: { maxWidth: 600, alignSelf: 'center', width: '100%' },
  header: { marginBottom: 20 },
  closeBtn: { alignSelf: 'flex-start', padding: 10, marginLeft: -10 },
  titleGroup: { alignItems: 'center', marginTop: 5 },
  headline: { color: '#FFF', fontSize: 28, fontWeight: '900', textAlign: 'center', letterSpacing: -0.5 },
  subtitle: { color: 'rgba(255,255,255,0.5)', fontSize: 14, textAlign: 'center', marginTop: 4, fontWeight: '500' },
  counterRow: { alignItems: 'center', marginVertical: 12 },
  counterBadge: { backgroundColor: 'rgba(255,77,0,0.1)', borderWidth: 1, borderColor: 'rgba(255,77,0,0.3)', paddingHorizontal: 16, paddingVertical: 5, borderRadius: 20 },
  counterText: { color: '#FF4D00', fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
  
  visualBox: { height: 250, backgroundColor: '#000', borderRadius: 24, overflow: 'hidden', marginBottom: 25, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', position: 'relative', justifyContent: 'center' },
  worldImage: { ...StyleSheet.absoluteFillObject, opacity: 0.7 },
  
  scanLine: { position: 'absolute', left: 0, right: 0, height: 2, backgroundColor: '#FF4D00', opacity: 0.4, shadowColor: '#FF4D00', shadowRadius: 10, shadowOpacity: 1 },
  activeTag: { position: 'absolute', bottom: 15, left: 15, backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: 'rgba(255,77,0,0.3)' },
  pulseDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#FF4D00' },
  activeTagText: { color: '#FF4D00', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  
  benefitsContainer: { marginBottom: 20, gap: 10 },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  benefitIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(255,77,0,0.1)', justifyContent: 'center', alignItems: 'center' },
  benefitText: { color: '#CCC', fontSize: 14, fontWeight: '600' },
  plansContainer: { gap: 10, marginBottom: 25 },
  loadingPrices: { padding: 40, alignItems: 'center', gap: 12 },
  loadingText: { color: 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: '600' },
  card: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', padding: 16 },
  annualCard: { borderWidth: 2, paddingTop: 28 },
  annualBadge: { position: 'absolute', top: 0, left: 0, right: 0, height: 24, borderTopLeftRadius: 15, borderTopRightRadius: 15, justifyContent: 'center', alignItems: 'center' },
  badgeText: { color: '#FFF', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  cardContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { color: '#FFF', fontSize: 17, fontWeight: '800' },
  cardSub: { fontSize: 11, marginTop: 2, fontWeight: '700' },
  cardPrice: { color: '#FFF', fontSize: 22, fontWeight: '900' },
  cardTitleSmall: { color: 'rgba(255,255,255,0.6)', fontSize: 15, fontWeight: '700' },
  cardSubSmall: { color: 'rgba(255,255,255,0.3)', fontSize: 11, marginTop: 1 },
  cardPriceSmall: { color: 'rgba(255,255,255,0.8)', fontSize: 18, fontWeight: '800' },
  ctaButton: { borderRadius: 20, overflow: 'hidden', marginBottom: 12 },
  ctaGradient: { paddingVertical: 18, alignItems: 'center' },
  ctaText: { color: '#FFF', fontSize: 18, fontWeight: '900', letterSpacing: 0.5 },
  restoreButton: { 
    borderRadius: 16, 
    paddingVertical: 14, 
    alignItems: 'center', 
    marginBottom: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  restoreButtonText: { 
    color: 'rgba(255,255,255,0.6)', 
    fontSize: 15, 
    fontWeight: '700', 
    letterSpacing: 0.3 
  },
  cancelNote: { color: 'rgba(255,255,255,0.25)', fontSize: 11, textAlign: 'center', marginBottom: 20 },
  footerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12 },
  footerLink: { color: 'rgba(255,255,255,0.3)', fontSize: 12, fontWeight: '600' },
  dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: 'rgba(255,255,255,0.08)' },
});
