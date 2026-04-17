import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Animated,
  Dimensions,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { Slide1RealTime } from './slides/Slide1RealTime';
import { Slide2GlobalCoverage } from './slides/Slide2GlobalCoverage';
import { Slide3InstantAlerts } from './slides/Slide3InstantAlerts';
import { Slide4PremiumIntel } from './slides/Slide4PremiumIntel';
import { Slide5Rating } from './slides/Slide5Rating';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  Slide1RealTime,
  Slide2GlobalCoverage,
  Slide3InstantAlerts,
  Slide4PremiumIntel,
  Slide5Rating,
];

interface FeatureSlidesProps {
  onComplete: () => void;
}

export function FeatureSlides({ onComplete }: FeatureSlidesProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const slideOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Animate progress bar
    Animated.timing(progressAnim, {
      toValue: (currentSlide + 1) / SLIDES.length,
      duration: 400,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [currentSlide]);

  const handleNext = () => {
    if (currentSlide < SLIDES.length - 1) {
      // Fade out → change slide → fade in
      Animated.timing(slideOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start(() => {
        setCurrentSlide(currentSlide + 1);
        Animated.timing(slideOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      });
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const SlideComponent = SLIDES[currentSlide];

  return (
    <View style={styles.container}>
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <Animated.View
          style={[
            styles.progressBar,
            {
              width: progressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>

      {/* Progress Dots */}
      <View style={styles.dotsContainer}>
        {SLIDES.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              index === currentSlide && styles.dotActive,
            ]}
          />
        ))}
      </View>

      {/* Skip Button */}
      {currentSlide < SLIDES.length - 1 && (
        <Pressable style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>SKIP</Text>
        </Pressable>
      )}

      {/* Slide Content */}
      <Animated.View style={[styles.slideContainer, { opacity: slideOpacity }]}>
        <SlideComponent key={currentSlide} />
      </Animated.View>

      {/* Continue Button */}
      <View style={styles.footer}>
        <Pressable
          style={({ pressed }) => [
            styles.continueButton,
            pressed && styles.continueButtonPressed,
          ]}
          onPress={handleNext}
        >
          <LinearGradient
            colors={['#00FF64', '#00CC50']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.buttonGradient}
          >
            <Text style={styles.continueButtonText}>
              {currentSlide === SLIDES.length - 1 ? 'GET STARTED' : 'CONTINUE'}
            </Text>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  progressContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.1)',
    zIndex: 10,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#00FF64',
  },
  dotsContainer: {
    position: 'absolute',
    top: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    zIndex: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  dotActive: {
    backgroundColor: '#00FF64',
    width: 24,
  },
  skipButton: {
    position: 'absolute',
    top: 16,
    right: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    zIndex: 10,
  },
  skipText: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 1,
  },
  slideContainer: {
    flex: 1,
    marginTop: 48,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  continueButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#00FF64',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  continueButtonPressed: {
    opacity: 0.8,
  },
  buttonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#000',
    letterSpacing: 2,
  },
});
