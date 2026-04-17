# Bileşen Referansları

Her bileşenin tam implementasyon kalıpları ve özelleştirme noktaları.

---

## WelcomeScreen

**Amaç:** İlk izlenim. Görsel + marka adı + tek CTA butonu.

**Yapı:**
```
- Tam ekran görsel (üst %62) — resim veya gradient arka plan
- Paw/tematik animasyon (walking pawprints veya floating particles)
- Alt içerik: App adı (42px bold) + subtitle + CTA butonu
```

**Animasyon sırası (kritik — bu sırayı koru):**
1. Görsel fade-in + spring scale (0.85 → 1)
2. Tematik animasyon (paw prints, floating icons, particles) stagger
3. Başlık slide-up + fade
4. Alt başlık fade (150ms delay)
5. Buton slide-up + fade

**Özelleştirme noktaları:**
```typescript
// Tematik animasyon — uygulamaya göre değiştir:
// PetCam: PAW_POSITIONS → yürüyen pençe izleri
// Fitness: floating dumbbell emojis → 💪
// Finans: rising coin particles → 💰
// Müzik: floating music notes → 🎵

const THEMED_POSITIONS = [
  { x: width * 0.08, y: height * 0.72, rotate: '-20deg' },
  { x: width * 0.18, y: height * 0.65, rotate: '-15deg' },
  // ...6 pozisyon
];
```

**Görsel yoksa alternatif:**
```typescript
// Görsel yerine gradient arka plan
<LinearGradient
  colors={[Colors.primary + '40', Colors.background]}
  style={styles.imageWrapper}
>
  <Text style={styles.heroEmoji}>{APP_EMOJI}</Text>  {/* 120px */}
</LinearGradient>
```

---

## ChatBubble

**Amaç:** Typewriter efektiyle soru göster, bitince `onComplete` çağır.

**Değiştirme:** `typingSpeed` prop'u (default: 30ms). Kısa sorular için 25ms, uzunlar için 35ms.

**Kritik:** `key={currentQuestion}` ile her soru değişiminde sıfırla.

```typescript
<ChatBubble
  key={currentQuestion}        // ← ZORUNLU
  text={t(q.questionKey)}
  onComplete={() => setOptionsVisible(true)}
  typingSpeed={28}
/>
```

---

## MascotCharacter

**Amaç:** Her soru geçişinde bounce animasyonu yapan maskot.

```typescript
<MascotCharacter
  emoji="🐾"              // ← Uygulamaya göre değiştir
  triggerAnimation={currentQuestion}  // değişince tetikler
  size={72}
/>
```

**Alternatif maskotlar:**
```
Fitness app    → "💪" veya "🏃"
Finans app     → "💰" veya "📊"
Müzik app      → "🎵" veya "🎸"
Yemek app      → "🍳" veya "👨‍🍳"
```

---

## OptionCards

**Amaç:** Slide-in animasyonlu seçenek kartları (single/multi select).

**Görünüm:**
```
┌──────────────────────────────────┐
│  Seçenek metni              ●    │  ← seçilmemiş
└──────────────────────────────────┘
┌──────────────────────────────────┐
│  Seçenek metni              ●    │  ← seçili (primary border + bg)
└──────────────────────────────────┘
```

**Animasyon:** Her kart `animationDelay = index * 80ms` ile slide-up.

**visible prop kritik:** `optionsVisible` false iken kartlar gizli/sıfır pozisyonda.

---

## BuildingScreen

**Amaç:** Cevaplar alındıktan sonra 2.8 saniye "hazırlanıyor" animasyonu.

**Öğeler:**
- Maskot emoji (72px)
- Kişiselleştirilmiş başlık: `"{petName} için profil oluşturuluyor..."`
- 3 progress bar (stagger animasyon, farklı hızlar)
- 3 pulsing dot
- Alt metin (uygulamaya özgü)

**Özelleştirme:**
```typescript
// Başlık formatı — uygulamaya göre değiştir:
// PetCam:   "{petName} için profil oluşturuluyor"
// Fitness:  "{name} için antrenman planı hazırlanıyor"
// Finans:   "{name} için bütçe analizi yapılıyor"
// Genel:    "Senin için kişiselleştiriliyor"

// Süre: onComplete için 2800ms önerilir (minimum 2500ms)
timeoutRef.current = setTimeout(onComplete, 2800);
```

---

## StarBurstScreen

**Amaç:** Kişiselleştirilmiş kutlama — "Hazır!" anı.

**Animasyon:**
1. Maskot spring giriş (scale 0.3 → 1)
2. 6 yıldız radyal burst (80ms stagger)
3. Kişiselleştirilmiş başlık fade-in

```typescript
// Başlık örneği:
// "{petName} için profil hazır! 🎉"
// "{name}, antrenman planın hazır! 💪"
// Kısa, enerjik, kişisel tut
```

**2500ms sonra otomatik geçiş** → premiumIntro.

---

## PremiumIntroScreen

**Amaç:** PaywallModal öncesi "neden premium?" satış sayfası.

**Yapı:**
```
👑  ← Crown emoji, 56px
"Premium'a Geç"
"Tüm özelliklerin kilidini aç"

[FeatureCard] — her özellik için stagger animasyon
[Continue Butonu]
```

**FeatureCard yapısı:**
```typescript
{ icon: '📸', title: 'Mükemmel Fotoğraf', description: 'AI destekli...' }
{ icon: '🔊', title: 'Özel Sesler', description: '120+ ses efekti...' }
{ icon: '♾️', title: 'Sınırsız Kullanım', description: 'Depolama limiti yok' }
{ icon: '✨', title: 'Su Damgası Yok', description: 'Temiz, profesyonel...' }
```

**Minimum 4, maksimum 6 özellik** önerilir.

---

## onboarding.tsx (Orkestratör)

**Phase geçiş mantığı:**

```typescript
// Soru tipleri:
// 'single' → seçince otomatik ileri (300ms delay)
// 'multi'  → Continue butonu gerekli
// 'input'  → TextInput + Continue butonu gerekli

const handleOptionSelect = (value: string) => {
  if (q.type === 'multi') {
    // toggle
  } else {
    setAnswers(prev => ({ ...prev, [q.id]: value }));
    setTimeout(() => handleNext(), 300);  // ← otomatik ileri
  }
};

// Son sorudan sonra 'building' phase'e geç
if (currentQuestion < QUESTIONS.length - 1) {
  transitionTo(currentQuestion + 1);
} else {
  setPhase('building');
}
```

**Progress bar:** Her soru için dot göster (flex: 1, height: 4, borderRadius: 2).

**Transition animasyonu:** fade out (200ms) → state değişimi → fade in (250ms).