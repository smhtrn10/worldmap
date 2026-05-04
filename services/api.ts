import { Platform } from 'react-native';
import { XMLParser } from 'fast-xml-parser';
import type {
  USGSResponse,
  EarthquakeFeature,
  EONETResponse,
  WorldEvent,
  EventCategory,
  EventSeverity,
} from '@/types/events';
// ACLED removed - paid service
import { fetchConflictIntel } from '@/services/conflict';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const IS_WEB = Platform.OS === 'web';

// ── Simple hash (no Buffer dependency) ───────────────────────────────────────
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const chr = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

// ── GDACS types ───────────────────────────────────────────────────────────────
interface GDACSFeature {
  type: 'Feature';
  geometry: { type: 'Point'; coordinates: string } | null;
  properties: {
    eventtype: string;
    eventid: number;
    episodeid: number;
    name: string;
    description: string;
    alertlevel: string;
    country: string;
    fromdate: string;
    todate: string;
    severitydata: { severity: number; severitytext: string; severityunit: string };
    url: { report: string };
  };
}

interface GDACSResponse {
  type: 'FeatureCollection';
  features: GDACSFeature[];
}

// FIX: normalize + trim + uppercase ile kesin eşleşme, bilinmeyen kod loglanıyor
function gdacsEventType(code: string): { category: EventCategory; severity: EventSeverity } {
  const c = (code ?? '').toUpperCase().trim();
  switch (c) {
    case 'EQ': return { category: 'earthquake', severity: 'high' };
    case 'TC': return { category: 'storm',      severity: 'high' };
    case 'FL': return { category: 'flood',      severity: 'high' };
    case 'VO': return { category: 'volcano',    severity: 'critical' };
    case 'WF': return { category: 'wildfire',   severity: 'medium' };
    case 'DR': return { category: 'flood',      severity: 'medium' };
    default:
      console.warn(`[GDACS] unknown eventtype: "${code}"`);
      return { category: 'wildfire', severity: 'low' };
  }
}

function gdacsAlertSeverity(alert: string): EventSeverity {
  const a = (alert ?? '').toLowerCase();
  if (a === 'red')    return 'critical';
  if (a === 'orange') return 'high';
  return 'medium';
}

export async function fetchGDACSEvents(): Promise<WorldEvent[]> {
  try {
    const url = 'https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH?eventlist=EQ,TC,FL,VO,WF&alertlevel=Green,Orange,Red&limit=100';
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 12000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(tid);
    if (!res.ok) throw new Error(`GDACS error: ${res.status}`);
    const data: GDACSResponse = await res.json();
    if (!data?.features) return [];

    const mapped = data.features
      .filter(f => f.geometry?.coordinates)
      .map((f): WorldEvent | null => {
        const raw = f.geometry!.coordinates as unknown;
        let lon = 0, lat = 0;

        if (typeof raw === 'string') {
          const parts = raw.trim().split(/\s+/).map(Number);
          if (parts.length < 2 || parts.some(isNaN)) return null;
          lon = parts[0]; lat = parts[1];
        } else if (Array.isArray(raw) && raw.length >= 2) {
          lon = Number(raw[0]); lat = Number(raw[1]);
        } else {
          return null;
        }

        if (isNaN(lat) || isNaN(lon)) return null;

        const { category, severity: baseSeverity } = gdacsEventType(f.properties.eventtype);
        const severity = gdacsAlertSeverity(f.properties.alertlevel) ?? baseSeverity;

        return {
          id:          `gdacs-${f.properties.eventid}-${f.properties.episodeid}`,
          title:       f.properties.name || f.properties.description,
          description: `${f.properties.severitydata?.severitytext ?? ''} | Alert: ${f.properties.alertlevel}`,
          category,
          severity,
          coordinates: { latitude: lat, longitude: lon },
          timestamp:   new Date(f.properties.fromdate),
          source:      'gdacs' as any,
          sourceUrl:   f.properties.url?.report,
          location:    f.properties.country,
        };
      })
      .filter((e): e is WorldEvent => e !== null);

    const cats: Record<string, number> = {};
    mapped.forEach(e => { cats[e.category] = (cats[e.category] || 0) + 1; });
    console.log('[GDACS] categories:', cats);

    return mapped;
  } catch (err) {
    console.warn('[GDACS] fetch error:', err);
    return [];
  }
}

// ── GDELT types ───────────────────────────────────────────────────────────────
interface GDELTFeature {
  type: 'Feature';
  geometry: { type: 'Point'; coordinates: [number, number] } | null;
  properties: {
    name: string;
    url: string;
    urlmobile?: string;
    shareimage?: string;
    seendate: string;
    socialimage?: string;
    domain: string;
    language: string;
    sourcecountry: string;
  };
}

interface GDELTGeoResponse {
  type: 'FeatureCollection';
  features: GDELTFeature[];
}

function isRecentEvent(timestamp: Date): boolean {
  return Date.now() - timestamp.getTime() < ONE_DAY_MS;
}

function getConflictSeverity(title: string): EventSeverity {
  const t = title.toLowerCase();
  if (t.includes('killed') || t.includes('dead') || t.includes('massacre') ||
      t.includes('airstrike') || t.includes('bombing') || t.includes('nuclear')) return 'critical';
  if (t.includes('attack') || t.includes('missile') || t.includes('explosion') ||
      t.includes('war') || t.includes('battle') || t.includes('offensive')) return 'high';
  if (t.includes('conflict') || t.includes('clash') || t.includes('troops') ||
      t.includes('military') || t.includes('forces')) return 'medium';
  return 'low';
}

