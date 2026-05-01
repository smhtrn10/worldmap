import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Animated, Dimensions, Easing } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';

const { width, height } = Dimensions.get('window');

export function Slide4PremiumIntel() {
  const player = useVideoPlayer(require('@/assets/images/5.mp4'), (p) => {
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
        <Text style={styles.socialText}>🔥 Limited time offer — 40% OFF</Text>
      </View>

      <Animated.View style={[styles.content, { opacity: titleOp, transform: [{ translateY: titleSlide }] }]}>
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
      </Animated.View>
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
