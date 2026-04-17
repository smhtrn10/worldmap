---
name: rn-onboarding-paywall
description: >
  React Native (Expo) uygulamaları için tam onboarding + paywall akışı oluşturur.
  WelcomeScreen, soru-cevap chat akışı, BuildingScreen, FeatureSlides (animasyonlu),
  StarBurstScreen, PremiumIntroScreen ve RevenueCat entegrasyonlu PaywallModal dahil
  tüm ekranları ve bileşenleri üretir. Kullanıcı "onboarding yap", "paywall ekle",
  "kullanıcı karşılama ekranı", "abonelik ekranı", "feature slides", "premium akış"
  veya herhangi bir uygulama türü için bu bileşenleri istediğinde bu skill'i kullan.
  Her uygulama için sıfırdan özelleştirilmiş, animasyonlu, dönüşüm odaklı üretim
  kalitesinde kod yazar. Fitness, finans, eğitim, sağlık, eğlence, araçlar gibi
  her kategori için uygulanabilir.
---

# React Native Onboarding + Paywall Skill

Kullanıcının uygulamasına uygun, **production-ready**, tam animasyonlu onboarding ve
paywall akışı üretmek için bu kılavuzu takip et.

https://www.revenuecat.com/docs/getting-started/installation/expo

https://www.revenuecat.com/docs/getting-started/installation/reactnative

https://www.revenuecat.com/docs/getting-started/installation/ios

---

## ADIM 1 — Uygulama Profilini Çıkar

Kullanıcıdan aşağıdakileri öğren (veya mesajdan çıkar):

```
- Uygulama adı ve kategorisi (fitness, finans, eğitim, evcil hayvan, vb.)
- Hedef kitle (çocuk, yetişkin, profesyonel, vb.)
- Ana değer önerisi (kullanıcıya ne sağlıyor?)
- Mevcut renk paleti / marka renkleri (yoksa öner)
- Soru akışı: kaç soru, hangi türde (single/multi/input)
- Premium özellikler listesi (paywall için)
- RevenueCat plan yapısı (weekly/monthly/yearly veya özel)
- i18n kullanılıyor mu? (useTranslation hook'u)
- Mevcut store yapısı (useAppStore, Zustand, vb.)
```

Eksik bilgi varsa makul varsayımlar yap ve inline belirt.

---

## ADIM 2 — Mimariyi Planla

### Dosya Yapısı

```
app/
  onboarding.tsx          ← Ana orkestratör (phase state machine)

components/onboarding/
  WelcomeScreen.tsx       ← Splash + CTA
  ChatBubble.tsx          ← Typewriter animasyonlu soru balonu
  MascotCharacter.tsx     ← Bounce animasyonlu maskot/ikon
  OptionCards.tsx         ← Slide-in seçenek kartları
  BuildingScreen.tsx      ← "Hazırlanıyor" yükleme animasyonu
  FeatureSlides.tsx       ← 5-6 slaytlı özellik galerisi
  StarBurstScreen.tsx     ← Kişiselleştirilmiş kutlama ekranı
  PremiumIntroScreen.tsx  ← Premium özellik listesi

app/
  paywall.tsx             ← RevenueCat entegrasyonlu Modal
```

### Phase State Machine (onboarding.tsx)

```typescript
type OnboardingPhase = 
  | 'welcome'       // WelcomeScreen
  | 'chat'          // Soru-cevap döngüsü
  | 'building'      // BuildingScreen (2-3 sn animasyon)
  | 'features'      // FeatureSlides
  | 'starburst'     // StarBurstScreen
  | 'premiumIntro'  // PremiumIntroScreen → Paywall
```

---

## ADIM 3 — Bileşenleri Üret

Aşağıdaki sırayla her bileşeni üret. Her biri için referans dosyayı oku:

→ [Bileşen detayları için: `references/components.md`]
→ [Animasyon paternleri için: `references/animations.md`]
→ [FeatureSlides slide tasarımı için: `references/feature-slides.md`]
→ [Paywall + RevenueCat için: `references/paywall.md`]

---

## ADIM 4 — Özelleştirme Kuralları

### Renk & Tema
```typescript
// Her slide için accent rengi seç — uygulamaya göre değiştir:
const SLIDE_ACCENTS = [
  '#FF6B35',   // Enerji / Eylem (turuncu)
  '#EF476F',   // Duygu / Premium (kırmızı-pembe)
  '#118AB2',   // Güven / Otorite (mavi)
  '#06D6A0',   // Başarı / Sağlık (yeşil-teal)
  '#FFD166',   // Ödül / Altın (sarı)
];
// Fitness → yeşil dominant
// Finans → mavi/altın dominant
// Sağlık → teal/mor dominant
// Eğlence → turuncu/pembe dominant
```

### Maskot Seçimi
```
Evcil hayvan uygulaması  → 🐾 🐕 🐈
Fitness                  → 💪 🏃 🔥
Finans / Bütçe           → 💰 📈 🏦
Eğitim                   → 📚 🧠 ✏️
Meditasyon / Sağlık      → 🧘 🌱 💆
Müzik                    → 🎵 🎸 🎤
Yemek / Tarif            → 🍳 👨‍🍳 🥗
```

### Soru Tipleri
```typescript
interface QuestionConfig {
  id: string;
  type: 'single' | 'multi' | 'input';
  questionKey: string;     // i18n key veya direkt string
  optionKeys?: string[];   // single/multi için seçenekler
}
```

