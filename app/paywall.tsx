import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Image,
  ScrollView,
  Dimensions,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useRouter } from 'expo-router';
import { X, Check, Shield, Globe, Zap, ArrowRight, Loader2 } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useQueryClient } from '@tanstack/react-query';
import { useFilters } from '@/context/FilterContext';
import { RevenueCatService } from '@/services/revenuecat';
import { PurchasesPackage, PACKAGE_TYPE } from 'react-native-purchases';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const HEADER_HEIGHT = SCREEN_HEIGHT * 0.35;

const BASE_PLANS = [
  { id: 'WEEKLY',  matchIds: ['$rc_weekly', 'weekly', 'com.worldpulse.mobile.weekly'], title: 'Weekly',  fallbackPrice: '$1.99',  period: 'week',  save: null },
  { id: 'MONTHLY', matchIds: ['$rc_monthly', 'monthly', 'com.worldpulse.mobile.monthly'], title: 'Monthly', fallbackPrice: '$4.99',  period: 'month', save: 'Save 20%' },
  { id: 'ANNUAL',  matchIds: ['$rc_annual', 'yearly', 'annual', 'com.worldpulse.mobile.yearly'],   title: 'Yearly',  fallbackPrice: '$19.99', period: 'year',  save: 'Best Value' },
];

const PLAN_TO_PACKAGE_TYPE: Record<string, PACKAGE_TYPE> = {
  'WEEKLY':  PACKAGE_TYPE.WEEKLY,
  'MONTHLY': PACKAGE_TYPE.MONTHLY,
  'ANNUAL':  PACKAGE_TYPE.ANNUAL,
};

