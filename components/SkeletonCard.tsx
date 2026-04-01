import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Colors } from '@/constants/colors';

export function SkeletonCard() {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmer = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      })
    );
    shimmer.start();
    return () => shimmer.stop();
  }, [shimmerAnim]);

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 200],
  });

  return (
    <View style={styles.container}>
      <View style={styles.iconSkeleton} />
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <View style={styles.titleSkeleton} />
          <View style={styles.badgeSkeleton} />
        </View>
        <View style={styles.footerRow}>
          <View style={styles.locationSkeleton} />
          <View style={styles.timeSkeleton} />
        </View>
      </View>
      <Animated.View
        style={[
          styles.shimmer,
          { transform: [{ translateX }] },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  iconSkeleton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.border,
    marginRight: 12,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleSkeleton: {
    flex: 1,
    height: 16,
    backgroundColor: Colors.border,
    borderRadius: 4,
    marginRight: 8,
  },
  badgeSkeleton: {
    width: 60,
    height: 20,
    backgroundColor: Colors.border,
    borderRadius: 6,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  locationSkeleton: {
    flex: 1,
    height: 12,
    backgroundColor: Colors.border,
    borderRadius: 4,
    marginRight: 8,
  },
  timeSkeleton: {
    width: 50,
    height: 12,
    backgroundColor: Colors.border,
    borderRadius: 4,
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
});
