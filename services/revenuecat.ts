import { Platform } from 'react-native';
import Purchases, { LOG_LEVEL, PurchasesPackage } from 'react-native-purchases';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_KEY_IOS     = 'appl_kjhwQGJELRufkdnNhOJykEFLAdd';
const API_KEY_ANDROID = ''; // TODO: Add Android RevenueCat API key when targeting Android
const ENTITLEMENT_ID = 'premium';
const STORAGE_PRO_STATUS = '@worldpulse_is_pro_status';

let initPromise: Promise<void> | null = null;
let isInitialized = false;

export const RevenueCatService = {
  /**
   * Initializes the RevenueCat SDK
   */
  async initialize() {
    if (initPromise) return initPromise;

    initPromise = (async () => {
      try {
        if (Platform.OS !== 'ios') {
          return;
        }
        Purchases.setLogLevel(LOG_LEVEL.VERBOSE);
        Purchases.configure({ apiKey: API_KEY_IOS });
        console.log('[RevenueCat] SDK Initialized for iOS');
      } catch (e) {
        console.error('[RevenueCat] Initialization failed:', e);
        // Reset so next call can retry
        initPromise = null;
      } finally {
        isInitialized = true;
      }
    })();

    return initPromise;
  },

  /**
   * Checks if the user has an active premium entitlement.
   * Throws on network/RC error so callers can decide fallback behavior.
   */
  async checkPremiumStatus(): Promise<boolean> {
    await this.initialize();

    // On non-iOS platforms SDK is not configured, fall back to cache
    if (Platform.OS !== 'ios') {
      const cached = await AsyncStorage.getItem(STORAGE_PRO_STATUS);
      return cached ? JSON.parse(cached) : false;
    }

    // Throws on failure — caller (FilterContext) handles fallback
    const customerInfo = await Purchases.getCustomerInfo();
    const isActive = typeof customerInfo.entitlements.active[ENTITLEMENT_ID] !== 'undefined';
    await AsyncStorage.setItem(STORAGE_PRO_STATUS, JSON.stringify(isActive));
    return isActive;
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