export default function PaywallScreen() {
  const router = useRouter();
  const { setIsPro } = useFilters();
  const queryClient = useQueryClient();
  const [selectedPlan, setSelectedPlan] = useState('ANNUAL');
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  // O4: Restore için ayrı state — kullanıcıya "Restoring..." göster
  const [isRestoring, setIsRestoring] = useState(false);

  React.useEffect(() => {
    const loadOfferings = async () => {
      const available = await RevenueCatService.getOfferings();
      setPackages(available);
      setIsLoading(false);
    };
    loadOfferings();
  }, []);

  const handleContinue = async () => {
    const planConfig = BASE_PLANS.find(p => p.id === selectedPlan);
    const pkg = packages.find(p =>
      p.packageType === PLAN_TO_PACKAGE_TYPE[selectedPlan] ||
      planConfig?.matchIds.includes(p.identifier) ||
      planConfig?.matchIds.includes(p.product.identifier)
    );
    if (!pkg) {
      console.warn('[Paywall] No matching package found for', selectedPlan);
      if (__DEV__) {
        console.log('[Paywall] Development mode: Applying fallback PRO status.');
        await AsyncStorage.setItem('@worldpulse_is_pro_status', JSON.stringify(true));
        setIsPro(true);
        // K3: event listesini yenile
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
      // K3: Satın alma başarılı — conflict intel dahil event listesini yenile
      void queryClient.invalidateQueries({ queryKey: ['all-events'] });
      router.back();
    }
  };

  const handleRestore = async () => {
    // O4: isLoading yerine isRestoring — plan listesi gizlenmesin
    setIsRestoring(true);
    const success = await RevenueCatService.restorePurchases();
    setIsRestoring(false);

    if (success) {
      setIsPro(true);
      // K3 + O2: Restore başarılı — event listesini yenile
      void queryClient.invalidateQueries({ queryKey: ['all-events'] });
      router.back();
    } else {
      // O3: Restore başarısız veya iptal — conflict cache'i temizle (stale data kalmasın)
      await AsyncStorage.multiRemove(['@conflict_last_fetch', '@conflict_cached_events']);
    }
  };

  return (
    <View style={styles.mainContainer}>
      {/* Hero Header Image */}
      <View style={styles.heroContainer}>
        <Image
          source={require('@/assets/images/2.png')}
          style={styles.heroImage}
          resizeMode="cover"
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.5)', '#000']}
          style={styles.gradientOverlay}
        />
      </View>
      
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.closeButton}>
              <BlurView intensity={20} tint="dark" style={styles.closeIconContainer}>
                <X size={24} color="#FFF" />
              </BlurView>
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Title Section */}
            <View style={styles.titleSection}>
              <Text style={styles.title}>Unlock Global{'\n'}Intelligence</Text>
              <Text style={styles.subtitle}>
                Get unrestricted access to conflict tracking and elite humanitarian data worldwide.
              </Text>
            </View>

            {/* Features Section */}
            <View style={styles.features}>
              <FeatureItem 
                icon={<Shield size={20} color="#FFD700" />} 
                text="Access Restricted Conflict Mapping" 
              />
              <FeatureItem 
                icon={<Zap size={20} color="#FFD700" />} 
                text="Real-time Social Unrest Monitoring" 
              />
              <FeatureItem 
                icon={<Globe size={20} color="#FFD700" />} 
                text="Advanced Geographic Analytics" 
              />
            </View>

            {/* Plans Section */}
            <View style={styles.plansContainer}>
              {isLoading ? (
                <View style={{ padding: 40, alignItems: 'center' }}>
                  <Loader2 size={32} color="#FFD700" style={{ marginBottom: 10 }} />
                  <Text style={{ color: 'rgba(255,255,255,0.6)' }}>Fetching live prices...</Text>
                </View>
              ) : (
                BASE_PLANS.map((plan) => {
                  const rcPkg = packages.find(p => 
                    p.packageType === PLAN_TO_PACKAGE_TYPE[plan.id] || 
                    plan.matchIds.includes(p.identifier) || 
                    plan.matchIds.includes(p.product.identifier)
                  );
                  const displayPrice = rcPkg ? rcPkg.product.priceString : plan.fallbackPrice;

                  return (
                    <Pressable
                      key={plan.id}
                      onPress={() => setSelectedPlan(plan.id)}
                      style={[
                        styles.planCard,
                        selectedPlan === plan.id && styles.selectedPlanCard,
                      ]}
                    >
                      <View style={styles.planInfo}>
                        <Text style={styles.planTitle}>{plan.title}</Text>
                        <Text style={styles.planPrice}>
                          {displayPrice}
                          <Text style={styles.planPeriod}>/{plan.period}</Text>
                        </Text>
                      </View>
                      {plan.save && (
                        <View style={styles.saveBadge}>
                          <Text style={styles.saveBadgeText}>{plan.save}</Text>
                        </View>
                      )}
                      <View style={[
                        styles.checkbox,
                        selectedPlan === plan.id && styles.selectedCheckbox
                      ]}>
                        {selectedPlan === plan.id && <Check size={16} color="#000" />}
                      </View>
                    </Pressable>
                  );
                })
              )}
            </View>

            {/* Main Action */}
            <Pressable 
              style={[styles.continueButton, (isPurchasing || isLoading) && { opacity: 0.7 }]} 
              onPress={handleContinue}
              disabled={isPurchasing || isLoading}
            >
              <Text style={styles.continueButtonText}>
                {isPurchasing ? 'PROCESSING...' : 'UNLEASH POWER'}
              </Text>
              {!isPurchasing && <ArrowRight size={20} color="#000" />}
            </Pressable>

            {/* Footer Links */}
            <View style={styles.footer}>
              <Pressable onPress={handleRestore} disabled={isRestoring}>
                <Text style={styles.footerLink}>{isRestoring ? 'Restoring...' : 'Restore Purchase'}</Text>
              </Pressable>
              <View style={styles.dot} />
              <Pressable onPress={() => Linking.openURL('https://www.apple.com/legal/internet-services/itunes/dev/stdeula/')}>
                <Text style={styles.footerLink}>Terms</Text>
              </Pressable>
              <View style={styles.dot} />
              <Pressable onPress={() => Linking.openURL('https://semihtrn4.github.io/worldpulse_privacy/')}>
                <Text style={styles.footerLink}>Privacy Policy</Text>
              </Pressable>
            </View>
            
            <Text style={styles.disclaimer}>
              Recurring billing. Cancel anytime.
            </Text>
          </ScrollView>
        </View>
      </SafeAreaView>
    </View>
  );
}

function FeatureItem({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <View style={styles.featureItem}>
      <View style={styles.featureIconContainer}>{icon}</View>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: 10,
    zIndex: 10,
  },
  closeButton: {
    width: 44,
    height: 44,
  },
  closeIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  heroContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: HEADER_HEIGHT,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: HEADER_HEIGHT * 0.7,
  },
  titleSection: {
    marginTop: HEADER_HEIGHT - 120, // Push content up slightly into the gradient
    marginBottom: 40,
  },
  title: {
    fontSize: 42,
    fontWeight: '900',
    color: '#FFF',
    lineHeight: 48,
    letterSpacing: -1,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontSize: 17,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 16,
    lineHeight: 24,
    fontWeight: '500',
  },
  features: {
    marginBottom: 40,
    gap: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,215,0,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
    flex: 1,
  },
  plansContainer: {
    gap: 12,
    marginBottom: 30,
  },
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  selectedPlanCard: {
    backgroundColor: 'rgba(255,215,0,0.12)',
    borderColor: '#FFD700',
  },
  planInfo: {
    flex: 1,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFF',
  },
  planPrice: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },
  planPeriod: {
    fontSize: 13,
  },
  saveBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 12,
  },
  saveBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#000',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedCheckbox: {
    backgroundColor: '#FFD700',
    borderColor: '#FFD700',
  },
  continueButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 20,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 8,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#000',
    letterSpacing: 2,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
    gap: 8,
  },
  footerLink: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '600',
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  disclaimer: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.3)',
    textAlign: 'center',
    marginTop: 12,
  }
});
