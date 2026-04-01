/**
 * Conflict Intelligence Service
 * Source: newsworker.semihtrn4.workers.dev (Cloudflare Worker)
 * - First fetch: GET /news (last 24h)
 * - Subsequent: GET /news?since=<timestamp> (only new items)
 * - PRO feature: isPro must be true
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { WorldEvent, EventSeverity } from '@/types/events';

const BASE_URL = 'https://newsworker.semihtrn4.workers.dev/news';
const LAST_FETCH_KEY  = '@conflict_last_fetch';
const CACHED_EVENTS_KEY = '@conflict_cached_events';
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

// IS_PRO hardcoded flag removed - now dynamic

interface ConflictItem {
  id:          string;
  source:      string;
  title:       string;
  description: string;
  link:        string;
  pub_date:    number; // unix timestamp
}

interface ConflictResponse {
  items: ConflictItem[];
}

// ── Country geo lookup (başlıktan koordinat tespiti) ─────────────────────────
const COUNTRY_GEO: Record<string, { lat: number; lng: number }> = {
  'ukraine':       { lat: 49.0, lng: 32.0 },
  'russia':        { lat: 61.5, lng: 90.0 },
  'israel':        { lat: 31.5, lng: 34.8 },
  'gaza':          { lat: 31.4, lng: 34.3 },
  'palestine':     { lat: 31.9, lng: 35.2 },
  'iran':          { lat: 32.4, lng: 53.7 },
  'china':         { lat: 35.9, lng: 104.2 },
  'taiwan':        { lat: 23.7, lng: 121.0 },
  'north korea':   { lat: 40.3, lng: 127.5 },
  'usa':           { lat: 37.1, lng: -95.7 },
  'united states': { lat: 37.1, lng: -95.7 },
  'uk':            { lat: 55.4, lng: -3.4 },
  'britain':       { lat: 55.4, lng: -3.4 },
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
  'ethiopia':      { lat: 9.1, lng: 40.5 },
  'somalia':       { lat: 5.2, lng: 46.2 },
  'nigeria':       { lat: 9.1, lng: 8.7 },
  'congo':         { lat: -4.0, lng: 21.8 },
  'myanmar':       { lat: 17.1, lng: 96.9 },
  'lebanon':       { lat: 33.9, lng: 35.5 },
  'jordan':        { lat: 30.6, lng: 36.2 },
  'egypt':         { lat: 26.8, lng: 30.8 },
  'libya':         { lat: 26.3, lng: 17.2 },
  'mali':          { lat: 17.6, lng: -4.0 },
  'niger':         { lat: 17.6, lng: 8.1 },
  'chad':          { lat: 15.5, lng: 18.7 },
  'haiti':         { lat: 18.9, lng: -72.3 },
  'venezuela':     { lat: 6.4, lng: -66.6 },
  'colombia':      { lat: 4.6, lng: -74.3 },
  'mexico':        { lat: 23.6, lng: -102.6 },
  'serbia':        { lat: 44.0, lng: 21.0 },
  'kosovo':        { lat: 42.6, lng: 20.9 },
  'georgia':       { lat: 42.3, lng: 43.4 },
  'armenia':       { lat: 40.1, lng: 45.0 },
  'azerbaijan':    { lat: 40.1, lng: 47.6 },
  'belarus':       { lat: 53.7, lng: 28.0 },
  'indonesia':     { lat: -0.8, lng: 113.9 },
  'philippines':   { lat: 12.9, lng: 121.8 },
  'bangladesh':    { lat: 23.7, lng: 90.4 },
  'kenya':         { lat: -0.0, lng: 37.9 },
  'mozambique':    { lat: -18.7, lng: 35.5 },
  'senegal':       { lat: 14.5, lng: -14.5 },
  'morocco':       { lat: 31.8, lng: -7.1 },
  'algeria':       { lat: 28.0, lng: 1.7 },
  'tunisia':       { lat: 33.9, lng: 9.5 },
  'qatar':         { lat: 25.4, lng: 51.2 },
  'kuwait':        { lat: 29.3, lng: 47.5 },
  'uae':           { lat: 23.4, lng: 53.8 },
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
  'tehran':        { lat: 35.7, lng: 51.4 },
  'riyadh':        { lat: 24.7, lng: 46.7 },
  'islamabad':     { lat: 33.7, lng: 73.1 },
  'delhi':         { lat: 28.6, lng: 77.2 },
  'karachi':       { lat: 24.9, lng: 67.0 },
  'nairobi':       { lat: -1.3, lng: 36.8 },
  'khartoum':      { lat: 15.6, lng: 32.5 },
  'tripoli':       { lat: 32.9, lng: 13.2 },
  'ankara':        { lat: 39.9, lng: 32.9 },
  'pyongyang':     { lat: 39.0, lng: 125.8 },
  'jakarta':       { lat: -6.2, lng: 106.8 },
  'manila':        { lat: 14.6, lng: 121.0 },
  'bangkok':       { lat: 13.8, lng: 100.5 },
  'dhaka':         { lat: 23.8, lng: 90.4 },
  'addis ababa':   { lat: 9.0, lng: 38.7 },
  'kinshasa':      { lat: -4.3, lng: 15.3 },
  'lagos':         { lat: 6.5, lng: 3.4 },
  'bogota':        { lat: 4.7, lng: -74.1 },
  'caracas':       { lat: 10.5, lng: -66.9 },
  'havana':        { lat: 23.1, lng: -82.4 },
  'port-au-prince':{ lat: 18.5, lng: -72.3 },
};

function getCoords(text: string): { latitude: number; longitude: number } | null {
  const lower = text.toLowerCase();
  for (const [name, coords] of Object.entries(COUNTRY_GEO)) {
    if (lower.includes(name)) {
      return {
        latitude:  coords.lat + (Math.random() - 0.5) * 1.5,
        longitude: coords.lng + (Math.random() - 0.5) * 1.5,
      };
    }
  }
  return null;
}

function getSeverity(title: string): EventSeverity {
  const t = title.toLowerCase();
  if (t.includes('killed') || t.includes('dead') || t.includes('airstrike') ||
      t.includes('massacre') || t.includes('bombing') || t.includes('nuclear')) return 'critical';
  if (t.includes('attack') || t.includes('missile') || t.includes('explosion') ||
      t.includes('battle') || t.includes('offensive') || t.includes('war')) return 'high';
  return 'medium';
}

function cleanHtml(html: string): string {
  return html.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"').replace(/<[^>]*>/g, '').trim();
}

function mapToWorldEvent(item: ConflictItem): WorldEvent | null {
  const text = item.title + ' ' + cleanHtml(item.description);
  const coords = getCoords(text);
  return {
    id:          `conflict-${item.id.split('/').pop()}`,
    title:       item.title,
    description: cleanHtml(item.description).slice(0, 300),
    category:    'conflict',
    severity:    getSeverity(item.title),
    coordinates: coords,
    timestamp:   new Date(item.pub_date * 1000),
    source:      'gdelt', // conflict source type
    sourceUrl:   item.link,
    location:    item.source,
  };
}

// ── Main fetch ────────────────────────────────────────────────────────────────
export async function fetchConflictIntel(isPro: boolean = false): Promise<WorldEvent[]> {
  if (!isPro) return [];

  try {
    const lastFetchStr = await AsyncStorage.getItem(LAST_FETCH_KEY);
    const lastFetch = lastFetchStr ? parseInt(lastFetchStr, 10) : null;

    const url = lastFetch ? `${BASE_URL}?since=${lastFetch}` : BASE_URL;

    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(tid);

    // Load cached events from storage
    const cachedStr = await AsyncStorage.getItem(CACHED_EVENTS_KEY);
    const cachedRaw: any[] = cachedStr ? JSON.parse(cachedStr) : [];
    console.log('[Conflict] cache loaded:', cachedRaw.length);
    // Restore Date objects
    const cachedEvents: WorldEvent[] = cachedRaw.map(e => ({
      ...e,
      timestamp: new Date(e.timestamp),
    }));

    // Filter out events older than 36 hours
    const cutoff = Date.now() - ONE_DAY_MS * 1.5;
    const freshCache = cachedEvents.filter(e => e.timestamp.getTime() > cutoff);
    console.log('[Conflict] fresh cache after cutoff:', freshCache.length);

    if (!res.ok) {
      console.warn('[Conflict] HTTP', res.status, '- returning cache:', freshCache.length);
      return freshCache;
    }

    const data: ConflictResponse = await res.json();

    // If no new items, return cache
    if (!data?.items?.length) {
      console.log('[Conflict] no new items, returning cache:', freshCache.length);
      return freshCache;
    }

    // Map new items to WorldEvent — skip items with no resolvable coordinates
    const newEvents = data.items
      .map(mapToWorldEvent)
      .filter((e): e is WorldEvent => e !== null && e.coordinates !== null);

    // Merge: new events + cache, deduplicate by id
    const merged = [...newEvents, ...freshCache];
    const seen = new Set<string>();
    const unique = merged.filter(e => {
      if (seen.has(e.id)) return false;
      seen.add(e.id);
      return true;
    });

    // Save merged events and new timestamp
    const maxPubDate = Math.max(...data.items.map(i => i.pub_date));
    await AsyncStorage.setItem(LAST_FETCH_KEY, String(maxPubDate));
    await AsyncStorage.setItem(CACHED_EVENTS_KEY, JSON.stringify(unique));

    console.log('[Conflict] new:', newEvents.length, 'total:', unique.length);
    return unique;
  } catch (err) {
    console.warn('[Conflict] fetch error:', err);
    // On error, try to return cache
    try {
      const cachedStr = await AsyncStorage.getItem(CACHED_EVENTS_KEY);
      if (cachedStr) {
        const cached = JSON.parse(cachedStr).map((e: any) => ({ ...e, timestamp: new Date(e.timestamp) }));
        return cached;
      }
    } catch {}
    return [];
  }
}
