import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Animated, Dimensions, Easing } from 'react-native';

const { width, height } = Dimensions.get('window');

export function Slide3InstantAlerts() {
  const [countdown, setCountdown] = React.useState(3);
  const countScale = useRef(new Animated.Value(1)).current;
  const ringScale = useRef(new Animated.Value(0.3)).current;
  const ringOp = useRef(new Animated.Value(0.8)).current;
  const bellShake = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const sequence = async () => {
      for (let i = 3; i > 0; i--) {
        setCountdown(i);
        // Ring pulse
        ringScale.setValue(0.3);
        ringOp.setValue(0.8);
        Animated.parallel([
          Animated.spring(countScale, {
            toValue: 1.3,
            friction: 3,
            tension: 120,
            useNativeDriver: true,
          }),
          Animated.timing(ringScale, {
            toValue: 2.2,
            duration: 700,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(ringOp, {
            toValue: 0,
            duration: 700,
            useNativeDriver: true,
          }),
        ]).start(() => countScale.setValue(1));
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      // Bell shake
      setCountdown(0);
      Animated.sequence([
        Animated.timing(bellShake, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(bellShake, { toValue: 10, duration: 100, useNativeDriver: true }),
        Animated.timing(bellShake, { toValue: -10, duration: 100, useNativeDriver: true }),
        Animated.timing(bellShake, { toValue: 10, duration: 100, useNativeDriver: true }),
        Animated.timing(bellShake, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();
    };

    sequence();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.sceneArea}>
        {countdown > 0 ? (
          <>
            <Animated.View
              style={[
                styles.ring,
                {
                  opacity: ringOp,
                  transform: [{ scale: ringScale }],
                },
              ]}
            />
            <Animated.Text
              style={[
                styles.countdownText,
                { transform: [{ scale: countScale }] },
              ]}
            >
              {countdown}
            </Animated.Text>
          </>
        ) : (
          <Animated.Text
            style={[
              styles.bellEmoji,
              { transform: [{ rotate: bellShake.interpolate({
                inputRange: [-10, 10],
                outputRange: ['-15deg', '15deg'],
              }) }] },
            ]}
          >
            🔔
          </Animated.Text>
        )}

        {/* Notification cards */}
        <View style={[styles.notifCard, { top: '15%', left: '10%' }]}>
          <Text style={styles.notifEmoji}>⚠️</Text>
          <Text style={styles.notifText}>M6.2 Earthquake</Text>
        </View>
        <View style={[styles.notifCard, { top: '30%', right: '8%' }]}>
          <Text style={styles.notifEmoji}>🔥</Text>
          <Text style={styles.notifText}>Wildfire Alert</Text>
        </View>
      </View>

      <View style={styles.socialBanner}>
        <Text style={styles.socialText}>⚡ Instant push notifications</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Never Miss Critical Events</Text>
        <Text style={styles.subtitle}>
          Get instant alerts for earthquakes, disasters, and breaking news in your regions of interest.
        </Text>

        <View style={styles.steps}>
          <View style={styles.step}>
            <Text style={styles.stepEmoji}>🔔</Text>
            <Text style={styles.stepText}>Real-time alerts</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.step}>
            <Text style={styles.stepEmoji}>⚙️</Text>
            <Text style={styles.stepText}>Custom filters</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.step}>
            <Text style={styles.stepEmoji}>📍</Text>
            <Text style={styles.stepText}>Location-based</Text>
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
    backgroundColor: '#1A0D0D',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  ring: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 3,
    borderColor: '#FFD700',
  },
  countdownText: {
    fontSize: 120,
    fontWeight: '900',
    color: '#FFD700',
    textShadowColor: 'rgba(255,215,0,0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 30,
  },
  bellEmoji: {
    fontSize: 100,
  },
  notifCard: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.3)',
  },
  notifEmoji: {
    fontSize: 16,
  },
  notifText: {
    fontSize: 12,
    color: '#FFF',
    fontWeight: '600',
  },
  socialBanner: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255,215,0,0.08)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,215,0,0.1)',
  },
  socialText: {
    fontSize: 12,
    color: '#FFD700',
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
  steps: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 32,
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  step: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  stepEmoji: {
    fontSize: 24,
  },
  stepText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
    textAlign: 'center',
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
});
