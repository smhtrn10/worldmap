# Animasyon Referansı

Onboarding/Paywall için tüm animasyon paternleri ve hazır kod blokları.

---

## Temel Paternler

### 1. Spring Giriş (Elastik Pop)
```typescript
// Kullanım: maskot, buton, badge, ikon girişi
Animated.spring(val, {
  toValue: 1,
  friction: 4,      // düşük → daha elastik
  tension: 80,      // yüksek → daha hızlı
  useNativeDriver: true,
})
```

### 2. Slide-Up + Fade (Metin/Kart girişi)
```typescript
const slideAnim = useRef(new Animated.Value(40)).current;  // 40px aşağıda başla
const opacityAnim = useRef(new Animated.Value(0)).current;

Animated.parallel([
  Animated.timing(slideAnim, { toValue: 0, duration: 400, delay: 200, useNativeDriver: true }),
  Animated.timing(opacityAnim, { toValue: 1, duration: 400, delay: 200, useNativeDriver: true }),
])
```

### 3. Pulse Döngüsü (Badge, ikon dikkat çekme)
```typescript
Animated.loop(
  Animated.sequence([
    Animated.timing(pulse, { toValue: 1.06, duration: 700, useNativeDriver: true }),
    Animated.timing(pulse, { toValue: 1.0,  duration: 700, useNativeDriver: true }),
  ])
).start();
```

### 4. Stagger (Ardışık kart/item girişi)
```typescript
Animated.stagger(
  80,  // her item arasında 80ms
  items.map(item =>
    Animated.parallel([
      Animated.timing(item.op, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.spring(item.y, { toValue: 0, friction: 6, tension: 80, useNativeDriver: true }),
    ])
  )
).start();
```

### 5. Flash Efekti (Dikkat, "çekim anı")
```typescript
const flashOp = useRef(new Animated.Value(0)).current;

// Kullanım: tam ekran beyaz view, zIndex: 20
Animated.sequence([
  Animated.timing(flashOp, { toValue: 1,   duration: 60,  useNativeDriver: true }),
  Animated.timing(flashOp, { toValue: 0,   duration: 150, useNativeDriver: true }),
  Animated.timing(flashOp, { toValue: 0.8, duration: 60,  useNativeDriver: true }),
  Animated.timing(flashOp, { toValue: 0,   duration: 250, useNativeDriver: true }),
]).start();
```

### 6. Radyal Burst (Yıldız/parçacık patlaması)
```typescript
const starAnims = useRef(
  Array.from({ length: 12 }, () => ({
    x: new Animated.Value(0),
    y: new Animated.Value(0),
    op: new Animated.Value(0),
    sc: new Animated.Value(0),
  }))
).current;

// Animasyon:
const burst = starAnims.map((s, i) => {
  const angle = (i / starAnims.length) * Math.PI * 2;
  const dist = 70 + Math.random() * 60;
  return Animated.parallel([
    Animated.timing(s.x, { toValue: Math.cos(angle) * dist, duration: 600, delay: i * 30, useNativeDriver: true }),
    Animated.timing(s.y, { toValue: Math.sin(angle) * dist, duration: 600, delay: i * 30, useNativeDriver: true }),
    Animated.timing(s.op, { toValue: 1, duration: 200, delay: i * 30, useNativeDriver: true }),
    Animated.spring(s.sc, { toValue: 1, friction: 4, tension: 100, useNativeDriver: true }),
  ]);
});
Animated.parallel(burst).start();

// JSX:
starAnims.map((s, i) => (
  <Animated.Text
    key={i}
    style={{
      position: 'absolute',
      top: CENTER_Y, left: CENTER_X,
      opacity: s.op,
      transform: [{ translateX: s.x }, { translateY: s.y }, { scale: s.sc }],
    }}
  >
    {i % 2 === 0 ? '⭐' : '✨'}
  </Animated.Text>
))
```

### 7. Shimmer Sweep (Parlama efekti)
```typescript
const shimmer = useRef(new Animated.Value(-width)).current;

Animated.loop(
  Animated.timing(shimmer, {
    toValue: width * 1.5,
    duration: 2000,
    delay: 1500,
    easing: Easing.linear,
    useNativeDriver: true,
  })
).start();

// JSX (kapsayıcı içinde):
<Animated.View style={{
  position: 'absolute',
  top: 0, bottom: 0,
  width: 80,
  backgroundColor: 'rgba(255,255,255,0.06)',
  transform: [{ translateX: shimmer }, { skewX: '-20deg' }],
}} />
```

