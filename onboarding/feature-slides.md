# FeatureSlides Tasarım Referansı

6 slaytlı, her biri kendi animasyon hikayesiyle tam onboarding feature galerisi.

---

## Genel Mimari

```typescript
const SLIDES = [Slide1, Slide2, Slide3, Slide4, Slide5, Slide6];
const SLIDE_ACCENTS = [accent1, accent2, accent3, accent4, accent5, accent5];

// Her slide ayrı component → key prop ile sıfırla:
<SlideComponent key={slideIndex} />
```

**Ana container yapısı:**
```
ProgressBarTrack (üst şerit)
ProgressDots (nokta indikatörler)
SlideWrapper (flex: 1)
Footer CTA (sabit alt buton)
```

---

## Slide Şablonları

### Şablon A: "Hero Launch" (Slide 1 için ideal)

**Hikaye:** Ürünün ana özelliği dramatik girişle tanıtılır.

**Scene animasyonları:**
1. Maskot dışarıdan slide-in (spring, width * 0.12 hedef)
2. Ana ikon/araç pop-in (scale + opacity)
3. **Flash efekti** (60ms → 0 → 0.8 → 0) — dikkat çekici!
4. Patlayan yıldızlar (stagger, 5-6 adet)
5. Başlık + alt başlık slide-up
6. Shimmer sweep döngüsü (arka plan üzerinde)

**Scene arka plan rengi:** `#0D0D1A` (koyu mavi-siyah)

**Trust strip** (alt kısım):
```typescript
['✓ Özellik 1', '✓ Özellik 2', '✓ Özellik 3']
// Pill şeklinde, border: #2E2E2E
```

---

### Şablon B: "Burst & Count" (Slide 2 için ideal)

**Hikaye:** Bolluk ve çeşitlilik vurgusu. "120+ ses", "500+ tarif" gibi.

**Scene animasyonları:**
1. Objeler yukarıdan düşer (9 adet, stagger 80ms, rotate 720°)
2. Maskot zıplar (5 iterations loop)
3. Sound/emoji daireleri radyal burst (4 adet)
4. Counter animasyonu (0 → MAX, 1800ms)
5. Wave/action ikonu scale-in

**Counter kodu:**
```typescript
const counterVal = useRef(new Animated.Value(0)).current;
const [counter, setCounter] = useState(0);

// Animasyon:
Animated.timing(counterVal, { toValue: 120, duration: 1800, delay: 400, useNativeDriver: false }).start();
counterVal.addListener(({ value }) => setCounter(Math.floor(value)));
// cleanup: counterVal.removeAllListeners();
```

**Scene arka plan:** `#180011` (koyu mor) veya uygulamaya göre

---

### Şablon C: "Countdown" (Slide 3 için ideal)

**Hikaye:** Hassasiyet, zamanlama, kontrol.

**Animasyon sırası:**
```
3 → ring pulse → 2 → ring pulse → 1 → ring pulse → [PATLAMA]
```

**Ring pulse kodu:**
```typescript
const ringPulse = () => {
  ringScale.setValue(0.3);
  ringOp.setValue(0.8);
  Animated.parallel([
    Animated.spring(countScale, { toValue: 1.3, friction: 3, tension: 120, useNativeDriver: true }),
    Animated.timing(ringScale, { toValue: 2.2, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    Animated.timing(ringOp, { toValue: 0, duration: 700, useNativeDriver: true }),
  ]).start(() => countScale.setValue(1));
};

// 0 gelince maskot + success ring + glow loop
```

**Steps strip** (alt kısım, horizontal pills):
```typescript
['🔊 Adım 1', '⏱ Adım 2', '📸 Adım 3']
// Arasında divider
```

---

### Şablon D: "Card Stack + Compare" (Slide 4 için ideal)

**Hikaye:** Sınırsızlık, bolluk, ölçek.

**Kart stack animasyonu:**
```typescript
// 4 kart, farklı rotation (-10° ile +10° arası):
cardAnims.map((c) =>
  Animated.parallel([
    Animated.spring(c.y, { toValue: 0, friction: 6, tension: 80 }),
    Animated.timing(c.op, { toValue: 1, duration: 350 }),
  ])
)
// Üst üste konumlandırma: position: 'absolute', zIndex: CARDS - i
```

**Karşılaştırma tablosu:**
```
┌──────────────┐  VS  ┌──────────────┐
│  📱 Standart │      │  ☁️ Premium  │
│  Özellik yok │      │  Sınırsız    │
│  (kırmızı)   │      │  (yeşil)     │
└──────────────┘      └──────────────┘
```

