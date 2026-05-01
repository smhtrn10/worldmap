import { Platform } from 'react-native';
import Purchases, { LOG_LEVEL, PurchasesPackage } from 'react-native-purchases';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_KEY_IOS     = 'appl_kjhwQGJELRufkdnNhOJykEFLAdd';
const API_KEY_ANDROID = ''; // TODO: Add Android RevenueCat API key when targeting Android
const ENTITLEMENT_ID = 'premium';
const STORAGE_PRO_STATUS = '@worldpulse_is_pro_status';

let initPromise: Promise<void> | null = null;
let isInitialized = false;
let customerInfoListener: (() => void) | null = null;
let onCustomerInfoUpdate: ((isPro: boolean, plan: string) => void) | null = null;

export const RevenueCatService = {
  /**
   * Initializes the RevenueCat SDK
   * iPadOS 26 compatible - handles initialization errors gracefully
   */
  async initialize() {
    if (initPromise) return initPromise;

    initPromise = (async () => {
      try {
        if (Platform.OS !== 'ios') {
          console.log('[RevenueCat] Skipping initialization - not iOS');
          return;
        }
        
        // iPadOS 26 fix: Wrap configure in try-catch for beta compatibility
        try {
          Purchases.setLogLevel(LOG_LEVEL.VERBOSE);
          Purchases.configure({ 
            apiKey: API_KEY_IOS
          });
          isInitialized = true;
          console.log('[RevenueCat] SDK Initialized for iOS/iPadOS');

          // KATEGORİ 6: CustomerInfo Listener kurulumu
          Purchases.addCustomerInfoUpdateListener((info) => {
            const isPro = typeof info.entitlements.active[ENTITLEMENT_ID] !== 'undefined';
            const plan = this.getPlanType(info.activeSubscriptions);
            
            // Local cache güncelle
            void AsyncStorage.setItem(STORAGE_PRO_STATUS, JSON.stringify(isPro));
            
            // Kayıtlı callback varsa tetikle
            if (onCustomerInfoUpdate) {
              onCustomerInfoUpdate(isPro, plan);
            }
          });

        } catch (configError) {
          console.error('[RevenueCat] Configuration failed:', configError);
          throw configError;
        }
      } catch (e) {
        console.error('[RevenueCat] Initialization failed:', e);
        // Reset so next call can retry
        initPromise = null;
        throw e; // Re-throw to let caller handle
      } finally {
        isInitialized = true;
      }
    })();

    return initPromise;
  },

  /**
   * Checks if the user has an active premium entitlement.
   * iPadOS 26 compatible - handles errors gracefully
   */
  async checkPremiumStatus(): Promise<boolean> {
    try {
      await this.initialize();
    } catch (initError) {
      console.error('[RevenueCat] Init failed in checkPremiumStatus:', initError);
      // Fall back to cache on init failure
      const cached = await AsyncStorage.getItem(STORAGE_PRO_STATUS);
      return cached ? JSON.parse(cached) : false;
    }

    // On non-iOS platforms SDK is not configured, fall back to cache
    if (Platform.OS !== 'ios') {
      const cached = await AsyncStorage.getItem(STORAGE_PRO_STATUS);
      return cached ? JSON.parse(cached) : false;
    }

    try {
      // iPadOS 26 fix: Wrap in try-catch for beta compatibility
      const customerInfo = await Purchases.getCustomerInfo();
      const isActive = typeof customerInfo.entitlements.active[ENTITLEMENT_ID] !== 'undefined';
      await AsyncStorage.setItem(STORAGE_PRO_STATUS, JSON.stringify(isActive));
      return isActive;
    } catch (error) {
      console.error('[RevenueCat] getCustomerInfo failed:', error);
      // Fall back to cache on error
      const cached = await AsyncStorage.getItem(STORAGE_PRO_STATUS);
      return cached ? JSON.parse(cached) : false;
    }
  },

  /**
   * KATEGORİ 3: Aktif aboneliklerden plan tipini belirler
   */
  getPlanType(activeSubscriptions: string[]): string {
    if (activeSubscriptions.some(s => s.toLowerCase().includes('yearly') || s.toLowerCase().includes('annual'))) {
      return 'yearly';
    }
    if (activeSubscriptions.some(s => s.toLowerCase().includes('monthly'))) {
      return 'monthly';
    }
    if (activeSubscriptions.some(s => s.toLowerCase().includes('weekly'))) {
      return 'weekly';
    }
    return 'free';
  },

  /**
   * Dışarıdan listener bağlanmasını sağlar
   */
  setUpdateListener(callback: (isPro: boolean, plan: string) => void) {
    onCustomerInfoUpdate = callback;
  },

  /**
   * Fetches current offerings from RevenueCat.
   * De-duplicates packages by packageType, preferring the longer product identifier
   * (e.g. com.worldpulse.mobile.yearly over yearly) to handle duplicate Dashboard entries.
   */
  async getOfferings() {
    await this.initialize();
    if (Platform.OS !== 'ios') return [];
    try {
      const offerings = await Purchases.getOfferings();
      if (offerings.current !== null && offerings.current.availablePackages.length !== 0) {
        const seen = new Map<string, PurchasesPackage>();
        for (const pkg of offerings.current.availablePackages) {
          const key = pkg.packageType;
          const existing = seen.get(key);
          // Prefer the package whose product identifier is longer (more specific)
          if (!existing || pkg.product.identifier.length > existing.product.identifier.length) {
            seen.set(key, pkg);
          }
        }
        return Array.from(seen.values());
      }
      return [];
    } catch (e) {
      console.error('[RevenueCat] Fetch offerings failed:', e);
      return [];
    }
  },

  /**
   * Performs a purchase
   */
  async purchasePackage(pkg: PurchasesPackage): Promise<boolean> {
    if (Platform.OS !== 'ios') return false;
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      const isPro = typeof customerInfo.entitlements.active[ENTITLEMENT_ID] !== 'undefined';
      await AsyncStorage.setItem(STORAGE_PRO_STATUS, JSON.stringify(isPro));
      return isPro;
    } catch (e: any) {
      if (!e.userCancelled) {
        console.error('[RevenueCat] Purchase failed:', e);
      }
      return false;
    }
  },

  /**
   * Restores previous purchases
   */
  async restorePurchases(): Promise<boolean> {
    if (Platform.OS !== 'ios') return false;
    try {
      const customerInfo = await Purchases.restorePurchases();
      const isPro = typeof customerInfo.entitlements.active[ENTITLEMENT_ID] !== 'undefined';
      await AsyncStorage.setItem(STORAGE_PRO_STATUS, JSON.stringify(isPro));
      return isPro;
    } catch (e) {
      console.error('[RevenueCat] Restore failed:', e);
      return false;
    }
  }
};
