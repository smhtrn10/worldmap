import * as StoreReview from 'expo-store-review';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

const STORAGE_KEYS = {
  REVIEW_REQUESTED: 'review_requested',
  APP_OPENS: 'app_opens',
  EVENTS_VIEWED: 'events_viewed',
  FIRST_OPEN_DATE: 'first_open_date',
  LAST_REVIEW_PROMPT: 'last_review_prompt',
};

const REVIEW_THRESHOLDS = {
  MIN_APP_OPENS: 5,
  MIN_EVENTS_VIEWED: 10,
  MIN_DAYS_SINCE_INSTALL: 3,
  MIN_DAYS_BETWEEN_PROMPTS: 90, // 3 ay
};

export class ReviewManager {
  /**
   * Kullanıcının review verip veremeyeceğini kontrol eder
   */
  static async canRequestReview(): Promise<boolean> {
    try {
      // Cihazda review özelliği var mı?
      const isAvailable = await StoreReview.isAvailableAsync();
      if (!isAvailable) return false;

      // Daha önce review istendi mi?
      const lastPrompt = await AsyncStorage.getItem(STORAGE_KEYS.LAST_REVIEW_PROMPT);
      if (lastPrompt) {
        const daysSinceLastPrompt = Math.floor(
          (Date.now() - parseInt(lastPrompt)) / (1000 * 60 * 60 * 24)
        );
        if (daysSinceLastPrompt < REVIEW_THRESHOLDS.MIN_DAYS_BETWEEN_PROMPTS) {
          return false;
        }
      }

      // Uygulama yeterince kullanıldı mı?
      const appOpens = await this.getAppOpens();
      const eventsViewed = await this.getEventsViewed();
      const daysSinceInstall = await this.getDaysSinceInstall();

      return (
        appOpens >= REVIEW_THRESHOLDS.MIN_APP_OPENS &&
        eventsViewed >= REVIEW_THRESHOLDS.MIN_EVENTS_VIEWED &&
        daysSinceInstall >= REVIEW_THRESHOLDS.MIN_DAYS_SINCE_INSTALL
      );
    } catch (error) {
      console.error('Review check error:', error);
      return false;
    }
  }

  /**
   * Review dialog'unu gösterir (iOS native popup)
   */
  static async requestReview(): Promise<void> {
    try {
      const canRequest = await this.canRequestReview();
      if (!canRequest) {
        console.log('Review conditions not met');
        return;
      }

      await StoreReview.requestReview();
      await AsyncStorage.setItem(
        STORAGE_KEYS.LAST_REVIEW_PROMPT,
        Date.now().toString()
      );
      console.log('Review requested successfully');
    } catch (error) {
      console.error('Review request error:', error);
    }
  }

  /**
   * Manuel olarak App Store'u açar (Settings'teki buton için)
   */
  static async openAppStore(): Promise<void> {
    try {
      const hasAction = await StoreReview.hasAction();
      if (hasAction) {
        await StoreReview.requestReview();
      }
    } catch (error) {
      console.error('App Store open error:', error);
    }
  }

  /**
   * Uygulama açılış sayısını artırır ve 3'ün katlarında değerlendirme sorar
   */
  static async incrementAppOpens(): Promise<void> {
    try {
      const current = await this.getAppOpens();
      const newOpens = current + 1;
      await AsyncStorage.setItem(
        STORAGE_KEYS.APP_OPENS,
        newOpens.toString()
      );

      // İlk açılış tarihini kaydet
      const firstOpen = await AsyncStorage.getItem(STORAGE_KEYS.FIRST_OPEN_DATE);
      if (!firstOpen) {
        await AsyncStorage.setItem(
          STORAGE_KEYS.FIRST_OPEN_DATE,
          Date.now().toString()
        );
      }

      // Kullanıcı zaten "Evet" demişse tekrar sorma
      const hasRated = await AsyncStorage.getItem('user_has_rated_from_prompt');
      if (hasRated === 'true') return;

      // Her 3. girişte sor (3, 6, 9...)
      if (newOpens > 0 && newOpens % 3 === 0) {
        setTimeout(() => {
          this.showRatePrompt();
        }, 2000); // Uygulama açıldıktan 2 saniye sonra göster
      }
    } catch (error) {
      console.error('Increment app opens error:', error);
    }
  }

  /**
   * Özel Alert gösterir, kabul ederse StoreReview çalışır
   */
  static async showRatePrompt(): Promise<void> {
    Alert.alert(
      'Enjoying WorldPulse?',
      'Would you like to rate us? Your feedback helps us improve the app.',
      [
        {
          text: 'Maybe Later',
          style: 'cancel',
          onPress: () => console.log('User selected maybe later'),
        },
        {
          text: 'Yes, Rate Now',
          style: 'default',
          onPress: async () => {
            // Bir daha sormamak üzere kaydet
            await AsyncStorage.setItem('user_has_rated_from_prompt', 'true');
            // Yerel (native) değerlendirme penceresini çağır
            try {
              const isAvailable = await StoreReview.isAvailableAsync();
              if (isAvailable || await StoreReview.hasAction()) {
                await StoreReview.requestReview();
              }
            } catch (err) {
              console.log('Error launching review prompt', err);
            }
          },
        },
      ]
    );
  }

  /**
   * Event görüntüleme sayısını artırır
   */
  static async incrementEventsViewed(): Promise<void> {
    try {
      const current = await this.getEventsViewed();
      await AsyncStorage.setItem(
        STORAGE_KEYS.EVENTS_VIEWED,
        (current + 1).toString()
      );

      // Belirli bir eşiğe ulaşıldığında otomatik review iste
      if ((current + 1) === REVIEW_THRESHOLDS.MIN_EVENTS_VIEWED) {
        // Biraz gecikme ile göster (kullanıcı deneyimini bozmamak için)
        setTimeout(() => {
          this.requestReview();
        }, 2000);
      }
    } catch (error) {
      console.error('Increment events viewed error:', error);
    }
  }

  /**
   * İstatistikleri sıfırlar (test için)
   */
  static async resetStats(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.APP_OPENS,
        STORAGE_KEYS.EVENTS_VIEWED,
        STORAGE_KEYS.FIRST_OPEN_DATE,
        STORAGE_KEYS.LAST_REVIEW_PROMPT,
      ]);
    } catch (error) {
      console.error('Reset stats error:', error);
    }
  }

  // Helper methods
  private static async getAppOpens(): Promise<number> {
    const value = await AsyncStorage.getItem(STORAGE_KEYS.APP_OPENS);
    return value ? parseInt(value) : 0;
  }

  private static async getEventsViewed(): Promise<number> {
    const value = await AsyncStorage.getItem(STORAGE_KEYS.EVENTS_VIEWED);
    return value ? parseInt(value) : 0;
  }

  private static async getDaysSinceInstall(): Promise<number> {
    const firstOpen = await AsyncStorage.getItem(STORAGE_KEYS.FIRST_OPEN_DATE);
    if (!firstOpen) return 0;
    return Math.floor((Date.now() - parseInt(firstOpen)) / (1000 * 60 * 60 * 24));
  }

  /**
   * Debug bilgilerini döndürür
   */
  static async getDebugInfo(): Promise<{
    appOpens: number;
    eventsViewed: number;
    daysSinceInstall: number;
    canRequest: boolean;
  }> {
    return {
      appOpens: await this.getAppOpens(),
      eventsViewed: await this.getEventsViewed(),
      daysSinceInstall: await this.getDaysSinceInstall(),
      canRequest: await this.canRequestReview(),
    };
  }
}