function parseGDELTDate(seendate: string): Date {
  try {
    const s = seendate.replace('T', '').replace('Z', '');
    const year  = s.slice(0, 4);
    const month = s.slice(4, 6);
    const day   = s.slice(6, 8);
    const hour  = s.slice(8, 10);
    const min   = s.slice(10, 12);
    return new Date(`${year}-${month}-${day}T${hour}:${min}:00Z`);
  } catch {
    return new Date();
  }
}

// ── USGS Earthquakes ──────────────────────────────────────────────────────────
function getEarthquakeSeverity(magnitude: number): EventSeverity {
  if (magnitude >= 7) return 'critical';
  if (magnitude >= 6) return 'high';
  if (magnitude >= 4.5) return 'medium';
  return 'low';
}

function getEarthquakeCategory(_magnitude: number): EventCategory {
  return 'earthquake';
}

export async function fetchEarthquakes(): Promise<WorldEvent[]> {
  try {
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 10000);
    const response = await fetch(
      'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson',
      { signal: controller.signal }
    );
    clearTimeout(tid);
    if (!response.ok) throw new Error(`USGS API error: ${response.status}`);
    const data: USGSResponse = await response.json();
    return data.features.map((feature: EarthquakeFeature) => ({
      id:          `usgs-${feature.id}`,
      title:       `M${feature.properties.mag.toFixed(1)} - ${feature.properties.place}`,
      description: `Magnitude ${feature.properties.mag} earthquake at ${feature.properties.place}`,
      category:    getEarthquakeCategory(feature.properties.mag),
      severity:    getEarthquakeSeverity(feature.properties.mag),
      coordinates: {
        latitude:  feature.geometry.coordinates[1],
        longitude: feature.geometry.coordinates[0],
      },
      timestamp: new Date(feature.properties.time),
      source:    'usgs' as const,
      sourceUrl: feature.properties.url,
      magnitude: feature.properties.mag,
      location:  feature.properties.place,
    }));
  } catch (error) {
    console.warn('[USGS] fetch failed, skipping:', error);
    return [];
  }
}

// ── NASA EONET ────────────────────────────────────────────────────────────────
function mapEONETCategory(categoryTitle: string): { category: EventCategory; severity: EventSeverity } {
  const t = categoryTitle.toLowerCase().trim();

  if (t.includes('wildfire') || t.includes('fire')) {
    return { category: 'wildfire', severity: 'high' };
  }
  if (t.includes('flood') || t.includes('drought') || t.includes('standing water')) {
    return { category: 'flood', severity: 'high' };
  }
  if (t.includes('volcano') || t.includes('volcanic') || t.includes('volcan')) {
    return { category: 'volcano', severity: 'critical' };
  }
  if (t.includes('storm') || t.includes('cyclone') || t.includes('hurricane') ||
      t.includes('typhoon') || t.includes('severe') || t.includes('tornado') ||
      t.includes('wind') || t.includes('tropical')) {
    return { category: 'storm', severity: 'high' };
  }
  if (t.includes('earthquake') || t.includes('seismic') ||
      t.includes('landslide') || t.includes('avalanche')) {
    return { category: 'earthquake', severity: 'high' };
  }
  if (t.includes('ice') || t.includes('snow') || t.includes('blizzard') || t.includes('freeze')) {
    return { category: 'storm', severity: 'medium' };
  }
  if (t.includes('dust') || t.includes('haze') || t.includes('air')) {
    return { category: 'wildfire', severity: 'low' };
  }

  console.warn(`[EONET] unmapped category: "${categoryTitle}"`);
  return { category: 'flood', severity: 'medium' };
}

export async function fetchNaturalDisasters(): Promise<WorldEvent[]> {
  try {
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 10000);
    const response = await fetch(
      'https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=50',
      { signal: controller.signal }
    );
    clearTimeout(tid);

    if (!response.ok) {
      console.warn(`[EONET] API error: ${response.status} - skipping`);
      return [];
    }

    const data: EONETResponse = await response.json();
    const events: WorldEvent[] = [];

    for (const event of data.events) {
      if (!event.geometry || event.geometry.length === 0) continue;
      const geo      = event.geometry[0];
      const category = event.categories[0];
      if (!category) continue;

      const { category: eventCategory, severity } = mapEONETCategory(category.title);

      let coordinates: { latitude: number; longitude: number } | null = null;
      if (geo.type === 'Point' && Array.isArray(geo.coordinates)) {
        coordinates = {
          longitude: geo.coordinates[0] as number,
          latitude:  geo.coordinates[1] as number,
        };
      }

      events.push({
        id:          `eonet-${event.id}`,
        title:       event.title,
        description: event.description || `${category.title} event`,
        category:    eventCategory,
        severity,
        coordinates,
        timestamp:   new Date(geo.date),
        source:      'eonet' as const,
        sourceUrl:   event.link,
        location:    event.title,
      });
    }

    const cats: Record<string, number> = {};
    events.forEach(e => { cats[e.category] = (cats[e.category] || 0) + 1; });
    console.log('[EONET] categories:', cats);

    return events;
  } catch (error) {
    console.warn('[EONET] fetch failed, skipping:', error);
    return [];
  }
}

