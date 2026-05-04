import { Tabs } from "expo-router";
import { Globe, List, Settings } from "lucide-react-native";
import { View, Text, StyleSheet } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Colors } from "@/constants/colors";
import { fetchAllEvents, getRecentEventsCount } from "@/services/api";
import { useFilters } from "@/context/FilterContext";

export default function TabLayout() {
  const { isPro, isLoading: isProLoading } = useFilters();
  const { data: events } = useQuery({
    queryKey: ['all-events', isPro],
    queryFn: () => fetchAllEvents(isPro ?? false),
    // K5: isPro cache'den okunana kadar query başlatma
    enabled: !isProLoading,
    refetchInterval: 5 * 60 * 1000,
  });

  const recentCount = events ? getRecentEventsCount(events) : 0;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.accent.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Map",
          tabBarIcon: ({ color }) => <Globe size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="list"
        options={{
          title: "Events",
          tabBarIcon: ({ color }) => (
            <View>
              <List size={22} color={color} />
              {recentCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {recentCount > 99 ? '99+' : recentCount}
                  </Text>
                </View>
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color }) => <Settings size={22} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 8,
    paddingBottom: 24,
    height: 80,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 4,
  },
  badge: {
    position: 'absolute',
    right: -8,
    top: -4,
    backgroundColor: Colors.severity.critical,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: Colors.text,
    fontSize: 10,
    fontWeight: '700',
  },
});