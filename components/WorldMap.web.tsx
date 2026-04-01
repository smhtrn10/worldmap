import React, { useState } from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { MapContainer, TileLayer, CircleMarker, useMapEvents } from 'react-leaflet';
import type { WorldEvent } from '@/types/events';
import { getMarkerColor } from '@/utils/formatters';

if (typeof document !== 'undefined') {
  if (!document.querySelector('link[data-leaflet]')) {
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    l.setAttribute('data-leaflet', '1');
    document.head.appendChild(l);
  }
  if (!document.querySelector('style[data-wm]')) {
    const s = document.createElement('style');
    s.setAttribute('data-wm', '1');
    s.textContent = `
      .leaflet-container { background:#0a0e1a !important; }
      .leaflet-tile-pane { filter: brightness(0.72) saturate(0.5) hue-rotate(185deg); }
      .leaflet-control-attribution,.leaflet-control-zoom { display:none !important; }
      .leaflet-overlay-pane svg { overflow:visible; }
    `;
    document.head.appendChild(s);
  }
}

export interface WorldMapProps {
  events: WorldEvent[];
  onMarkerPress: (id: string) => void;
}

function sevColor(s: string) {
  if (s === 'critical') return '#FF2D2D';
  if (s === 'high') return '#FF6B00';
  if (s === 'medium') return '#FFB800';
  return '#22C55E';
}

function fmtDate(d: Date) {
  try {
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();
  } catch { return ''; }
}

function MapDismiss({ onDismiss }: { onDismiss: () => void }) {
  useMapEvents({ click: onDismiss });
  return null;
}

export function WorldMap({ events }: WorldMapProps) {
  const [selected, setSelected] = useState<WorldEvent | null>(null);

  return (
    <View style={styles.root}>
      <View style={StyleSheet.absoluteFill}>
        <MapContainer
          center={[20, 20]}
          zoom={2.5}
          style={{ width: '100%', height: '100%' }}
          zoomControl={false}
          attributionControl={false}
          minZoom={2}
        >
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            maxZoom={19}
          />
          <TileLayer
            url="https://stamen-tiles.a.ssl.fastly.net/toner-labels/{z}/{x}/{y}.png"
            opacity={0.45}
          />
          <MapDismiss onDismiss={() => setSelected(null)} />
          {events.map((event) => {
            if (!event.coordinates) return null;
            const color = getMarkerColor(event.category, event.magnitude);
            const isSel = selected?.id === event.id;
            const r = event.severity === 'critical' ? 12 : event.severity === 'high' ? 9 : 6;
            return (
              <React.Fragment key={event.id}>
                <CircleMarker
                  center={[event.coordinates.latitude, event.coordinates.longitude]}
                  radius={r + 7}
                  pathOptions={{ color, fillColor: 'transparent', fillOpacity: 0, weight: 1, opacity: isSel ? 0.8 : 0.3 }}
                  interactive={false}
                />
                <CircleMarker
                  center={[event.coordinates.latitude, event.coordinates.longitude]}
                  radius={r}
                  pathOptions={{ color, fillColor: color, fillOpacity: 0.88, weight: isSel ? 3 : 1.5 }}
                  eventHandlers={{ click: (e) => { e.originalEvent.stopPropagation(); setSelected(event); } }}
                />
              </React.Fragment>
            );
          })}
        </MapContainer>
      </View>

      {selected && (
        <View style={[styles.panel, { borderColor: sevColor(selected.severity), shadowColor: sevColor(selected.severity) }]}>
          <Pressable style={styles.closeBtn} onPress={() => setSelected(null)}>
            <Text style={styles.closeTxt}>✕</Text>
          </Pressable>
          <View style={styles.tagRow}>
            <View style={[styles.dot, { backgroundColor: sevColor(selected.severity) }]} />
            <Text style={styles.tagTxt}>{selected.category.toUpperCase()}</Text>
            <View style={[styles.badge, { backgroundColor: sevColor(selected.severity) + '22', borderColor: sevColor(selected.severity) }]}>
              <Text style={[styles.badgeTxt, { color: sevColor(selected.severity) }]}>{selected.severity.toUpperCase()}</Text>
            </View>
          </View>
          <Text style={styles.title} numberOfLines={3}>{selected.title}</Text>
          <View style={styles.grid}>
            <View style={styles.cell}>
              <Text style={styles.cellLabel}>DATE</Text>
              <Text style={[styles.cellValue, { color: sevColor(selected.severity) }]}>{fmtDate(selected.timestamp)}</Text>
            </View>
            <View style={styles.cell}>
              <Text style={styles.cellLabel}>LOCATION</Text>
              <Text style={[styles.cellValue, { color: sevColor(selected.severity) }]} numberOfLines={2}>{selected.location ?? 'UNKNOWN'}</Text>
            </View>
            {selected.fatalities != null && selected.fatalities > 0 && (
              <View style={styles.cell}>
                <Text style={styles.cellLabel}>CASUALTIES</Text>
                <Text style={[styles.cellValue, { color: sevColor(selected.severity) }]}>{selected.fatalities.toLocaleString()}+ killed</Text>
              </View>
            )}
            {selected.magnitude != null && (
              <View style={styles.cell}>
                <Text style={styles.cellLabel}>MAGNITUDE</Text>
                <Text style={[styles.cellValue, { color: sevColor(selected.severity) }]}>M{selected.magnitude.toFixed(1)}</Text>
              </View>
            )}
            <View style={styles.cell}>
              <Text style={styles.cellLabel}>SOURCE</Text>
              <Text style={[styles.cellValue, { color: '#8B95A5' }]}>{selected.source.toUpperCase()}</Text>
            </View>
          </View>
          {selected.description ? (
            <View style={styles.descWrap}>
              <Text style={styles.descTxt} numberOfLines={4}>{selected.description}</Text>
            </View>
          ) : null}
        </View>
      )}
    </View>
  );
}

