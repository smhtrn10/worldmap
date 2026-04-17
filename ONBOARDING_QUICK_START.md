# ⚡ Onboarding - Hızlı Başlangıç

## ✅ TAMAMLANDI!

WorldPulse için profesyonel onboarding + paywall akışı hazır.

## 🎯 Akış

```
İlk Açılış → WelcomeScreen → 5 Feature Slides → Paywall → Ana Uygulama
```

## 📱 Ekranlar

1. **WelcomeScreen** - Splash + floating icons + CTA
2. **Slide 1** - Real-time monitoring (flash + burst)
3. **Slide 2** - Global coverage (counter 0→195)
4. **Slide 3** - Instant alerts (countdown 3-2-1)
5. **Slide 4** - Premium intel (crown + timer)
6. **Slide 5** - Rating request (App Store review)
7. **Paywall** - Premium upgrade (mevcut)

## 🎨 Özellikler

✅ Tam animasyonlu (spring, fade, burst, shimmer)
✅ Skip butonu (her slide'da)
✅ Progress bar + dots
✅ iPad responsive
✅ Paywall entegrasyonu
✅ Rating request (expo-store-review)
✅ AsyncStorage persistence

## 🧪 Test

### Onboarding'i Tekrar Göster
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

// AsyncStorage'ı temizle
await AsyncStorage.removeItem('@worldpulse_onboarding_completed');

// Uygulamayı yeniden başlat
```

### Hızlı Test
```bash
# Uygulamayı çalıştır
npx expo start

# İlk açılışta onboarding gösterilecek
# Skip ile hızlıca geçebilirsin
```

## 📂 Dosyalar

```
app/
  onboarding.tsx                    # Ana orkestratör
  _layout.tsx                       # Routing + check

components/onboarding/
  WelcomeScreen.tsx                 # İlk ekran
  FeatureSlides.tsx                 # Slide container
  slides/
    Slide1RealTime.tsx
    Slide2GlobalCoverage.tsx
    Slide3InstantAlerts.tsx
    Slide4PremiumIntel.tsx
    Slide5Rating.tsx
```

## 🎨 Renk Paleti

| Renk | Hex | Kullanım |
|------|-----|----------|
| Yeşil | #00FF64 | Ana accent, CTA |
| Altın | #FFD700 | Premium, timer |
| Turuncu | #FF6B35 | Vurgu, urgency |
| Siyah | #000 | Background |

## 💡 Özelleştirme

### Slide Ekle/Çıkar
```typescript
// components/onboarding/FeatureSlides.tsx
const SLIDES = [
  Slide1RealTime,
  Slide2GlobalCoverage,
  // Yeni slide ekle
];
```

### Metinleri Değiştir
Her slide'ın kendi dosyasında `title`, `subtitle`, `features` değiştir.

### Renkleri Değiştir
`constants/colors.ts` dosyasında accent renklerini güncelle.

## 🚀 Production

- [x] Animasyonlar optimize
- [x] Cleanup yapılıyor
- [x] AsyncStorage entegre
- [x] Paywall entegre
- [x] Rating entegre
- [ ] Gerçek cihazda test et

## 📝 Notlar

- İlk açılışta gösterilir
- Skip ile atlanabilir
- Paywall sonunda açılır
- Rating opsiyonel

---

**Hazır! 🎉** Onboarding çalışıyor.

Detaylı bilgi: `ONBOARDING_GUIDE.md`