// ── BBC News ──────────────────────────────────────────────────────────────────
export async function fetchBBCNews(): Promise<WorldEvent[]> {
  const rssUrl = 'https://feeds.bbci.co.uk/news/world/rss.xml';

  try {
    if (IS_WEB) {
      const proxies = [
        `https://api.allorigins.win/get?url=${encodeURIComponent(rssUrl)}`,
        `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(rssUrl)}`,
      ];
      for (const proxyUrl of proxies) {
        try {
          const controller = new AbortController();
          const tid = setTimeout(() => controller.abort(), 6000);
          const res = await fetch(proxyUrl, { signal: controller.signal });
          clearTimeout(tid);
          if (!res.ok) continue;
          const json = await res.json();
          const xmlText = json.contents ?? json;
          if (typeof xmlText !== 'string') continue;
          const items = parseBBCXML(xmlText);
          if (items.length === 0) continue;
          return items;
        } catch {
          continue;
        }
      }
      return [];
    }

    // Native (iOS / Android) — direkt fetch
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 8000);
    const response = await fetch(rssUrl, { signal: controller.signal });
    clearTimeout(tid);

    if (!response.ok) throw new Error(`BBC RSS error: ${response.status}`);
    const xmlText = await response.text();
    return parseBBCXML(xmlText);
  } catch (error) {
    console.warn('[BBC] fetch error:', error);
    return [];
  }
}

// ── Al Jazeera News (Reuters yerine) ─────────────────────────────────────────
export async function fetchAlJazeeraNews(): Promise<WorldEvent[]> {
  const rssUrl = 'https://www.aljazeera.com/xml/rss/all.xml';

  try {
    if (IS_WEB) {
      const proxies = [
        `https://api.allorigins.win/get?url=${encodeURIComponent(rssUrl)}`,
        `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(rssUrl)}`,
      ];
      for (const proxyUrl of proxies) {
        try {
          const controller = new AbortController();
          const tid = setTimeout(() => controller.abort(), 6000);
          const res = await fetch(proxyUrl, { signal: controller.signal });
          clearTimeout(tid);
          if (!res.ok) continue;
          const json = await res.json();
          const xmlText = json.contents ?? json;
          if (typeof xmlText !== 'string') continue;
          const items = parseAlJazeeraXML(xmlText);
          if (items.length === 0) continue;
          return items;
        } catch {
          continue;
        }
      }
      return [];
    }

    // Native (iOS / Android) — direkt fetch
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 8000);
    const response = await fetch(rssUrl, { signal: controller.signal });
    clearTimeout(tid);

    if (!response.ok) throw new Error(`Al Jazeera RSS error: ${response.status}`);
    const xmlText = await response.text();
    return parseAlJazeeraXML(xmlText);
  } catch (error) {
    console.warn('[AlJazeera] fetch error:', error);
    return [];
  }
}

