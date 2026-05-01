import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Animated, Dimensions, Easing } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';

const { width, height } = Dimensions.get('window');

export function Slide3InstantAlerts() {
  const player = useVideoPlayer(require('@/assets/images/4.mp4'), (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });
  const titleSlide = useRef(new Animated.Value(40)).current;
  const titleOp = useRef(new Animated.Value(0)).current;

  useEffect(() => {
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
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.sceneArea}>
        <VideoView
          style={StyleSheet.absoluteFill}
          player={player}
          nativeControls={false}
          contentFit="cover"
        />
      </View>

      <View style={styles.socialBanner}>
        <Text style={styles.socialText}>⚡ Instant push notifications</Text>
      </View>

      <Animated.View style={[styles.content, { opacity: titleOp, transform: [{ translateY: titleSlide }] }]}>
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
      </Animated.View>
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
