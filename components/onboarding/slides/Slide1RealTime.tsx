import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Animated,
  Dimensions,
  Easing,
} from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';

const { width, height } = Dimensions.get('window');

export function Slide1RealTime() {
  const player = useVideoPlayer(require('@/assets/images/2.mp4'), (p) => {
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
      {/* Scene Area */}
      <View style={styles.sceneArea}>
        <VideoView
          style={StyleSheet.absoluteFill}
          player={player}
          nativeControls={false}
          contentFit="cover"
        />
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