// ── Country geo lookup ────────────────────────────────────────────────────────
const COUNTRY_GEO: Record<string, { lat: number; lng: number }> = {
  'ukraine':       { lat: 49.0, lng: 32.0 },
  'russia':        { lat: 61.5, lng: 90.0 },
  'israel':        { lat: 31.5, lng: 34.8 },
  'gaza':          { lat: 31.4, lng: 34.3 },
  'iran':          { lat: 32.4, lng: 53.7 },
  'china':         { lat: 35.9, lng: 104.2 },
  'taiwan':        { lat: 23.7, lng: 121.0 },
  'north korea':   { lat: 40.3, lng: 127.5 },
  'south korea':   { lat: 35.9, lng: 127.8 },
  'usa':           { lat: 37.1, lng: -95.7 },
  'united states': { lat: 37.1, lng: -95.7 },
  'america':       { lat: 37.1, lng: -95.7 },
  'uk':            { lat: 55.4, lng: -3.4 },
  'britain':       { lat: 55.4, lng: -3.4 },
  'england':       { lat: 52.4, lng: -1.2 },
  'france':        { lat: 46.2, lng: 2.2 },
  'germany':       { lat: 51.2, lng: 10.5 },
  'india':         { lat: 20.6, lng: 79.1 },
  'pakistan':      { lat: 30.4, lng: 69.3 },
  'afghanistan':   { lat: 33.9, lng: 67.7 },
  'iraq':          { lat: 33.2, lng: 43.7 },
  'syria':         { lat: 34.8, lng: 38.9 },
  'turkey':        { lat: 38.9, lng: 35.2 },
  'saudi':         { lat: 23.9, lng: 45.1 },
  'yemen':         { lat: 15.6, lng: 48.5 },
  'sudan':         { lat: 12.9, lng: 30.2 },
  'ethiopia':      { lat: 9.1,  lng: 40.5 },
  'somalia':       { lat: 5.2,  lng: 46.2 },
  'nigeria':       { lat: 9.1,  lng: 8.7 },
  'congo':         { lat: -4.0, lng: 21.8 },
  'myanmar':       { lat: 17.1, lng: 96.9 },
  'brazil':        { lat: -14.2, lng: -51.9 },
  'mexico':        { lat: 23.6, lng: -102.6 },
  'venezuela':     { lat: 6.4,  lng: -66.6 },
  'colombia':      { lat: 4.6,  lng: -74.3 },
  'japan':         { lat: 36.2, lng: 138.3 },
  'australia':     { lat: -25.3, lng: 133.8 },
  'canada':        { lat: 56.1, lng: -106.3 },
  'egypt':         { lat: 26.8, lng: 30.8 },
  'libya':         { lat: 26.3, lng: 17.2 },
  'lebanon':       { lat: 33.9, lng: 35.5 },
  'jordan':        { lat: 30.6, lng: 36.2 },
  'haiti':         { lat: 18.9, lng: -72.3 },
  'cuba':          { lat: 21.5, lng: -79.5 },
  'serbia':        { lat: 44.0, lng: 21.0 },
  'kosovo':        { lat: 42.6, lng: 20.9 },
  'georgia':       { lat: 42.3, lng: 43.4 },
  'armenia':       { lat: 40.1, lng: 45.0 },
  'azerbaijan':    { lat: 40.1, lng: 47.6 },
  'belarus':       { lat: 53.7, lng: 28.0 },
  'poland':        { lat: 51.9, lng: 19.1 },
  'hungary':       { lat: 47.2, lng: 19.5 },
  'spain':         { lat: 40.5, lng: -3.7 },
  'italy':         { lat: 41.9, lng: 12.6 },
  'greece':        { lat: 39.1, lng: 21.8 },
  'indonesia':     { lat: -0.8, lng: 113.9 },
  'philippines':   { lat: 12.9, lng: 121.8 },
  'thailand':      { lat: 15.9, lng: 100.9 },
  'vietnam':       { lat: 14.1, lng: 108.3 },
  'bangladesh':    { lat: 23.7, lng: 90.4 },
  'nepal':         { lat: 28.4, lng: 84.1 },
  'kenya':         { lat: -0.0, lng: 37.9 },
  'south africa':  { lat: -30.6, lng: 22.9 },
  'mali':          { lat: 17.6, lng: -4.0 },
  'burkina':       { lat: 12.4, lng: -1.6 },
  'niger':         { lat: 17.6, lng: 8.1 },
  'chad':          { lat: 15.5, lng: 18.7 },
  'mozambique':    { lat: -18.7, lng: 35.5 },
  'zimbabwe':      { lat: -19.0, lng: 29.2 },
  'senegal':       { lat: 14.5, lng: -14.5 },
  'morocco':       { lat: 31.8, lng: -7.1 },
  'algeria':       { lat: 28.0, lng: 1.7 },
  'tunisia':       { lat: 33.9, lng: 9.5 },
  'peru':          { lat: -9.2, lng: -75.0 },
  'argentina':     { lat: -38.4, lng: -63.6 },
  'chile':         { lat: -35.7, lng: -71.5 },
  'ecuador':       { lat: -1.8, lng: -78.2 },
  'bolivia':       { lat: -16.3, lng: -63.6 },
  'paraguay':      { lat: -23.4, lng: -58.4 },
  'uruguay':       { lat: -32.5, lng: -55.8 },
  'panama':        { lat: 8.5,  lng: -80.8 },
  'costa rica':    { lat: 9.7,  lng: -83.8 },
  'guatemala':     { lat: 15.8, lng: -90.2 },
  'honduras':      { lat: 15.2, lng: -86.2 },
  'el salvador':   { lat: 13.8, lng: -88.9 },
  'nicaragua':     { lat: 12.9, lng: -85.2 },
  'new zealand':   { lat: -40.9, lng: 174.9 },
  'sweden':        { lat: 60.1, lng: 18.6 },
  'norway':        { lat: 60.5, lng: 8.5 },
  'denmark':       { lat: 56.3, lng: 9.5 },
  'finland':       { lat: 61.9, lng: 25.7 },
  'netherlands':   { lat: 52.1, lng: 5.3 },
  'belgium':       { lat: 50.5, lng: 4.5 },
  'switzerland':   { lat: 46.8, lng: 8.2 },
  'austria':       { lat: 47.5, lng: 14.6 },
  'portugal':      { lat: 39.4, lng: -8.2 },
  'czech':         { lat: 49.8, lng: 15.5 },
  'romania':       { lat: 45.9, lng: 24.9 },
  'bulgaria':      { lat: 42.7, lng: 25.5 },
  'croatia':       { lat: 45.1, lng: 15.2 },
  'moldova':       { lat: 47.4, lng: 28.4 },
  'kazakhstan':    { lat: 48.0, lng: 66.9 },
  'uzbekistan':    { lat: 41.4, lng: 64.6 },
  'malaysia':      { lat: 4.2,  lng: 108.0 },
  'singapore':     { lat: 1.4,  lng: 103.8 },
  'cambodia':      { lat: 12.6, lng: 104.9 },
  'laos':          { lat: 19.9, lng: 102.5 },
  'mongolia':      { lat: 46.9, lng: 103.8 },
  'tibet':         { lat: 31.7, lng: 88.1 },
  'xinjiang':      { lat: 42.0, lng: 86.0 },
  'hong kong':     { lat: 22.3, lng: 114.2 },
  'macau':         { lat: 22.2, lng: 113.5 },
  'sri lanka':     { lat: 7.9,  lng: 80.8 },
  'maldives':      { lat: 3.2,  lng: 73.2 },
  'bhutan':        { lat: 27.5, lng: 90.4 },
  'qatar':         { lat: 25.4, lng: 51.2 },
  'kuwait':        { lat: 29.3, lng: 47.5 },
  'bahrain':       { lat: 26.0, lng: 50.6 },
  'oman':          { lat: 21.5, lng: 55.9 },
  'uae':           { lat: 23.4, lng: 53.8 },
  'emirates':      { lat: 23.4, lng: 53.8 },
  'west bank':     { lat: 31.9, lng: 35.2 },
  'jerusalem':     { lat: 31.8, lng: 35.2 },
  'beirut':        { lat: 33.9, lng: 35.5 },
  'kabul':         { lat: 34.5, lng: 69.2 },
  'baghdad':       { lat: 33.3, lng: 44.4 },
  'damascus':      { lat: 33.5, lng: 36.3 },
  'cairo':         { lat: 30.1, lng: 31.2 },
  'moscow':        { lat: 55.8, lng: 37.6 },
  'kyiv':          { lat: 50.5, lng: 30.5 },
  'beijing':       { lat: 39.9, lng: 116.4 },
  'washington':    { lat: 38.9, lng: -77.0 },
  'london':        { lat: 51.5, lng: -0.1 },
  'paris':         { lat: 48.9, lng: 2.3 },
  'berlin':        { lat: 52.5, lng: 13.4 },
  'rome':          { lat: 41.9, lng: 12.5 },
  'madrid':        { lat: 40.4, lng: -3.7 },
  'ankara':        { lat: 39.9, lng: 32.9 },
  'tehran':        { lat: 35.7, lng: 51.4 },
  'riyadh':        { lat: 24.7, lng: 46.7 },
  'islamabad':     { lat: 33.7, lng: 73.1 },
  'new delhi':     { lat: 28.6, lng: 77.2 },
  'delhi':         { lat: 28.6, lng: 77.2 },
  'mumbai':        { lat: 19.1, lng: 72.9 },
  'karachi':       { lat: 24.9, lng: 67.0 },
  'dhaka':         { lat: 23.8, lng: 90.4 },
  'nairobi':       { lat: -1.3, lng: 36.8 },
  'addis ababa':   { lat: 9.0,  lng: 38.7 },
  'khartoum':      { lat: 15.6, lng: 32.5 },
  'tripoli':       { lat: 32.9, lng: 13.2 },
  'tunis':         { lat: 36.8, lng: 10.2 },
  'algiers':       { lat: 36.7, lng: 3.1 },
  'rabat':         { lat: 34.0, lng: -6.8 },
  'accra':         { lat: 5.6,  lng: -0.2 },
  'lagos':         { lat: 6.5,  lng: 3.4 },
  'kinshasa':      { lat: -4.3, lng: 15.3 },
  'johannesburg':  { lat: -26.2, lng: 28.0 },
  'cape town':     { lat: -33.9, lng: 18.4 },
  'tokyo':         { lat: 35.7, lng: 139.7 },
  'seoul':         { lat: 37.6, lng: 127.0 },
  'pyongyang':     { lat: 39.0, lng: 125.8 },
  'bangkok':       { lat: 13.8, lng: 100.5 },
  'jakarta':       { lat: -6.2, lng: 106.8 },
  'manila':        { lat: 14.6, lng: 121.0 },
  'hanoi':         { lat: 21.0, lng: 105.8 },
  'kuala lumpur':  { lat: 3.1,  lng: 101.7 },
  'sydney':        { lat: -33.9, lng: 151.2 },
  'melbourne':     { lat: -37.8, lng: 145.0 },
  'toronto':       { lat: 43.7, lng: -79.4 },
  'ottawa':        { lat: 45.4, lng: -75.7 },
  'new york':      { lat: 40.7, lng: -74.0 },
  'los angeles':   { lat: 34.1, lng: -118.2 },
  'chicago':       { lat: 41.9, lng: -87.6 },
  'miami':         { lat: 25.8, lng: -80.2 },
  'sao paulo':     { lat: -23.5, lng: -46.6 },
  'buenos aires':  { lat: -34.6, lng: -58.4 },
  'bogota':        { lat: 4.7,  lng: -74.1 },
  'lima':          { lat: -12.0, lng: -77.0 },
  'santiago':      { lat: -33.5, lng: -70.7 },
  'mexico city':   { lat: 19.4, lng: -99.1 },
};

