import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { RefreshCcw } from 'lucide-react-native';
import { Colors } from '@/constants/colors';

interface RefreshFABProps {
  onRefresh: () => void;
  isLoading?: boolean;
}

export function RefreshFAB({ onRefresh, isLoading }: RefreshFABProps) {
  const spinAnim = useRef(new Animated.Value(0)).current;
  const [showToast, setShowToast] = useState(false);
  const wasLoading = useRef(false);

  useEffect(() => {
    if (isLoading) {
      wasLoading.current = true;
      const spin = Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        })
      );
      spin.start();
      return () => spin.stop();
    } else {
      spinAnim.setValue(0);
      if (wasLoading.current) {
        wasLoading.current = false;
        setShowToast(true);
        const timer = setTimeout(() => setShowToast(false), 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [isLoading, spinAnim]);

  const rotate = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.wrapper}>
      {showToast && (
        <View style={styles.toast}>
          <Text style={styles.toastText}>Updated!</Text>
        </View>
      )}
      <Pressable
        onPress={onRefresh}
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
        disabled={isLoading}
      >
        <Animated.View style={{ transform: [{ rotate }] }}>
          <RefreshCcw size={22} color={Colors.text} />
        </Animated.View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 110,
    right: 16,
    alignItems: 'center',
    gap: 8,
  },
  toast: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  toastText: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  fab: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.accent.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.accent.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  fabPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.95 }],
  },
});