**Floating mascot** (loop, -14px yukarı aşağı, 900ms):
```typescript
Animated.loop(Animated.sequence([
  Animated.timing(mascotFloat, { toValue: -14, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
  Animated.timing(mascotFloat, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
]))
```

---

### Şablon E: "Premium Reveal" (Slide 5 için ideal)

**Hikaye:** Premium'un değeri, aciliyet, FOMO.

**Scene animasyonları:**
1. 12 yıldız radyal burst (her açıda, 70-130px mesafe)
2. Maskot 360° spin giriş
3. Watermark → fade out + scale 2.5x → yerinde ✅ belirir
4. 👑 crown pop
5. Gold glow loop
6. Countdown timer (23:59'dan geriye sayım, gerçek setInterval)

**Countdown timer:**
```typescript
const [timeLeft, setTimeLeft] = useState({ m: 23, s: 59 });
useEffect(() => {
  const interval = setInterval(() => {
    setTimeLeft(t => {
      if (t.s > 0) return { ...t, s: t.s - 1 };
      if (t.m > 0) return { m: t.m - 1, s: 59 };
      return t;
    });
  }, 1000);
  return () => clearInterval(interval);
}, []);
const timeStr = `${String(timeLeft.m).padStart(2, '0')}:${String(timeLeft.s).padStart(2, '0')}`;
```

**Feature checklist** (metin kısmında):
```typescript
// 5 madde, uygulamaya özgü yaz
['✓ Mükemmel fotoğraf', '✓ 120+ ses', '✓ Sınırsız medya', ...]
// Koyu kart + border, padding: 9px 16px, borderRadius: 10
```

---

### Şablon F: "Rating Request" (Slide 6 için ideal)

**Hikaye:** Sosyal kanıt + app store rating.

**Animasyon sırası:**
1. Maskot spring scale-in
2. Başlık slide-up
3. Buton kartları slide-up

**Butonlar:**
```typescript
// EVET butonu → expo-store-review
const handleYes = async () => {
  const { default: StoreReview } = await import('expo-store-review');
  if (await StoreReview.hasAction()) await StoreReview.requestReview();
};

// HAYIR butonu → sadece setAnswered(true)
```

**Dynamic import** ile `expo-store-review` yükle (bundle size için).

---

## Ortak Elemanlar

### SocialProofBanner (her slide'da)
```typescript
// Rotasyonlu mesajlar, her 2.5 saniyede fade değişim
const messages = [
  '⭐ 4.9 — 10.000+ yorum',
  '🔥 Bu hafta 5.000 kişi katıldı',
  '🏆 #1 Kategori uygulaması',
  '💯 Kullanıcıların %94\'ü tavsiye ediyor',
];
// Uygulamaya göre özelleştir!
```

### UrgencyBadge (Slide 5'te)
```typescript
// Pulsing badge, 1.06x scale döngüsü
'🔥 Sadece bugün — %40 indirim'
// veya: '⏰ Sınırlı teklif'
```

### Progress Bar (FeatureSlides top)
```typescript
// Thin 3px bar, accent rengiyle progress
// width: Animated interpolate 0% → 100%
// + dot indicators
```

---

## Tasarım Tokenları

```typescript
const D = {
  dark:         '#0D0D0D',    // Ana arka plan
  card:         '#1A1A1A',    // Kart arka plan
  cardBorder:   '#2E2E2E',    // Kart kenar
  textPrimary:  '#FFFFFF',
  textSub:      '#A0A0A0',
  radius:       20,

  // Accent seçenekleri (uygulamaya göre seç):
  orange:   '#FF6B35',   // Enerji, eylem, fitness
  pink:     '#EF476F',   // Duygu, premium, eğlence
  blue:     '#118AB2',   // Güven, finans, profesyonel
  teal:     '#06D6A0',   // Sağlık, başarı, doğa
  gold:     '#FFD166',   // Ödül, premium, başarı
  purple:   '#7B2FBE',   // Yaratıcılık, müzik, meditasyon
};
```

---

## Önemli Notlar

1. **Her slide ayrı component** — kendi useEffect'i, kendi animasyon state'leri
2. **key prop ile sıfırla** — `<SlideComponent key={slideIndex} />` ZORUNLU
3. **useEffect cleanup** — tüm setTimeout/setInterval/Animated.loop temizle
4. **Scene height:** `height * 0.42` — tablet ve küçük ekranda dengeli
5. **sceneArea overflow: 'hidden'** — partikül/shimmer taşmasını önle
6. **Shimmer efekti:** `skewX('-20deg')` + semi-transparent white → glass effect