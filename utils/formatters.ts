import { formatDistanceToNow } from 'date-fns';
import type { EventCategory, EventSeverity, WorldEvent } from '@/types/events';

export function formatTimeAgo(date: Date): string {
  return formatDistanceToNow(date, { addSuffix: true });
}

export function getCategoryEmoji(category: EventCategory): string {
  switch (category) {
    case 'earthquake': return '⚡';
    case 'wildfire':   return '🔥';
    case 'flood':      return '🌊';
    case 'volcano':    return '🌋';
    case 'storm':      return '⛈️';
    case 'news':       return '📡';
    case 'conflict':   return '💥';
    case 'unrest':     return '✊';
    default:           return '●';
  }
}

export function getCategoryLabel(category: EventCategory): string {
  switch (category) {
    case 'earthquake': return 'Earthquakes';
    case 'wildfire':   return 'Wildfires';
    case 'flood':      return 'Floods';
    case 'volcano':    return 'Volcanoes';
    case 'storm':      return 'Storms';
    case 'news':       return 'News';
    case 'conflict':   return 'Conflicts';
    case 'unrest':     return 'Unrest';
    default:           return category;
  }
}

export function getSeverityLabel(severity: EventSeverity): string {
  switch (severity) {
    case 'critical': return 'Critical';
    case 'high':     return 'High';
    case 'medium':   return 'Medium';
    case 'low':      return 'Low';
    default:         return severity;
  }
}

export function getMarkerColor(category: EventCategory, magnitude?: number): string {
  if (category === 'earthquake' && magnitude) {
    if (magnitude >= 5) return '#EF4444';
    if (magnitude >= 3) return '#F97316';
    return '#EAB308';
  }
  switch (category) {
    case 'earthquake': return '#EF4444';
    case 'wildfire':   return '#F97316';
    case 'flood':      return '#3B82F6';
    case 'volcano':    return '#DC2626';
    case 'storm':      return '#22C55E';
    case 'news':       return '#8B5CF6';
    case 'conflict':   return '#FF2D2D';
    case 'unrest':     return '#A855F7';
    default:           return '#6B7280';
  }
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export function isRecentEvent(timestamp: Date): boolean {
  return Date.now() - timestamp.getTime() < ONE_DAY_MS;
}

export function getRecentEventsCount(events: WorldEvent[]): number {
  return events.filter(event => isRecentEvent(event.timestamp)).length;
}