const MONO = 'Courier New';

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0a0e1a' },
  panel: {
    position: 'absolute', bottom: 100, left: 14, right: 14,
    backgroundColor: 'rgba(6,8,16,0.97)',
    borderWidth: 1, borderRadius: 10, padding: 16,
    shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 24,
    elevation: 20,
  },
  closeBtn: {
    position: 'absolute', top: 10, right: 10,
    backgroundColor: 'rgba(255,45,45,0.12)',
    borderWidth: 1, borderColor: 'rgba(255,45,45,0.4)',
    borderRadius: 4, paddingHorizontal: 9, paddingVertical: 3, zIndex: 1,
  },
  closeTxt: { color: '#FF2D2D', fontSize: 11, fontFamily: MONO },
  tagRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  tagTxt: { color: '#FF2D2D', fontSize: 9, fontWeight: '700', letterSpacing: 2, fontFamily: MONO },
  badge: { borderWidth: 1, borderRadius: 3, paddingHorizontal: 6, paddingVertical: 1 },
  badgeTxt: { fontSize: 8, fontWeight: '800', letterSpacing: 1, fontFamily: MONO },
  title: { fontSize: 16, fontWeight: '800', color: '#FFF', marginBottom: 12, lineHeight: 22, paddingRight: 32, fontFamily: MONO },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 10 },
  cell: { width: '47%' },
  cellLabel: { fontSize: 8, letterSpacing: 1.5, color: '#444', textTransform: 'uppercase', marginBottom: 2, fontFamily: MONO },
  cellValue: { fontSize: 12, fontWeight: '700', fontFamily: MONO },
  descWrap: { borderTopWidth: 1, borderTopColor: '#111827', paddingTop: 10 },
  descTxt: { fontSize: 11, color: '#888', lineHeight: 18, fontFamily: MONO },
});