### 8. Bounce (Yıkama/atlama döngüsü)
```typescript
Animated.loop(
  Animated.sequence([
    Animated.timing(bounceY, { toValue: -22, duration: 220, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    Animated.timing(bounceY, { toValue: 0,   duration: 220, easing: Easing.in(Easing.quad), useNativeDriver: true }),
  ]),
  { iterations: 5 }
).start();
```

### 9. Float Döngüsü (Maskot havada yüzer)
```typescript
Animated.loop(
  Animated.sequence([
    Animated.timing(floatY, { toValue: -14, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    Animated.timing(floatY, { toValue: 0,   duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
  ])
).start();
```

### 10. Fade Rotasyonu (Banner mesaj geçişi)
```typescript
const opacityAnim = useRef(new Animated.Value(1)).current;
const [idx, setIdx] = useState(0);

useEffect(() => {
  const interval = setInterval(() => {
    Animated.timing(opacityAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      setIdx(i => (i + 1) % messages.length);
      Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    });
  }, 2500);
  return () => clearInterval(interval);
}, []);
```

### 11. Scale Transition (Ekran geçişi)
```typescript
// onboarding.tsx'teki transitionAnim
const transitionAnim = useRef(new Animated.Value(1)).current;

const transitionTo = (nextIndex: number) => {
  Animated.timing(transitionAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
    setCurrentQuestion(nextIndex);
    Animated.timing(transitionAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start(() =>
      setIsTransitioning(false)
    );
  });
};

// Kullanım:
<Animated.View style={{ opacity: transitionAnim }}>
  {/* Soru içeriği */}
</Animated.View>
```

---

## Layout Animasyonları (useNativeDriver: false)

Bunlar **width/height/position** değiştirdiği için `useNativeDriver: false`:

```typescript
// Progress bar genişliği
Animated.timing(progressWidth, {
  toValue: (current + 1) / SLIDES.length,
  duration: 400,
  easing: Easing.out(Easing.cubic),
  useNativeDriver: false,  // ← ZORUNLU false
})

// Yüzde interpolation
width: progressWidth.interpolate({
  inputRange: [0, 1],
  outputRange: ['0%', '100%'],
})

// Bar fill genişliği (BuildingScreen)
width: bar.interpolate({
  inputRange: [0, 1],
  outputRange: ['0%', '100%'],
})
```

---

## Cleanup Kuralları

```typescript
useEffect(() => {
  // Animasyon başlat
  const anim = Animated.loop(...);
  anim.start();
  
  const timer = setTimeout(onComplete, 2800);
  const interval = setInterval(..., 1000);
  counterVal.addListener(...);

  return () => {
    // TÜMÜNÜ temizle!
    anim.stop();
    clearTimeout(timer);
    clearInterval(interval);
    counterVal.removeAllListeners();
    animRef.current?.stop();
  };
}, []);
```

---

## Easing Referansı

```typescript
import { Easing } from 'react-native';

Easing.out(Easing.cubic)  // Hızlı başla, yavaş bitir → UI elemanları
Easing.in(Easing.quad)    // Yavaş başla, hızlan → yerçekimi efekti
Easing.inOut(Easing.sin)  // Sinüs dalgası → float/sway döngüsü
Easing.linear             // Sabit hız → shimmer, dönen öğeler
Easing.bounce             // Doğal zıplama (native spring tercih edilir)
```

---

## Performance Notları

1. **useNativeDriver: true** → opacity, transform (translate, scale, rotate) için HER ZAMAN
2. **useNativeDriver: false** → width, height, backgroundColor, top, left için ZORUNLU
3. **Animated.Value'ları render dışında tut** → `useRef(new Animated.Value(0)).current`
4. **Loop animasyonları** → component unmount'ta `.stop()` çağır (memory leak)
5. **setInterval/setTimeout** → cleanup'ta clearInterval/clearTimeout
6. **addListener** → cleanup'ta removeAllListeners