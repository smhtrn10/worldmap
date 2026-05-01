import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Animated,
  Dimensions,
  Easing,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Globe, Zap, Shield } from 'lucide-react-native';
import { useDeviceType } from '@/hooks/useDeviceType';

const { width, height } = Dimensions.get('window');

interface WelcomeScreenProps {
  onContinue: () => void;
}

export function WelcomeScreen({ onContinue }: WelcomeScreenProps) {
  const deviceInfo = useDeviceType();
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const titleSlideAnim = useRef(new Animated.Value(40)).current;
  const titleOpacityAnim = useRef(new Animated.Value(0)).current;
  const subtitleOpacityAnim = useRef(new Animated.Value(0)).current;
  const buttonSlideAnim = useRef(new Animated.Value(40)).current;
  const buttonOpacityAnim = useRef(new Animated.Value(0)).current;

  // Floating icons
  const icon1Y = useRef(new Animated.Value(0)).current;
  const icon2Y = useRef(new Animated.Value(0)).current;
  const icon3Y = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Main animation sequence
    Animated.sequence([
      // 1. Background fade + scale
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 80,
          useNativeDriver: true,
        }),
      ]),
      // 2. Title slide-up
      Animated.parallel([
        Animated.timing(titleSlideAnim, {
          toValue: 0,
          duration: 400,
          delay: 200,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(titleOpacityAnim, {
          toValue: 1,
          duration: 400,
          delay: 200,
          useNativeDriver: true,
        }),
      ]),
      // 3. Subtitle fade
      Animated.timing(subtitleOpacityAnim, {
        toValue: 1,
        duration: 400,
        delay: 150,
        useNativeDriver: true,
      }),
      // 4. Button slide-up
      Animated.parallel([
        Animated.timing(buttonSlideAnim, {
          toValue: 0,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(buttonOpacityAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Floating icons loop
    const floatLoop1 = Animated.loop(
      Animated.sequence([
        Animated.timing(icon1Y, {
          toValue: -12,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(icon1Y, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    const floatLoop2 = Animated.loop(
      Animated.sequence([
        Animated.timing(icon2Y, {
          toValue: -16,
          duration: 2400,
          delay: 400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(icon2Y, {
          toValue: 0,
          duration: 2400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    const floatLoop3 = Animated.loop(
      Animated.sequence([
        Animated.timing(icon3Y, {
          toValue: -14,
          duration: 2200,
          delay: 800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(icon3Y, {
          toValue: 0,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    floatLoop1.start();
    floatLoop2.start();
    floatLoop3.start();

    return () => {
      floatLoop1.stop();
      floatLoop2.stop();
      floatLoop3.stop();
    };
  }, []);

  return (
    <View style={styles.container}>
      {/* Hero Section */}
      <Animated.View
        style={[
          styles.heroSection,
          {
            opacity: opacityAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <LinearGradient
          colors={['#001a0d', '#000000']}
          style={styles.gradientBg}
        >
          {/* Floating Icons */}
          <Animated.View
            style={[
              styles.floatingIcon,
              { top: height * 0.15, left: width * 0.15, transform: [{ translateY: icon1Y }] },
            ]}
          >
            <View style={styles.iconContainer}>
              <Globe size={32} color="#00FF64" />
            </View>
          </Animated.View>

          <Animated.View
            style={[
              styles.floatingIcon,
              { top: height * 0.22, right: width * 0.12, transform: [{ translateY: icon2Y }] },
            ]}
          >
            <View style={styles.iconContainer}>
              <Zap size={28} color="#FFD700" />
            </View>
          </Animated.View>

          <Animated.View
            style={[
              styles.floatingIcon,
              { top: height * 0.32, left: width * 0.25, transform: [{ translateY: icon3Y }] },
            ]}
          >
            <View style={styles.iconContainer}>
              <Shield size={30} color="#00FF64" />
            </View>
          </Animated.View>

          {/* Main Logo/Emoji */}
          <View style={styles.logoContainer}>
            <Image 
              source={require('@/assets/images/maskot.jpg')} 
              style={styles.mascotImage} 
            />
            <View style={styles.pulseRing} />
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Content Section */}
      <View style={[
        styles.contentSection,
        deviceInfo.type === 'tablet' && styles.contentSectionTablet
      ]}>
        <Animated.View
          style={{
            opacity: titleOpacityAnim,
            transform: [{ translateY: titleSlideAnim }],
          }}
        >
          <Text style={[
            styles.title,
            deviceInfo.type === 'tablet' && styles.titleTablet
          ]}>WorldPulse</Text>
          <Text style={[
            styles.tagline,
            deviceInfo.type === 'tablet' && styles.taglineTablet
          ]}>GLOBAL INTELLIGENCE</Text>
        </Animated.View>

        <Animated.Text
          style={[
            styles.subtitle,
            deviceInfo.type === 'tablet' && styles.subtitleTablet,
            { opacity: subtitleOpacityAnim },
          ]}
        >
          Real-time monitoring of global events.{'\n'}
          Earthquakes, conflicts, disasters, and breaking news.
        </Animated.Text>

        {/* Features */}
        <View style={styles.features}>
          <View style={styles.featureItem}>
            <Text style={styles.featureDot}>●</Text>
            <Text style={[
              styles.featureText,
              deviceInfo.type === 'tablet' && styles.featureTextTablet
            ]}>Live event tracking</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureDot}>●</Text>
            <Text style={[
              styles.featureText,
              deviceInfo.type === 'tablet' && styles.featureTextTablet
            ]}>Interactive world map</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureDot}>●</Text>
            <Text style={[
              styles.featureText,
              deviceInfo.type === 'tablet' && styles.featureTextTablet
            ]}>Instant notifications</Text>
          </View>
        </View>

        {/* CTA Button */}
        <Animated.View
          style={{
            opacity: buttonOpacityAnim,
            transform: [{ translateY: buttonSlideAnim }],
          }}
        >
          <Pressable
            style={({ pressed }) => [
              styles.continueButton,
              deviceInfo.type === 'tablet' && styles.continueButtonTablet,
              pressed && styles.continueButtonPressed,
            ]}
            onPress={onContinue}
          >
            <LinearGradient
              colors={['#00FF64', '#00CC50']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.buttonGradient}
            >
              <Text style={[
                styles.continueButtonText,
                deviceInfo.type === 'tablet' && styles.continueButtonTextTablet
              ]}>GET STARTED</Text>
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  heroSection: {
    height: height * 0.5,
  },
  gradientBg: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingIcon: {
    position: 'absolute',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0,255,100,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0,255,100,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mascotImage: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    borderColor: 'rgba(0,255,100,0.4)',
  },
  pulseRing: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 2,
    borderColor: 'rgba(0,255,100,0.3)',
  },
  contentSection: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    justifyContent: 'flex-start',
  },
  contentSectionTablet: {
    paddingHorizontal: 48,
    paddingTop: 32,
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
  },
  title: {
    fontSize: 42,
    fontWeight: '900',
    color: '#FFF',
    textAlign: 'center',
    letterSpacing: -1,
  },
  titleTablet: {
    fontSize: 56,
  },
  tagline: {
    fontSize: 13,
    fontWeight: '800',
    color: '#00FF64',
    textAlign: 'center',
    letterSpacing: 3,
    marginTop: 8,
  },
  taglineTablet: {
    fontSize: 16,
    letterSpacing: 4,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 24,
  },
  subtitleTablet: {
    fontSize: 20,
    lineHeight: 30,
    marginTop: 32,
  },
  features: {
    marginTop: 24,
    gap: 10,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureDot: {
    fontSize: 8,
    color: '#00FF64',
  },
  featureText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '500',
  },
  featureTextTablet: {
    fontSize: 18,
  },
  continueButton: {
    marginTop: 32,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#00FF64',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  continueButtonTablet: {
    marginTop: 48,
    borderRadius: 20,
  },
  continueButtonPressed: {
    opacity: 0.8,
  },
  buttonGradient: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: 17,
    fontWeight: '900',
    color: '#000',
    letterSpacing: 2,
  },
  continueButtonTextTablet: {
    fontSize: 20,
    letterSpacing: 3,
  },
});
