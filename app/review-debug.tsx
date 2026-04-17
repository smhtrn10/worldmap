import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { ReviewManager } from '@/utils/reviewManager';
import { ChevronLeft, RefreshCw, Trash2, Star } from 'lucide-react-native';

export default function ReviewDebugScreen() {
  const router = useRouter();
  const [debugInfo, setDebugInfo] = useState({
    appOpens: 0,
    eventsViewed: 0,
    daysSinceInstall: 0,
    canRequest: false,
  });

  const loadDebugInfo = async () => {
    const info = await ReviewManager.getDebugInfo();
    setDebugInfo(info);
  };

  useEffect(() => {
    loadDebugInfo();
  }, []);

  const handleIncrementOpens = async () => {
    await ReviewManager.incrementAppOpens();
    await loadDebugInfo();
  };

  const handleIncrementEvents = async () => {
    await ReviewManager.incrementEventsViewed();
    await loadDebugInfo();
  };

  const handleRequestReview = async () => {
    await ReviewManager.requestReview();
    Alert.alert('Review Requested', 'Check if the native dialog appeared');
  };

  const handleReset = async () => {
    Alert.alert(
      'Reset Stats',
      'Are you sure you want to reset all review statistics?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await ReviewManager.resetStats();
            await loadDebugInfo();
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ChevronLeft size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.title}>Review Debug</Text>
        <Pressable style={styles.refreshButton} onPress={loadDebugInfo}>
          <RefreshCw size={20} color={Colors.accent.primary} />
        </Pressable>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Stats</Text>
          <View style={styles.card}>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>App Opens</Text>
              <Text style={styles.statValue}>{debugInfo.appOpens}</Text>
            </View>
            <View style={[styles.statRow, styles.statRowBorder]}>
              <Text style={styles.statLabel}>Events Viewed</Text>
              <Text style={styles.statValue}>{debugInfo.eventsViewed}</Text>
            </View>
            <View style={[styles.statRow, styles.statRowBorder]}>
              <Text style={styles.statLabel}>Days Since Install</Text>
              <Text style={styles.statValue}>{debugInfo.daysSinceInstall}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Can Request Review</Text>
              <Text
                style={[
                  styles.statValue,
                  { color: debugInfo.canRequest ? '#4CAF50' : '#FF6B6B' },
                ]}
              >
                {debugInfo.canRequest ? 'YES' : 'NO'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thresholds</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Min App Opens</Text>
              <Text style={styles.infoValue}>5</Text>
            </View>
            <View style={[styles.infoRow, styles.infoRowBorder]}>
              <Text style={styles.infoLabel}>Min Events Viewed</Text>
              <Text style={styles.infoValue}>10</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Min Days Since Install</Text>
              <Text style={styles.infoValue}>3</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>
          
          <Pressable style={styles.actionButton} onPress={handleIncrementOpens}>
            <Text style={styles.actionButtonText}>Increment App Opens</Text>
          </Pressable>

          <Pressable style={styles.actionButton} onPress={handleIncrementEvents}>
            <Text style={styles.actionButtonText}>Increment Events Viewed</Text>
          </Pressable>

          <Pressable
            style={[styles.actionButton, styles.primaryButton]}
            onPress={handleRequestReview}
          >
            <Star size={18} color="#000" fill="#000" />
            <Text style={[styles.actionButtonText, styles.primaryButtonText]}>
              Request Review Now
            </Text>
          </Pressable>

          <Pressable
            style={[styles.actionButton, styles.dangerButton]}
            onPress={handleReset}
          >
            <Trash2 size={18} color="#FF6B6B" />
            <Text style={[styles.actionButtonText, styles.dangerButtonText]}>
              Reset All Stats
            </Text>
          </Pressable>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoBoxTitle}>ℹ️ How It Works</Text>
          <Text style={styles.infoBoxText}>
            • Review dialog appears automatically when user views 10 events{'\n'}
            • Requires minimum 5 app opens and 3 days since install{'\n'}
            • Won't show again for 90 days after last prompt{'\n'}
            • iOS native dialog - no custom UI needed
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  refreshButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  statRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  statLabel: {
    fontSize: 15,
    color: Colors.text,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 16,
    color: Colors.accent.primary,
    fontWeight: '700',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  infoRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  infoLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '600',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    marginBottom: 12,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  primaryButton: {
    backgroundColor: '#FFD700',
    borderColor: '#FFD700',
  },
  primaryButtonText: {
    color: '#000',
  },
  dangerButton: {
    backgroundColor: 'transparent',
    borderColor: '#FF6B6B',
  },
  dangerButtonText: {
    color: '#FF6B6B',
  },
  infoBox: {
    margin: 16,
    padding: 16,
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 40,
  },
  infoBoxTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  infoBoxText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});