function getNewsCoordinates(title: string, description: string): { latitude: number; longitude: number } | null {
  const text = (title + ' ' + description).toLowerCase();
  for (const [country, coords] of Object.entries(COUNTRY_GEO)) {
    if (text.includes(country)) {
      return {
        latitude:  coords.lat + (Math.random() - 0.5) * 2,
        longitude: coords.lng + (Math.random() - 0.5) * 2,
      };
    }
  }
  return null;
}

function parseBBCXML(xmlText: string): WorldEvent[] {
  try {
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });
    const parsed = parser.parse(xmlText);
    const items: any[] = parsed.rss?.channel?.item || [];
    return items.slice(0, 20).map((item: any, index: number) => {
      const title = item.title || 'Breaking News';
      const description = typeof item.description === 'string'
        ? item.description.replace(/<[^>]*>/g, '')
        : '';
      const coordinates = getNewsCoordinates(title, description);
      return {
        id:          `bbc-${index}-${Date.now()}`,
        title,
        description,
        category:    'news' as EventCategory,
        severity:    'medium' as EventSeverity,
        coordinates,
        timestamp:   new Date(item.pubDate || Date.now()),
        source:      'bbc' as const,
        sourceUrl:   item.link,
        location:    'Global',
      };
    });
  } catch {
    return [];
  }
}

