import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Animated,
  Pressable,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { WelcomeScreen } from '@/components/onboarding/WelcomeScreen';
import { FeatureSlides } from '@/components/onboarding/FeatureSlides';

const { width, height } = Dimensions.get('window');
const ONBOARDING_KEY = '@worldpulse_onboarding_completed';

type OnboardingPhase = 'welcome' | 'features' | 'complete';

export default function OnboardingScreen() {
  const router = useRouter();
  const [phase, setPhase] = useState<OnboardingPhase>('welcome');
  const transitionAnim = useRef(new Animated.Value(1)).current;

  const handleWelcomeContinue = () => {
    Animated.timing(transitionAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setPhase('features');
      Animated.timing(transitionAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    });
  };

  const handleComplete = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
      // Navigate to main app (tabs)
      router.replace('/(tabs)' as any);
    } catch (error) {
      console.error('Error saving onboarding state:', error);
      router.replace('/(tabs)' as any);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Animated.View style={[styles.content, { opacity: transitionAnim }]}>
        {phase === 'welcome' && (
          <WelcomeScreen onContinue={handleWelcomeContinue} />
        )}
        {phase === 'features' && (
          <FeatureSlides onComplete={handleComplete} />
        )}
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    flex: 1,
  },
});
