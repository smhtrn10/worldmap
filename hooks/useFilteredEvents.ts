import { useMemo } from 'react';
import type { WorldEvent, FilterSettings } from '@/types/events';

export function useFilteredEvents(
  events: WorldEvent[],
  filters: FilterSettings,
  isPro: boolean = false,
  includePlaceholders: boolean = false
): WorldEvent[] {
  return useMemo(() => {
    const results = events.filter((event) => {
      // Non-PRO users never see real conflict/unrest
      if (!isPro && (event.category === 'conflict' || event.category === 'unrest')) {
        return false;
      }

      switch (event.category) {
        case 'earthquake':
          if (!filters.showEarthquakes) return false;
          if (event.magnitude && event.magnitude < filters.minMagnitude) return false;
          return true;
        case 'wildfire':  return filters.showWildfires;
        case 'flood':     return filters.showFloods;
        case 'volcano':   return filters.showVolcanoes;
        case 'storm':     return filters.showStorms;
        case 'conflict':  return filters.showConflicts;
        case 'unrest':    return filters.showUnrest;
        case 'news':      return filters.showNews;
        default:          return true;
      }
    });

    if (!isPro && includePlaceholders) {
      const fakes: WorldEvent[] = [];
      const now = Date.now();

      // Sorun 1: toggle kapalı olsa bile FREE kullanıcıya placeholder göster
      // showConflicts/showUnrest kontrolü kaldırıldı — placeholder her zaman eklenir
      for (let i = 1; i <= 50; i++) {
        fakes.push({
          id: `fake-conflict-${i}`,
          title: `━━━━━━ RESTRICTED INTEL #${i} ━━━━━━`,
          description: 'Upgrade to PRO to access conflict intelligence.',
          category: 'conflict',
          severity: (['medium', 'high', 'critical'] as const)[i % 3],
          coordinates: null,
          timestamp: new Date(now - i * 1680000),
          source: 'gdelt' as any,
          location: 'LOCATION HIDDEN',
        });
      }
      for (let i = 1; i <= 50; i++) {
        fakes.push({
          id: `fake-unrest-${i}`,
          title: `━━━━━━ RESTRICTED INTEL #${i} ━━━━━━`,
          description: 'Upgrade to PRO to access unrest intelligence.',
          category: 'unrest',
          severity: (['medium', 'high', 'critical'] as const)[i % 3],
          coordinates: null,
          timestamp: new Date(now - i * 1440000 - 840000),
          source: 'reliefweb' as any,
          location: 'LOCATION HIDDEN',
        });
      }

      // Merge and sort everything by timestamp descending
      return [...results, ...fakes].sort(
        (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
      );
    }

    // PRO users: sort by date descending
    return results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [events, filters, isPro, includePlaceholders]);
}