function parseAlJazeeraXML(xmlText: string): WorldEvent[] {
  try {
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });
    const parsed = parser.parse(xmlText);
    const items: any[] = parsed.rss?.channel?.item || [];
    return items.slice(0, 20).map((item: any, index: number) => {
      const title = item.title || 'Breaking News';
      const description = typeof item.description === 'string'
        ? item.description.replace(/<[^>]*>/g, '')
        : '';
      const coordinates = getNewsCoordinates(title, description);
      return {
        id:          `aljazeera-${index}-${Date.now()}`,
        title,
        description,
        category:    'news' as EventCategory,
        severity:    'medium' as EventSeverity,
        coordinates,
        timestamp:   new Date(item.pubDate || Date.now()),
        source:      'aljazeera' as const,
        sourceUrl:   item.link,
        location:    'Global',
      };
    });
  } catch {
    return [];
  }
}

// ── NYT + Sky News RSS (GDELT endpoint öldü - 404) ───────────────────────────
export async function fetchConflictEvents(): Promise<WorldEvent[]> {
  const feeds = [
    'https://rss.nytimes.com/services/xml/rss/nyt/World.xml',
    'https://feeds.skynews.com/feeds/rss/world.xml',
  ];

  const results: WorldEvent[] = [];

  for (const feedUrl of feeds) {
    try {
      const controller = new AbortController();
      const tid = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(feedUrl, { signal: controller.signal });
      clearTimeout(tid);
      if (!res.ok) continue;
      const xmlText = await res.text();
      const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });
      const parsed = parser.parse(xmlText);
      const items: any[] = parsed.rss?.channel?.item || [];
      items.slice(0, 15).forEach((item: any, index: number) => {
        const title = item.title || '';
        const desc = typeof item.description === 'string'
          ? item.description.replace(/<[^>]*>/g, '') : '';
        const coords = getNewsCoordinates(title, desc);
        if (!coords) return;
        const text = (title + ' ' + desc).toLowerCase();
        
        // Better categorization logic - prioritize unrest keywords
        const isUnrest = ['protest','riot','demonstration','unrest','strike','violence','clash','rally','march','uprising','revolt','civil disobedience'].some(k => text.includes(k));
        const isConflict = ['war','conflict','attack','killed','military','troops','missile','airstrike','bomb','battle','fighting','invasion','combat','offensive'].some(k => text.includes(k));
        
        // If both are detected, prioritize unrest for civilian protests/riots
        let category: EventCategory;
        if (isUnrest && !text.includes('war') && !text.includes('military') && !text.includes('airstrike')) {
          category = 'unrest';
        } else if (isConflict) {
          category = 'conflict';
        } else if (isUnrest) {
          category = 'unrest';
        } else {
          return; // Skip if neither
        }
        
        results.push({
          id:          `nyt-${index}-${Date.now()}`,
          title,
          description: desc,
          category,
          severity:    'medium',
          coordinates: coords,
          timestamp:   new Date(item.pubDate || Date.now()),
          source:      'gdelt',
          sourceUrl:   item.link,
          location:    'Global',
        });
      });
    } catch { continue; }
  }

  console.log('[GDELT] total conflict events:', results.length);
  return results;
}

// ── Defense News RSS (PRO only) ──────────────────────────────────────────────
export async function fetchDefenseNews(): Promise<WorldEvent[]> {
  const rssUrl = 'https://www.defensenews.com/arc/outboundfeeds/rss/';

  try {
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(rssUrl, { signal: controller.signal });
    clearTimeout(tid);
    
    if (!res.ok) throw new Error(`Defense News RSS error: ${res.status}`);
    const xmlText = await res.text();
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });
    const parsed = parser.parse(xmlText);
    const items: any[] = parsed.rss?.channel?.item || [];
    
    const results: WorldEvent[] = [];
    
    items.slice(0, 20).forEach((item: any, index: number) => {
      const title = item.title || '';
      const desc = typeof item.description === 'string'
        ? item.description.replace(/<[^>]*>/g, '') : '';
      const coords = getNewsCoordinates(title, desc);
      if (!coords) return;
      
      const text = (title + ' ' + desc).toLowerCase();
      
      // Better categorization for Defense News
      const isUnrest = ['protest','riot','demonstration','unrest','strike','civil','uprising','revolt','rally','march'].some(k => text.includes(k));
      const isConflict = ['war','conflict','attack','killed','military','troops','missile','airstrike','bomb','battle','fighting','invasion','combat','offensive','defense','army','navy','air force'].some(k => text.includes(k));
      
      let category: EventCategory;
      if (isUnrest && !text.includes('military') && !text.includes('war')) {
        category = 'unrest';
      } else if (isConflict || text.includes('defense') || text.includes('military')) {
        category = 'conflict'; // Defense News is primarily military/conflict focused
      } else {
        category = 'conflict'; // Default for Defense News
      }
      
      results.push({
        id:          `defensenews-${index}-${Date.now()}`,
        title,
        description: desc,
        category,
        severity:    'medium',
        coordinates: coords,
        timestamp:   new Date(item.pubDate || Date.now()),
        source:      'gdelt',
        sourceUrl:   item.link,
        location:    'Global',
      });
    });
    
    console.log('[DefenseNews] conflict events:', results.length);
    return results;
  } catch (error) {
    console.warn('[DefenseNews] fetch error:', error);
    return [];
  }
}

