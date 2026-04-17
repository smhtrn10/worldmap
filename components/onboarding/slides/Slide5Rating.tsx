import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Pressable, Animated, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export function Slide5Rating() {
  const [answered, setAnswered] = React.useState(false);
  const mascotScale = useRef(new Animated.Value(0)).current;
  const titleSlide = useRef(new Animated.Value(40)).current;
  const titleOp = useRef(new Animated.Value(0)).current;
  const buttonsSlide = useRef(new Animated.Value(40)).current;
  const buttonsOp = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(mascotScale, {
        toValue: 1,
        friction: 4,
        tension: 80,
        delay: 200,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(titleSlide, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(titleOp, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(buttonsSlide, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(buttonsOp, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  const handleYes = async () => {
    setAnswered(true);
    try {
      const StoreReview = await import('expo-store-review');
      if (await StoreReview.hasAction()) {
        await StoreReview.requestReview();
      }
    } catch (error) {
      console.log('Store review not available');
    }
  };

  const handleNo = () => {
    setAnswered(true);
  };

  return (
    <View style={styles.container}>
      <View style={styles.sceneArea}>
        <Animated.Text
          style={[
            styles.mascotEmoji,
            { transform: [{ scale: mascotScale }] },
          ]}
        >
          🌍
        </Animated.Text>

        {/* Stars */}
        <View style={styles.starsContainer}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Text key={i} style={styles.starEmoji}>⭐</Text>
          ))}
        </View>
      </View>

      <View style={styles.socialBanner}>
        <Text style={styles.socialText}>⭐ 4.9 rating — 10,000+ reviews</Text>
      </View>

      <View style={styles.content}>
        <Animated.View
          style={{
            opacity: titleOp,
            transform: [{ translateY: titleSlide }],
          }}
        >
          <Text style={styles.title}>Enjoying WorldPulse?</Text>
          <Text style={styles.subtitle}>
            {answered
              ? 'Thank you for your feedback!'
              : 'Help us improve by rating the app on the App Store.'}
          </Text>
        </Animated.View>

        {!answered && (
          <Animated.View
            style={[
              styles.buttonsContainer,
              {
                opacity: buttonsOp,
                transform: [{ translateY: buttonsSlide }],
              },
            ]}
          >
            <Pressable
              style={({ pressed }) => [
                styles.button,
                styles.buttonYes,
                pressed && styles.buttonPressed,
              ]}
              onPress={handleYes}
            >
              <Text style={styles.buttonTextYes}>Yes, Rate Now</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.button,
                styles.buttonNo,
                pressed && styles.buttonPressed,
              ]}
              onPress={handleNo}
            >
              <Text style={styles.buttonTextNo}>Maybe Later</Text>
            </Pressable>
          </Animated.View>
        )}

        {answered && (
          <View style={styles.thankYouContainer}>
            <Text style={styles.thankYouEmoji}>🙏</Text>
            <Text style={styles.thankYouText}>
              Your feedback helps us serve you better!
            </Text>
          </View>
        )}
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
  mascotEmoji: {
    fontSize: 100,
    marginBottom: 20,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  starEmoji: {
    fontSize: 32,
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
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 22,
    textAlign: 'center',
  },
  buttonsContainer: {
    marginTop: 32,
    gap: 12,
  },
  button: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonYes: {
    backgroundColor: '#00FF64',
  },
  buttonNo: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  buttonPressed: {
    opacity: 0.7,
  },
  buttonTextYes: {
    fontSize: 16,
    fontWeight: '800',
    color: '#000',
  },
  buttonTextNo: {
    fontSize: 16,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
  },
  thankYouContainer: {
    marginTop: 40,
    alignItems: 'center',
  },
  thankYouEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  thankYouText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 22,
  },
});
