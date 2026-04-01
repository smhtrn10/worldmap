export type EventCategory = 'earthquake' | 'wildfire' | 'flood' | 'volcano' | 'storm' | 'news' | 'conflict' | 'unrest' | 'other';

export type EventSeverity = 'critical' | 'high' | 'medium' | 'low';

export interface MapCoordinates {
  latitude: number;
  longitude: number;
}

export type EventSource = 'usgs' | 'eonet' | 'bbc' | 'gdelt' | 'acled' | 'gdacs';

export interface WorldEvent {
  id: string;
  title: string;
  description?: string;
  category: EventCategory;
  severity: EventSeverity;
  coordinates: MapCoordinates | null;
  timestamp: Date;
  source: EventSource;
  sourceUrl?: string;
  magnitude?: number;
  location?: string;
  fatalities?: number;
}

export interface EarthquakeFeature {
  type: string;
  properties: {
    mag: number;
    place: string;
    time: number;
    updated: number;
    tz: number | null;
    url: string;
    detail: string;
    felt: number | null;
    cdi: number | null;
    mmi: number | null;
    alert: string | null;
    status: string;
    tsunami: number;
    sig: number;
    net: string;
    code: string;
    ids: string;
    sources: string;
    types: string;
    nst: number | null;
    dmin: number | null;
    rms: number;
    gap: number | null;
    magType: string;
    type: string;
  };
  geometry: {
    type: string;
    coordinates: [number, number, number];
  };
  id: string;
}

export interface USGSResponse {
  type: string;
  metadata: {
    generated: number;
    url: string;
    title: string;
    api: string;
    count: number;
    status: number;
  };
  features: EarthquakeFeature[];
}

export interface EONETEvent {
  id: string;
  title: string;
  description: string | null;
  link: string;
  categories: Array<{
    id: string;
    title: string;
  }>;
  sources: Array<{
    id: string;
    url: string;
  }>;
  geometry: Array<{
    magnitudeValue: number | null;
    magnitudeUnit: string | null;
    date: string;
    type: string;
    coordinates: number[] | number[][] | number[][][];
  }>;
}

export interface EONETResponse {
  title: string;
  description: string;
  link: string;
  events: EONETEvent[];
}

export interface BBCNewsItem {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  guid: string;
}

export interface FilterSettings {
  showEarthquakes: boolean;
  showWildfires: boolean;
  showFloods: boolean;
  showVolcanoes: boolean;
  showStorms: boolean;
  showNews: boolean;
  showConflicts: boolean;
  showUnrest: boolean;
  minMagnitude: number;
}