function _processGDELT(
  data: GDELTGeoResponse,
  results: WorldEvent[],
  seen: Set<string>
): void {
  if (!data?.features) return;
  for (const feature of data.features) {
    if (!feature.geometry?.coordinates) continue;
    const url = feature.properties.url;
    if (seen.has(url)) continue;
    seen.add(url);
    const title     = feature.properties.name || 'Conflict Event';
    const timestamp = parseGDELTDate(feature.properties.seendate);
    results.push({
      id:          `gdelt-${simpleHash(url)}`,
      title,
      description: `Reported by ${feature.properties.domain}`,
      category:    'conflict',
      severity:    getConflictSeverity(title),
      coordinates: {
        longitude: feature.geometry.coordinates[0],
        latitude:  feature.geometry.coordinates[1],
      },
      timestamp,
      source:    'gdelt',
      sourceUrl: url,
      location:  feature.properties.sourcecountry || 'Unknown',
    });
  }
}

// ── ReliefWeb Conflict Reports ────────────────────────────────────────────────
// Tamamen ücretsiz, kayıt gerektirmez, çatışma/insani kriz odaklı JSON API
interface ReliefWebReport {
  id: number;
  fields: {
    title: string;
    body?: string;
    date: { created: string };
    country?: Array<{ name: string; location?: { lat: number; lon: number } }>;
    source?: Array<{ name: string }>;
    url: string;
    theme?: Array<{ name: string }>;
  };
}

interface ReliefWebResponse {
  data: ReliefWebReport[];
  totalCount: number;
}

function getReliefWebSeverity(title: string, themes: string[]): EventSeverity {
  const t = title.toLowerCase();
  const themeStr = themes.join(' ').toLowerCase();
  if (t.includes('killed') || t.includes('dead') || t.includes('massacre') ||
      t.includes('airstrike') || t.includes('bombing') || themeStr.includes('protection')) return 'critical';
  if (t.includes('attack') || t.includes('offensive') || t.includes('battle') ||
      t.includes('war') || t.includes('clashes') || themeStr.includes('armed')) return 'high';
  if (t.includes('conflict') || t.includes('troops') || t.includes('military') ||
      themeStr.includes('security')) return 'medium';
  return 'low';
}

export async function fetchReliefWebConflicts(): Promise<WorldEvent[]> {
  try {
    const body = JSON.stringify({
      filter: {
        operator: 'AND',
        conditions: [
          {
            field: 'theme.name',
            value: ['Conflict and Violence', 'Protection and Human Rights', 'Security'],
            operator: 'OR',
          },
        ],
      },
      fields: {
        include: ['title', 'body', 'date.created', 'country', 'source', 'url', 'theme'],
      },
      sort: ['date.created:desc'],
      limit: 50,
    });

    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 12000);
    const res = await fetch(
      'https://api.reliefweb.int/v2/reports?appname=worldeventsapp',
      {
        method:  'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Accept': 'application/json',
          'User-Agent': 'WorldPulseEvents/1.0 (Mobile application for humanitarian tracking)'
        },
        body,
        signal: controller.signal,
      }
    );
    clearTimeout(tid);

    if (!res.ok) {
      console.warn(`[ReliefWeb] HTTP ${res.status}`);
      return [];
    }

    const data: ReliefWebResponse = await res.json();
    if (!data?.data) return [];

    const events: WorldEvent[] = [];

    for (const report of data.data) {
      const f = report.fields;
      if (!f?.title) continue;

      const themes = (f.theme ?? []).map((t: any) => t.name);

      // Koordinat: ülke location alanından al, yoksa COUNTRY_GEO lookup
      let coordinates: { latitude: number; longitude: number } | null = null;
      let locationName = 'Unknown';

      if (f.country && f.country.length > 0) {
        const firstCountry = f.country[0];
        locationName = firstCountry.name;

        if (firstCountry.location?.lat && firstCountry.location?.lon) {
          coordinates = {
            latitude:  firstCountry.location.lat,
            longitude: firstCountry.location.lon,
          };
        } else {
          // COUNTRY_GEO lookup ile fallback
          coordinates = getNewsCoordinates(firstCountry.name, f.title);
        }
      }

      // Koordinat hâlâ yoksa başlıktan tahmin et
      if (!coordinates) {
        coordinates = getNewsCoordinates(f.title, f.body ?? '');
      }

      const body_snippet = f.body
        ? f.body.replace(/<[^>]*>/g, '').slice(0, 200)
        : themes.join(', ');

      const isUnrestTheme = themes.some(t => 
        t.toLowerCase().includes('rights') || 
        t.toLowerCase().includes('humanitarian') ||
        t.toLowerCase().includes('protection')
      ) || f.title.toLowerCase().includes('protest') ||
        f.title.toLowerCase().includes('unrest') ||
        f.title.toLowerCase().includes('demonstration') ||
        f.title.toLowerCase().includes('riot') ||
        f.title.toLowerCase().includes('strike') ||
        f.title.toLowerCase().includes('uprising') ||
        f.title.toLowerCase().includes('civil disobedience');

      const isConflictTheme = themes.some(t =>
        t.toLowerCase().includes('conflict') ||
        t.toLowerCase().includes('violence') ||
        t.toLowerCase().includes('security')
      ) || f.title.toLowerCase().includes('war') ||
        f.title.toLowerCase().includes('military') ||
        f.title.toLowerCase().includes('attack') ||
        f.title.toLowerCase().includes('battle') ||
        f.title.toLowerCase().includes('fighting');

      // Prioritize unrest for civilian/rights issues
      let category: EventCategory;
      if (isUnrestTheme && !f.title.toLowerCase().includes('war') && !f.title.toLowerCase().includes('military')) {
        category = 'unrest';
      } else if (isConflictTheme) {
        category = 'conflict';
      } else {
        category = 'conflict'; // Default for ReliefWeb
      }

      events.push({
        id:          `reliefweb-${report.id}`,
        title:       f.title,
        description: body_snippet,
        category:    (isUnrestTheme ? 'unrest' : 'conflict') as EventCategory,
        severity:    getReliefWebSeverity(f.title, themes),
        coordinates,
        timestamp:   new Date(f.date.created),
        source:      'reliefweb' as any,
        sourceUrl:   f.url,
        location:    locationName,
      });
    }

    console.log('[ReliefWeb] conflict reports:', events.length);
    return events;
  } catch (err) {
    console.warn('[ReliefWeb] fetch error:', err);
    return [];
  }
}