### BuildingScreen Mesajları
Uygulamaya özel "hazırlanıyor" mesajları yaz:
- Fitness: "Antrenman planın hazırlanıyor..."
- Finans: "Bütçe profiling oluşturuluyor..."
- Evcil hayvan: "Evcil hayvanın profili oluşturuluyor..."

---

## ADIM 5 — FeatureSlides Tasarım Sistemi

Her slide şu yapıyı takip eder:

```
┌─────────────────────────────────┐
│  [SCENE AREA - animasyonlu]     │  ← height * 0.42
│  Emoji + Parçacık + Efektler    │
│  Renkli dark background         │
└─────────────────────────────────┘
  [Social Proof Banner]
  [Başlık - 26px bold]
  [Alt başlık - 14px muted]
  [Özel widget: pill/compare/list] ← slide türüne göre
```

**6 Slide Pattern (PetCam'den kalıp):**
1. **Ana Özellik** — Ürünün en güçlü özelliği, flash animasyon
2. **İkinci Özellik** — Çarpıcı görsel (düşen objeler, burst efekti)
3. **Zamanlama/Hassasiyet** — Countdown + adım strip
4. **Sınırsızlık/Ölçek** — Kart stack + karşılaştırma tablosu
5. **Premium/Aciliyet** — Starburst + countdown timer + feature checklist
6. **Sosyal Kanıt/Rating** — Yıldız rating + app store review prompt

---

## ADIM 6 — Paywall Kuralları

```typescript
// Plan yapısı — RevenueCat offerings'ten çek:
interface PlanItem {
  id: 'weekly' | 'monthly' | 'yearly';
  title: string;
  price: string;         // RC'den: product.priceString
  period: string;
  savings?: string;      // "Save 79%" gibi
  isBestValue?: boolean; // Yearly için true
  package?: any;         // RC package objesi
}

// Kritik davranışlar:
// 1. showClose → 7 saniye sonra X butonu göster (FTC uyumlu)
// 2. __DEV__ → RC olmadan test için mock purchase
// 3. yearly seçilince → trial disclaimer göster
// 4. restore → RevenueCatService.restorePurchases()
```

**Benefit listesi yapısı:**
```
✅ [Ana özellik] - premium olanı
✅ [İkinci özellik]
✅ [Üçüncü özellik]
✅ [Sınırsız kullanım]
✅ [Su damgasız / reklamsız]
✅ [Özel içerik]
```

---

## ADIM 7 — Kalite Kontrol Listesi

Her üretimden önce kontrol et:

- [ ] Tüm `Animated.Value` için `useNativeDriver: true` (layout animasyonları hariç)
- [ ] `useEffect` içindeki tüm timer/interval'lar cleanup'ta temizleniyor
- [ ] `isTransitioning` guard → çift tıklama koruması
- [ ] `optionsVisible` → ChatBubble typewriter bitmeden options gösterilmiyor
- [ ] `canContinue()` → Continue butonu doğru koşulda aktif
- [ ] PaywallModal'da `visible` prop'una göre her açılışta `loadOfferings()` çağrılıyor
- [ ] `__DEV__` mock satın alma bloğu mevcut
- [ ] `SafeAreaView` doğru kullanıyor
- [ ] i18n key'leri tutarlı namespace ile (`onboarding.`, `paywall.`, `common.`)

---

## Hızlı Referans — Animasyon Şablonları

```typescript
// Bounce giriş
Animated.spring(val, { toValue: 1, friction: 4, tension: 80, useNativeDriver: true })

// Slide-up + fade
Animated.parallel([
  Animated.timing(opacityAnim, { toValue: 1, duration: 400, delay, useNativeDriver: true }),
  Animated.timing(slideAnim, { toValue: 0, duration: 400, delay, useNativeDriver: true }),
])

// Pulse döngüsü
Animated.loop(Animated.sequence([
  Animated.timing(pulse, { toValue: 1.06, duration: 700, useNativeDriver: true }),
  Animated.timing(pulse, { toValue: 1.0, duration: 700, useNativeDriver: true }),
]))

// Stagger (ardışık)
Animated.stagger(80, items.map(item => Animated.spring(item, { toValue: 1, ... })))

// Flash efekti
Animated.sequence([
  Animated.timing(flashOp, { toValue: 1, duration: 60, useNativeDriver: true }),
  Animated.timing(flashOp, { toValue: 0, duration: 150, useNativeDriver: true }),
  Animated.timing(flashOp, { toValue: 0.8, duration: 60, useNativeDriver: true }),
  Animated.timing(flashOp, { toValue: 0, duration: 250, useNativeDriver: true }),
])
```

---

## Notlar

- PetCam kodları bu skill'in **referans implementasyonu**dur — kalıp olarak kullan, kopyalama
- Her uygulamaya özgü: emoji, renk, soru içeriği, slide scene tasarımı, benefit listesi
- Slide scene'leri yaratıcı ol: düşen objeler, akan parçacıklar, counter animasyonlar, countdown
- Sosyal kanıt banner mesajları uygulamaya özgü yaz ("10.000+ kullanıcı" değil, "50.000+ antrenman tamamlandı")
- UrgencyBadge ve timerBadge → Slide5 + Paywall'da dönüşüm artırır, muhafaza et