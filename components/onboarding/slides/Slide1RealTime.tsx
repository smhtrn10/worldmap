import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Animated,
  Dimensions,
  Easing,
} from 'react-native';

const { width, height } = Dimensions.get('window');

export function Slide1RealTime() {
  const mascotScale = useRef(new Animated.Value(0)).current;
  const flashOp = useRef(new Animated.Value(0)).current;
  const titleSlide = useRef(new Animated.Value(40)).current;
  const titleOp = useRef(new Animated.Value(0)).current;
  const shimmer = useRef(new Animated.Value(-width)).current;

  // Stars for burst
  const stars = useRef(
    Array.from({ length: 6 }, () => ({
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      op: new Animated.Value(0),
      sc: new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    // Animation sequence
    Animated.sequence([
      // 1. Mascot pop
      Animated.spring(mascotScale, {
        toValue: 1,
        friction: 4,
        tension: 80,
        delay: 200,
        useNativeDriver: true,
      }),
      // 2. Flash effect
      Animated.sequence([
        Animated.timing(flashOp, { toValue: 1, duration: 60, useNativeDriver: true }),
        Animated.timing(flashOp, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(flashOp, { toValue: 0.8, duration: 60, useNativeDriver: true }),
        Animated.timing(flashOp, { toValue: 0, duration: 250, useNativeDriver: true }),
      ]),
      // 3. Stars burst
      Animated.parallel(
        stars.map((s, i) => {
          const angle = (i / stars.length) * Math.PI * 2;
          const dist = 60 + Math.random() * 40;
          return Animated.parallel([
            Animated.timing(s.x, {
              toValue: Math.cos(angle) * dist,
              duration: 600,
              delay: i * 40,
              useNativeDriver: true,
            }),
            Animated.timing(s.y, {
              toValue: Math.sin(angle) * dist,
              duration: 600,
              delay: i * 40,
              useNativeDriver: true,
            }),
            Animated.timing(s.op, {
              toValue: 1,
              duration: 200,
              delay: i * 40,
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
      ),
      // 4. Title slide-up
      Animated.parallel([
        Animated.timing(titleSlide, {
          toValue: 0,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(titleOp, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Shimmer loop
    const shimmerLoop = Animated.loop(
      Animated.timing(shimmer, {
        toValue: width * 1.5,
        duration: 2000,
        delay: 1500,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    shimmerLoop.start();

    return () => {
      shimmerLoop.stop();
    };
  }, []);

  return (
    <View style={styles.container}>
      {/* Scene Area */}
      <View style={styles.sceneArea}>
        {/* Flash overlay */}
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: '#FFF', opacity: flashOp, zIndex: 20 },
          ]}
        />

        {/* Shimmer effect */}
        <Animated.View
          style={[
            styles.shimmer,
            { transform: [{ translateX: shimmer }, { skewX: '-20deg' }] },
          ]}
        />

        {/* Main mascot */}
        <Animated.View
          style={[
            styles.mascotContainer,
            { transform: [{ scale: mascotScale }] },
          ]}
        >
          <Text style={styles.mascotEmoji}>🌍</Text>
          <View style={styles.pulseRing} />
        </Animated.View>

        {/* Burst stars */}
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
            {i % 2 === 0 ? '⚡' : '✨'}
          </Animated.Text>
        ))}

        {/* Floating event indicators */}
        <View style={[styles.eventBadge, { top: '20%', left: '15%' }]}>
          <Text style={styles.eventEmoji}>🔥</Text>
        </View>
        <View style={[styles.eventBadge, { top: '35%', right: '12%' }]}>
          <Text style={styles.eventEmoji}>🌊</Text>
        </View>
        <View style={[styles.eventBadge, { bottom: '25%', left: '20%' }]}>
          <Text style={styles.eventEmoji}>⚠️</Text>
        </View>
      </View>

      {/* Social Proof Banner */}
      <View style={styles.socialBanner}>
        <Text style={styles.socialText}>⭐ Real-time data from 8+ sources</Text>
      </View>

      {/* Content */}
      <Animated.View
        style={[
          styles.content,
          {
            opacity: titleOp,
            transform: [{ translateY: titleSlide }],
          },
        ]}
      >
        <Text style={styles.title}>Live Global Monitoring</Text>
        <Text style={styles.subtitle}>
          Track earthquakes, wildfires, conflicts, and breaking news as they happen worldwide.
        </Text>

        {/* Feature pills */}
        <View style={styles.pills}>
          <View style={styles.pill}>
            <Text style={styles.pillText}>✓ Real-time updates</Text>
          </View>
          <View style={styles.pill}>
            <Text style={styles.pillText}>✓ 8 event categories</Text>
          </View>
          <View style={styles.pill}>
            <Text style={styles.pillText}>✓ Global coverage</Text>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sceneArea: {
    height: height * 0.42,
    backgroundColor: '#0D1A0D',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 80,
    backgroundColor: 'rgba(0,255,100,0.06)',
  },
  mascotContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mascotEmoji: {
    fontSize: 100,
    textShadowColor: 'rgba(0,255,100,0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 30,
  },
  pulseRing: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    borderColor: 'rgba(0,255,100,0.4)',
  },
  star: {
    position: 'absolute',
    fontSize: 24,
    top: '50%',
    left: '50%',
  },
  eventBadge: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(0,255,100,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventEmoji: {
    fontSize: 20,
  },
  socialBanner: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0,255,100,0.08)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,255,100,0.1)',
  },
  socialText: {
    fontSize: 12,
    color: '#00FF64',
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
  pills: {
    marginTop: 24,
    gap: 10,
  },
  pill: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0,255,100,0.08)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,255,100,0.15)',
  },
  pillText: {
    fontSize: 14,
    color: '#00FF64',
    fontWeight: '600',
  },
});