// ── Aggregate ────────────────────────────────────────────────────────────────
export async function fetchAllEvents(isPro: boolean = false): Promise<WorldEvent[]> {
  // Base sources for all users
  const baseSources = [
    fetchEarthquakes().catch(e => { console.error('[API] fetchEarthquakes crashed:', e); return []; }),
    fetchNaturalDisasters().catch(e => { console.error('[API] fetchNaturalDisasters crashed:', e); return []; }),
    fetchBBCNews().catch(e => { console.error('[API] fetchBBCNews crashed:', e); return []; }),
    fetchAlJazeeraNews().catch(e => { console.error('[API] fetchAlJazeeraNews crashed:', e); return []; }),
    fetchGDACSEvents().catch(e => { console.error('[API] fetchGDACSEvents crashed:', e); return []; }),
  ];

  // PRO-only sources
  const proSources = isPro ? [
    fetchConflictEvents().catch(e => { console.error('[API] fetchConflictEvents crashed:', e); return []; }),
    fetchReliefWebConflicts().catch(e => { console.error('[API] fetchReliefWebConflicts crashed:', e); return []; }),
    fetchDefenseNews().catch(e => { console.error('[API] fetchDefenseNews crashed:', e); return []; }),
    fetchConflictIntel(isPro).catch(e => { console.error('[API] fetchConflictIntel crashed:', e); return []; }),
  ] : [];

  const allSources = [...baseSources, ...proSources];
  const results = await Promise.allSettled(allSources);

  const events: WorldEvent[] = [];

  // Process base sources (indices 0-4)
  if (results[0].status === 'fulfilled') { console.log('[API] earthquakes:', results[0].value.length); events.push(...results[0].value); }
  else console.error('[API] earthquakes failed:', results[0].reason);
  
  if (results[1].status === 'fulfilled') { console.log('[API] disasters:', results[1].value.length); events.push(...results[1].value); }
  else console.error('[API] disasters failed:', results[1].reason);
  
  if (results[2].status === 'fulfilled') { console.log('[API] bbc-news:', results[2].value.length); events.push(...results[2].value); }
  else console.error('[API] bbc-news failed:', results[2].reason);
  
  if (results[3].status === 'fulfilled') { console.log('[API] aljazeera-news:', results[3].value.length); events.push(...results[3].value); }
  else console.error('[API] aljazeera-news failed:', results[3].reason);
  
  if (results[4].status === 'fulfilled') { console.log('[API] gdacs:', results[4].value.length); events.push(...results[4].value); }
  else console.error('[API] gdacs failed:', results[4].reason);

  // Process PRO sources (indices 5-8) only if isPro
  if (isPro) {
    if (results[5].status === 'fulfilled') { console.log('[API] gdelt:', results[5].value.length); events.push(...results[5].value); }
    else console.error('[API] gdelt failed:', results[5].reason);
    
    if (results[6].status === 'fulfilled') { console.log('[API] reliefweb:', results[6].value.length); events.push(...results[6].value); }
    else console.error('[API] reliefweb failed:', results[6].reason);
    
    if (results[7].status === 'fulfilled') { console.log('[API] defense-news:', results[7].value.length); events.push(...results[7].value); }
    else console.error('[API] defense-news failed:', results[7].reason);
    
    if (results[8].status === 'fulfilled') { console.log('[API] conflict-intel:', results[8].value.length); events.push(...results[8].value); }
    else console.error('[API] conflict-intel failed:', results[8].reason);
  }

  const seen = new Set<string>();
  const unique = events.filter((e) => {
    const key = e.coordinates
      ? `${e.coordinates.latitude.toFixed(2)}_${e.coordinates.longitude.toFixed(2)}_${e.timestamp.toDateString()}`
      : e.id;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return unique.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

export function getRecentEventsCount(events: WorldEvent[]): number {
  return events.filter(event => isRecentEvent(event.timestamp)).length;
}