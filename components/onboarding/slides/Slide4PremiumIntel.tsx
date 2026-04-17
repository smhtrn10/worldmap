import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Animated, Dimensions, Easing } from 'react-native';

const { width, height } = Dimensions.get('window');

export function Slide4PremiumIntel() {
  const [timeLeft, setTimeLeft] = React.useState({ m: 23, s: 59 });
  const crownScale = useRef(new Animated.Value(0)).current;
  const glowOp = useRef(new Animated.Value(0.3)).current;

  // Stars burst
  const stars = useRef(
    Array.from({ length: 12 }, () => ({
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      op: new Animated.Value(0),
      sc: new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    // Crown pop
    Animated.spring(crownScale, {
      toValue: 1,
      friction: 4,
      tension: 80,
      delay: 200,
      useNativeDriver: true,
    }).start();

    // Stars burst
    Animated.parallel(
      stars.map((s, i) => {
        const angle = (i / stars.length) * Math.PI * 2;
        const dist = 70 + Math.random() * 60;
        return Animated.parallel([
          Animated.timing(s.x, {
            toValue: Math.cos(angle) * dist,
            duration: 600,
            delay: i * 30,
            useNativeDriver: true,
          }),
          Animated.timing(s.y, {
            toValue: Math.sin(angle) * dist,
            duration: 600,
            delay: i * 30,
            useNativeDriver: true,
          }),
          Animated.timing(s.op, {
            toValue: 1,
            duration: 200,
            delay: i * 30,
            useNativeDriver: true,
          }),
          Animated.spring(s.sc, {
            toValue: 1,
            friction: 4,
            tension: 100,
            useNativeDriver: true,
          }),
        ]);
      })
    ).start();

    // Glow loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowOp, {
          toValue: 0.6,
          duration: 1000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(glowOp, {
          toValue: 0.3,
          duration: 1000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Countdown timer
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t.s > 0) return { ...t, s: t.s - 1 };
        if (t.m > 0) return { m: t.m - 1, s: 59 };
        return t;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const timeStr = `${String(timeLeft.m).padStart(2, '0')}:${String(timeLeft.s).padStart(2, '0')}`;

  return (
    <View style={styles.container}>
      <View style={styles.sceneArea}>
        {/* Glow */}
        <Animated.View
          style={[
            styles.glow,
            { opacity: glowOp },
          ]}
        />

        {/* Stars */}
        {stars.map((s, i) => (
          <Animated.Text
            key={i}
            style={[
              styles.star,
              {
                opacity: s.op,
                transform: [
                  { translateX: s.x },
                  { translateY: s.y },
                  { scale: s.sc },
                ],
              },
            ]}
          >
            {i % 2 === 0 ? '⭐' : '✨'}
          </Animated.Text>
        ))}

        {/* Crown */}
        <Animated.Text
          style={[
            styles.crownEmoji,
            { transform: [{ scale: crownScale }] },
          ]}
        >
          👑
        </Animated.Text>

        {/* Timer badge */}
        <View style={styles.timerBadge}>
          <Text style={styles.timerText}>⏰ {timeStr}</Text>
        </View>
      </View>

      <View style={styles.socialBanner}>
        <Text style={styles.socialText}>🔥 Limited time offer — 40% OFF</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Unlock Premium Intelligence</Text>
        <Text style={styles.subtitle}>
          Access restricted conflict zones, social unrest data, and advanced analytics.
        </Text>

        <View style={styles.features}>
          {[
            '✓ Conflict zone mapping',
            '✓ Social unrest tracking',
            '✓ Advanced filters',
            '✓ Unlimited access',
            '✓ No watermarks',
          ].map((feature, i) => (
            <View key={i} style={styles.featureItem}>
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  sceneArea: {
    height: height * 0.42,
    backgroundColor: '#1A0D1A',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 60,
  },
  star: {
    position: 'absolute',
    fontSize: 20,
    top: '50%',
    left: '50%',
  },
  crownEmoji: {
    fontSize: 100,
  },
  timerBadge: {
    position: 'absolute',
    bottom: 30,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255,215,0,0.15)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.3)',
  },
  timerText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFD700',
  },
  socialBanner: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255,107,53,0.08)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,107,53,0.1)',
  },
  socialText: {
    fontSize: 12,
    color: '#FF6B35',
    textAlign: 'center',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 22,
  },
  features: {
    marginTop: 24,
    gap: 10,
  },
  featureItem: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255,215,0,0.08)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.15)',
  },
  featureText: {
    fontSize: 14,
    color: '#FFD700',
    fontWeight: '600',
  },
});
