import React, { useState, useCallback, useMemo } from 'react';
import { StyleSheet, View, Text, Pressable, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import type { WorldEvent } from '@/types/events';
import { getMarkerColor } from '@/utils/formatters';

export interface WorldMapProps {
  events: WorldEvent[];
  onMarkerPress: (id: string) => void;
}

function sevColor(s: string) {
  if (s === 'critical') return '#FF2D2D';
  if (s === 'high')     return '#FF6B00';
  if (s === 'medium')   return '#FFB800';
  return '#22C55E';
}

function fmtDate(d: Date) {
  try { return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase(); }
  catch { return ''; }
}

function getCategoryIcon(cat: string): string {
  switch (cat) {
    case 'earthquake': return '⚡';
    case 'wildfire':   return '🔥';
    case 'flood':      return '🌊';
    case 'volcano':    return '🌋';
    case 'storm':      return '⛈';
    case 'conflict':   return '💥';
    case 'news':       return '📡';
    default:           return '●';
  }
}

function buildHTML(events: WorldEvent[]): string {
  const withCoords = events.filter(e => e.coordinates);

  const markersJson = JSON.stringify(withCoords.map(e => ({
    id: e.id,
    lat: e.coordinates!.latitude,
    lng: e.coordinates!.longitude,
    color: getMarkerColor(e.category, e.magnitude),
    size: e.severity === 'critical' ? 22 : e.severity === 'high' ? 17 : e.severity === 'medium' ? 13 : 10,
    icon: getCategoryIcon(e.category),
    category: e.category,
    severity: e.severity,
  })));

  // Aynı kategorideki TÜM eventler longitude sırasıyla zincir halinde bağlanır
  // Her segment kendi from-event'inin rengini taşır
  const lines: { from: number; to: number; color: string }[] = [];
  const catGroups: Record<string, typeof withCoords> = {};
  withCoords.forEach(e => {
    if (!catGroups[e.category]) catGroups[e.category] = [];
    catGroups[e.category].push(e);
  });
  Object.entries(catGroups).forEach(([_cat, evs]) => {
    if (evs.length < 2) return;
    // Longitude'a göre sırala → soldan sağa zincir
    const sorted = [...evs].sort(
      (a, b) => a.coordinates!.longitude - b.coordinates!.longitude
    );
    for (let i = 0; i < sorted.length - 1; i++) {
      const fromIdx = withCoords.indexOf(sorted[i]);
      const toIdx   = withCoords.indexOf(sorted[i + 1]);
      const color   = getMarkerColor(sorted[i].category, sorted[i].magnitude);
      lines.push({ from: fromIdx, to: toIdx, color });
    }
  });
  const linesJson = JSON.stringify(lines);

  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body,#map{width:100%;height:100%;background:#0a0e1a;overflow:hidden}
.leaflet-control-attribution,.leaflet-control-zoom{display:none!important}

/* Dark ama harita okunabilir — hafif kontrast artışı */
.leaflet-tile-pane{
  filter: brightness(0.82) contrast(1.15) saturate(0.7);
}

@keyframes pulse {
  0%  {transform:scale(1);opacity:0.8}
  50% {transform:scale(1.6);opacity:0.2}
  100%{transform:scale(1);opacity:0.8}
}
@keyframes dash {
  to{stroke-dashoffset:-20}
}
@keyframes glow {
  0%,100%{box-shadow:0 0 6px var(--c),0 0 12px var(--c)}
  50%{box-shadow:0 0 14px var(--c),0 0 28px var(--c),0 0 40px var(--c)}
}
@keyframes borderPulse {
  0%,100%{opacity:1}
  50%{opacity:0.5}
}

.marker-wrap{position:relative;display:flex;align-items:center;justify-content:center;cursor:pointer}
.marker-ring1{position:absolute;border-radius:50%;border:1.5px solid var(--c);animation:pulse 2s ease-in-out infinite;opacity:0.5}
.marker-ring2{position:absolute;border-radius:50%;border:1px solid var(--c);animation:pulse 2s ease-in-out infinite 0.5s;opacity:0.3}
.marker-core{border-radius:50%;background:var(--c);border:2px solid rgba(255,255,255,0.9);display:flex;align-items:center;justify-content:center;animation:glow 3s ease-in-out infinite;font-size:10px;line-height:1}
.marker-critical .marker-ring1{animation-duration:1.2s}
.marker-critical .marker-ring2{animation-duration:1.2s}

/* Country borders overlay */
.leaflet-countries-pane { pointer-events: none; }
</style>
</head>
<body>
<div id="map"></div>
<svg id="lines-svg" style="position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:400"></svg>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
var map = L.map('map',{
  zoomControl:false,
  attributionControl:false,
  preferCanvas:true,
  maxBoundsViscosity:1.0
}).setView([20,20],2);

/* ── TILE LAYERS ────────────────────────────────────────────────
   Strateji: Natural Earth light base → CSS filter ile koyultuyoruz.
   Böylece kara/okyanus ayrımı ve kıyı hatları korunur.
   Üstüne Carto dark-only labels bindirilir.
─────────────────────────────────────────────────────────────── */

// Base: Carto Dark Matter — gerçek dark, harita detayları net
L.tileLayer(
  'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  { maxZoom:19, subdomains:'abcd', opacity:1.0 }
).addTo(map);

/* ── COUNTRY BORDERS (GeoJSON) ──────────────────────────────────
   Statik sınır çizgileri her zaman görünür.
   Event tıklayınca ilgili ülke highlight edilir.
─────────────────────────────────────────────────────────────── */
var countriesData = null;
var bordersLayer  = null;
var highlightLayer = null;

// Statik sınır rengi: mavi-gri, ince
var BORDER_STYLE = {
  color:       '#4a7fa5',
  weight:      0.8,
  opacity:     0.65,
  fillColor:   '#0d1829',
  fillOpacity: 0.45,
  dashArray:   null,
};

fetch('https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_110m_admin_0_countries.geojson')
  .then(function(r){ return r.json(); })
  .then(function(data){
    countriesData = data;
    // Ülke dolgularını ve sınırlarını çiz
    bordersLayer = L.geoJSON(data, {
      style: BORDER_STYLE,
      // Hover efekti
      onEachFeature: function(feature, layer) {
        layer.on('mouseover', function(){
          if(highlightLayer && highlightLayer !== layer) return;
          layer.setStyle({ fillOpacity: 0.6, weight: 1.2 });
        });
        layer.on('mouseout', function(){
          if(highlightLayer) return; // highlighted ülkeye dokunma
          bordersLayer.resetStyle(layer);
        });
      }
    });
    // Marker altında kalması için pane sırası
    bordersLayer.setZIndex ? null : null;
    bordersLayer.addTo(map);
    // Marker katmanının altına al
    bordersLayer.bringToBack();
  })
  .catch(function(){ console.warn('GeoJSON load failed'); });

/* ── MARKERS ────────────────────────────────────────────────── */
var markers = ${markersJson};
var lines   = ${linesJson};
var leafletMarkers = [];

markers.forEach(function(m, i){
  var s = m.size;
  var html =
    '<div class="marker-wrap marker-'+m.severity+'" style="--c:'+m.color+';width:'+(s+20)+'px;height:'+(s+20)+'px">'
    +'<div class="marker-ring1" style="width:'+(s+18)+'px;height:'+(s+18)+'px"></div>'
    +'<div class="marker-ring2" style="width:'+(s+10)+'px;height:'+(s+10)+'px"></div>'
    +'<div class="marker-core" style="width:'+s+'px;height:'+s+'px;--c:'+m.color+'">'+m.icon+'</div>'
    +'</div>';
  var icon = L.divIcon({
    html: html, className:'',
    iconSize:  [s+20, s+20],
    iconAnchor:[(s+20)/2, (s+20)/2]
  });
  var lm = L.marker([m.lat, m.lng], {
    icon: icon,
    zIndexOffset: m.severity === 'critical' ? 1000 : 0
  });
  lm.on('click', function(){
    map.flyTo([m.lat, m.lng], 5, { duration:1.4, easeLinearity:0.3 });
    highlightCountry(m.lat, m.lng, m.color);
    window.ReactNativeWebView.postMessage(
      JSON.stringify({ type:'select', id:m.id, lat:m.lat, lng:m.lng, color:m.color })
    );
  });
  lm.addTo(map);
  leafletMarkers.push(lm);
});

/* ── CONNECTION LINES (rAF animated) ───────────────────────── */
var svg = document.getElementById('lines-svg');
var dashOffset = 0;
var lineElements = [];

function buildLines(){
  svg.innerHTML = '';
  lineElements = [];
  var size = map.getSize();
  svg.setAttribute('viewBox','0 0 '+size.x+' '+size.y);
  var DASH = '10 6';

  lines.forEach(function(l){
    var from = markers[l.from];
    var to   = markers[l.to];
    if(!from || !to) return;

    var p1 = map.latLngToContainerPoint([from.lat, from.lng]);
    var p2 = map.latLngToContainerPoint([to.lat,   to.lng]);

    // Glow layer
    var glow = document.createElementNS('http://www.w3.org/2000/svg','line');
    glow.setAttribute('x1',p1.x); glow.setAttribute('y1',p1.y);
    glow.setAttribute('x2',p2.x); glow.setAttribute('y2',p2.y);
    glow.setAttribute('stroke', l.color);
    glow.setAttribute('stroke-width','5');
    glow.setAttribute('stroke-opacity','0.15');
    glow.setAttribute('stroke-linecap','round');
    glow.setAttribute('stroke-dasharray', DASH);
    glow.setAttribute('stroke-dashoffset', String(dashOffset));
    svg.appendChild(glow);

    // Sharp line
    var line = document.createElementNS('http://www.w3.org/2000/svg','line');
    line.setAttribute('x1',p1.x); line.setAttribute('y1',p1.y);
    line.setAttribute('x2',p2.x); line.setAttribute('y2',p2.y);
    line.setAttribute('stroke', l.color);
    line.setAttribute('stroke-width','1.5');
    line.setAttribute('stroke-opacity','0.75');
    line.setAttribute('stroke-linecap','round');
    line.setAttribute('stroke-dasharray', DASH);
    line.setAttribute('stroke-dashoffset', String(dashOffset));
    svg.appendChild(line);

    lineElements.push({
      glow: glow, line: line,
      fromLat: from.lat, fromLng: from.lng,
      toLat: to.lat, toLng: to.lng
    });
  });
}

function refreshLinePositions(){
  var size = map.getSize();
  svg.setAttribute('viewBox','0 0 '+size.x+' '+size.y);
  lineElements.forEach(function(el){
    var p1 = map.latLngToContainerPoint([el.fromLat, el.fromLng]);
    var p2 = map.latLngToContainerPoint([el.toLat,   el.toLng]);
    el.glow.setAttribute('x1',p1.x); el.glow.setAttribute('y1',p1.y);
    el.glow.setAttribute('x2',p2.x); el.glow.setAttribute('y2',p2.y);
    el.line.setAttribute('x1',p1.x); el.line.setAttribute('y1',p1.y);
    el.line.setAttribute('x2',p2.x); el.line.setAttribute('y2',p2.y);
  });
}

// rAF loop — drives dash offset for every frame → smooth flowing lines
var lastTs = 0;
function animateLines(ts){
  var dt = ts - lastTs; lastTs = ts;
  dashOffset -= dt * 0.028; // speed: lower = slower
  lineElements.forEach(function(el){
    el.glow.setAttribute('stroke-dashoffset', String(dashOffset));
    el.line.setAttribute('stroke-dashoffset', String(dashOffset));
  });
  requestAnimationFrame(animateLines);
}
requestAnimationFrame(animateLines);

map.on('move zoom', refreshLinePositions);
map.on('moveend zoomend', buildLines);
setTimeout(buildLines, 600);

/* ── COUNTRY HIGHLIGHT ──────────────────────────────────────── */
function pointInPolygon(point, polygon) {
  var x=point[0], y=point[1], inside=false;
  for(var i=0,j=polygon.length-1; i<polygon.length; j=i++){
    var xi=polygon[i][0],yi=polygon[i][1],xj=polygon[j][0],yj=polygon[j][1];
    if(((yi>y)!=(yj>y))&&(x<(xj-xi)*(y-yi)/(yj-yi)+xi)) inside=!inside;
  }
  return inside;
}

function findCountry(lat, lng) {
  if(!countriesData) return null;
  for(var i=0; i<countriesData.features.length; i++){
    var f=countriesData.features[i];
    var geom=f.geometry;
    if(!geom) continue;
    var polys = geom.type==='Polygon'
      ? [geom.coordinates]
      : geom.type==='MultiPolygon'
        ? geom.coordinates
        : [];
    for(var p=0;p<polys.length;p++){
      if(pointInPolygon([lng,lat], polys[p][0])) return f;
    }
  }
  return null;
}

function highlightCountry(lat, lng, color) {
  // Önceki highlight'ı kaldır
  if(highlightLayer){ map.removeLayer(highlightLayer); highlightLayer=null; }

  var feature = findCountry(lat, lng);
  if(!feature) return;

  highlightLayer = L.geoJSON(feature, {
    style: {
      color:       color,
      weight:      2.5,
      opacity:     1.0,
      fillColor:   color,
      fillOpacity: 0.18,
      dashArray:   null,
    }
  }).addTo(map);

  // Markerların altında kalmasın
  highlightLayer.bringToFront();

  // Parlama animasyonu için CSS inject
  var styleId = 'hl-style';
  var existing = document.getElementById(styleId);
  if(existing) existing.remove();
  var st = document.createElement('style');
  st.id = styleId;
  st.textContent =
    '@keyframes borderPulse{0%,100%{opacity:1}50%{opacity:0.5}}' +
    '.leaflet-overlay-pane path:last-child{animation:borderPulse 2s ease-in-out infinite}';
  document.head.appendChild(st);
}

map.on('click', function(){
  if(highlightLayer){ map.removeLayer(highlightLayer); highlightLayer=null; }
  if(bordersLayer) bordersLayer.bringToBack();
});
</script>
</body>
</html>`;
}

export function WorldMapNative({ events }: WorldMapProps) {
  const [selected, setSelected] = useState<WorldEvent | null>(null);
  const html = useMemo(() => buildHTML(events), [events]);

  const onMessage = useCallback((e: any) => {
    try {
      const data = JSON.parse(e.nativeEvent.data);
      if (data.type === 'select') {
        const event = events.find(ev => ev.id === data.id);
        if (event) setSelected(event);
      }
    } catch {
      const event = events.find(ev => ev.id === e.nativeEvent.data);
      if (event) setSelected(event);
    }
  }, [events]);

  return (
    <View style={styles.root}>
      <WebView
        style={styles.map}
        source={{ html }}
        onMessage={onMessage}
        scrollEnabled={false}
        bounces={false}
        javaScriptEnabled
        domStorageEnabled
        originWhitelist={['*']}
        mixedContentMode="always"
        allowFileAccess
        cacheEnabled={false}
      />

      {selected && (
        <View style={[
          styles.panel,
          { borderColor: sevColor(selected.severity), shadowColor: sevColor(selected.severity) }
        ]}>
          <Pressable style={styles.closeBtn} onPress={() => setSelected(null)}>
            <Text style={styles.closeTxt}>✕</Text>
          </Pressable>

          <View style={styles.tagRow}>
            <View style={[styles.tagDot, { backgroundColor: sevColor(selected.severity) }]} />
            <Text style={styles.tagTxt}>{selected.category.toUpperCase()}</Text>
            <View style={[
              styles.badge,
              { backgroundColor: sevColor(selected.severity) + '22', borderColor: sevColor(selected.severity) }
            ]}>
              <Text style={[styles.badgeTxt, { color: sevColor(selected.severity) }]}>
                {selected.severity.toUpperCase()}
              </Text>
            </View>
          </View>

          <Text style={styles.title} numberOfLines={3}>{selected.title}</Text>

          <View style={styles.grid}>
            <View style={styles.cell}>
              <Text style={styles.cellLabel}>DATE</Text>
              <Text style={[styles.cellValue, { color: sevColor(selected.severity) }]}>
                {fmtDate(selected.timestamp)}
              </Text>
            </View>
            <View style={styles.cell}>
              <Text style={styles.cellLabel}>LOCATION</Text>
              <Text style={[styles.cellValue, { color: sevColor(selected.severity) }]} numberOfLines={2}>
                {selected.location ?? 'UNKNOWN'}
              </Text>
            </View>
            {selected.fatalities != null && selected.fatalities > 0 && (
              <View style={styles.cell}>
                <Text style={styles.cellLabel}>CASUALTIES</Text>
                <Text style={[styles.cellValue, { color: sevColor(selected.severity) }]}>
                  {selected.fatalities.toLocaleString()}+ killed
                </Text>
              </View>
            )}
            {selected.magnitude != null && (
              <View style={styles.cell}>
                <Text style={styles.cellLabel}>MAGNITUDE</Text>
                <Text style={[styles.cellValue, { color: sevColor(selected.severity) }]}>
                  M{selected.magnitude.toFixed(1)}
                </Text>
              </View>
            )}
            <View style={styles.cell}>
              <Text style={styles.cellLabel}>SOURCE</Text>
              <Text style={[styles.cellValue, { color: '#8B95A5' }]}>
                {selected.source.toUpperCase()}
              </Text>
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

const MONO = Platform.OS === 'ios' ? 'Courier New' : 'monospace';

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0a0e1a' },
  map:  { flex: 1, backgroundColor: '#0a0e1a' },
  panel: {
    position: 'absolute', bottom: 100, left: 14, right: 14,
    backgroundColor: 'rgba(6,8,16,0.97)',
    borderWidth: 1, borderRadius: 10, padding: 16,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7, shadowRadius: 20, elevation: 20,
  },
  closeBtn: {
    position: 'absolute', top: 10, right: 10, zIndex: 1,
    backgroundColor: 'rgba(255,45,45,0.12)',
    borderWidth: 1, borderColor: 'rgba(255,45,45,0.4)',
    borderRadius: 4, paddingHorizontal: 9, paddingVertical: 3,
  },
  closeTxt: { color: '#FF2D2D', fontSize: 11, fontFamily: MONO },
  tagRow:   { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  tagDot:   { width: 6, height: 6, borderRadius: 3 },
  tagTxt:   { color: '#FF2D2D', fontSize: 9, fontWeight: '700', letterSpacing: 2, fontFamily: MONO },
  badge:    { borderWidth: 1, borderRadius: 3, paddingHorizontal: 6, paddingVertical: 1 },
  badgeTxt: { fontSize: 8, fontWeight: '800', letterSpacing: 1, fontFamily: MONO },
  title:    {
    fontSize: 16, fontWeight: '800', color: '#FFF',
    marginBottom: 12, lineHeight: 22, paddingRight: 32, fontFamily: MONO
  },
  grid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 10 },
  cell:     { width: '47%' },
  cellLabel:{ fontSize: 8, letterSpacing: 1.5, color: '#444', textTransform: 'uppercase', marginBottom: 2, fontFamily: MONO },
  cellValue:{ fontSize: 12, fontWeight: '700', fontFamily: MONO },
  descWrap: { borderTopWidth: 1, borderTopColor: '#111827', paddingTop: 10 },
  descTxt:  { fontSize: 11, color: '#888', lineHeight: 18, fontFamily: MONO },
});