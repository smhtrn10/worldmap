import React from 'react';
import { StyleSheet, View, Text } from 'react-native';

export interface MiniMapProps {
  latitude: number;
  longitude: number;
  markerColor: string;
}

export function MiniMap({ latitude, longitude, markerColor }: MiniMapProps) {
  return (
    <View style={[styles.container, { borderColor: markerColor }]}>
      <View style={[styles.dot, { backgroundColor: markerColor }]} />
      <Text style={styles.coords}>
        {latitude.toFixed(4)}°N, {longitude.toFixed(4)}°E
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 80, borderWidth: 1, borderRadius: 8,
    backgroundColor: '#0d1117',
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 10,
  },
  dot: { width: 12, height: 12, borderRadius: 6 },
  coords: { color: '#8B95A5', fontSize: 13, fontFamily: 'monospace' },
});
