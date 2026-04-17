import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Animated, Dimensions, Easing } from 'react-native';

const { width, height } = Dimensions.get('window');

export function Slide2GlobalCoverage() {
  const counterVal = useRef(new Animated.Value(0)).current;
  const [counter, setCounter] = React.useState(0);
  const mascotBounce = useRef(new Animated.Value(0)).current;

  // Falling objects
  const objects = useRef(
    Array.from({ length: 9 }, () => ({
      y: new Animated.Value(-100),
      op: new Animated.Value(0),
      rotate: new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    // Counter animation
    Animated.timing(counterVal, {
      toValue: 195,
      duration: 1800,
      delay: 600,
      useNativeDriver: false,
    }).start();

    counterVal.addListener(({ value }) => setCounter(Math.floor(value)));

    // Falling objects
    Animated.stagger(
      80,
      objects.map((obj) =>
        Animated.parallel([
          Animated.timing(obj.y, {
            toValue: height * 0.35,
            duration: 1200,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(obj.op, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(obj.rotate, {
            toValue: 720,
            duration: 1200,
            useNativeDriver: true,
          }),
        ])
      )
    ).start();

    // Mascot bounce loop
    const bounceLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(mascotBounce, {
          toValue: -22,
          duration: 220,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(mascotBounce, {
          toValue: 0,
          duration: 220,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
      { iterations: 5 }
    );
    bounceLoop.start();

    return () => {
      counterVal.removeAllListeners();
      bounceLoop.stop();
    };
  }, []);

  const emojis = ['🌍', '🔥', '🌊', '⚡', '🌪️', '🗺️', '📡', '🛰️', '📊'];

  return (
    <View style={styles.container}>
      <View style={styles.sceneArea}>
        {/* Falling objects */}
        {objects.map((obj, i) => (
          <Animated.Text
            key={i}
            style={[
              styles.fallingObject,
              {
                left: (i % 3) * (width / 3) + width / 6,
                opacity: obj.op,
                transform: [
                  { translateY: obj.y },
                  {
                    rotate: obj.rotate.interpolate({
                      inputRange: [0, 720],
                      outputRange: ['0deg', '720deg'],
                    }),
                  },
                ],
              },
            ]}
          >
            {emojis[i]}
          </Animated.Text>
        ))}

        {/* Counter */}
        <View style={styles.counterContainer}>
          <Text style={styles.counterNumber}>{counter}</Text>
          <Text style={styles.counterLabel}>COUNTRIES</Text>
        </View>

        {/* Mascot */}
        <Animated.Text
          style={[
            styles.mascot,
            { transform: [{ translateY: mascotBounce }] },
          ]}
        >
          🌐
        </Animated.Text>
      </View>

      <View style={styles.socialBanner}>
        <Text style={styles.socialText}>🔥 Covering every continent</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Worldwide Coverage</Text>
        <Text style={styles.subtitle}>
          Monitor events across 195 countries with comprehensive global data sources.
        </Text>

        <View style={styles.compareContainer}>
          <View style={styles.compareCard}>
            <Text style={styles.compareEmoji}>📱</Text>
            <Text style={styles.compareTitle}>Standard</Text>
            <Text style={styles.compareValue}>Limited regions</Text>
          </View>
          <Text style={styles.vs}>VS</Text>
          <View style={[styles.compareCard, styles.compareCardPremium]}>
            <Text style={styles.compareEmoji}>🌍</Text>
            <Text style={styles.compareTitle}>WorldPulse</Text>
            <Text style={styles.compareValuePremium}>Global access</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  sceneArea: {
    height: height * 0.42,
    backgroundColor: '#0D0D1A',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  fallingObject: {
    position: 'absolute',
    fontSize: 32,
    top: 0,
  },
  counterContainer: {
    alignItems: 'center',
  },
  counterNumber: {
    fontSize: 72,
    fontWeight: '900',
    color: '#00FF64',
    textShadowColor: 'rgba(0,255,100,0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  counterLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 2,
    marginTop: 8,
  },
  mascot: {
    position: 'absolute',
    bottom: 30,
    fontSize: 48,
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
  compareContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 32,
    gap: 12,
  },
  compareCard: {
    flex: 1,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
  },
  compareCardPremium: {
    backgroundColor: 'rgba(0,255,100,0.08)',
    borderColor: 'rgba(0,255,100,0.3)',
  },
  compareEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  compareTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 4,
  },
  compareValue: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
  },
  compareValuePremium: {
    fontSize: 12,
    color: '#00FF64',
    fontWeight: '700',
  },
  vs: {
    fontSize: 14,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.3)',
  },
});
