import { useMemo } from 'react';
import { Tabs } from 'expo-router';
import { StyleSheet, View, StatusBar, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useTheme, useIsDark } from '@/features/shared/styles/ThemeContext';
import { Theme } from '@/features/shared/styles/theme';
import { friendService } from '@/features/friends/friendService';

/**
 * Tab Layout - 5 tabs in logical order like modern apps
 */
export default function TabsLayout() {
  const theme = useTheme();
  const isDark = useIsDark();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const activeColor = theme.colors.primary;
  const inactiveColor = theme.colors.text.secondary;

  // Fetch pending friend requests for badge
  const { data: friendRequests } = useQuery({
    queryKey: ['friendRequests'],
    queryFn: friendService.getPendingReceivedRequests,
    refetchInterval: 30000,
  });

  const friendBadgeCount = friendRequests?.length || 0;

  return (
    <View style={styles.outerContainer}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.colors.surface} />
      <SafeAreaView style={styles.safeAreaTop} edges={['top']} />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarStyle: styles.tabBar,
            tabBarActiveTintColor: activeColor,
            tabBarInactiveTintColor: inactiveColor,
            tabBarLabelStyle: styles.tabLabel,
          }}
        >
          <Tabs.Screen
            name="discover"
            options={{
              title: 'Découvrir',
              tabBarIcon: ({ focused }) => (
                <Ionicons
                  name={focused ? 'compass' : 'compass-outline'}
                  style={[styles.tabIcon, { color: focused ? activeColor : inactiveColor }]}
                />
              ),
            }}
          />
          <Tabs.Screen
            name="events"
            options={{
              title: 'Événements',
              tabBarIcon: ({ focused }) => (
                <Ionicons
                  name={focused ? 'calendar' : 'calendar-outline'}
                  style={[styles.tabIcon, { color: focused ? activeColor : inactiveColor }]}
                />
              ),
            }}
          />
          <Tabs.Screen
            name="index"
            options={{
              title: 'Messages',
              tabBarIcon: ({ focused }) => (
                <MaterialCommunityIcons
                  name={focused ? 'message' : 'message-outline'}
                  style={[styles.tabIcon, { color: focused ? activeColor : inactiveColor }]}
                />
              ),
            }}
          />
          <Tabs.Screen
            name="friends"
            options={{
              title: 'Amis',
              tabBarIcon: ({ focused }) => (
                <View>
                  <Ionicons
                    name={focused ? 'people' : 'people-outline'}
                    style={[styles.tabIcon, { color: focused ? activeColor : inactiveColor }]}
                  />
                  {friendBadgeCount > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>
                        {friendBadgeCount > 9 ? '9+' : friendBadgeCount}
                      </Text>
                    </View>
                  )}
                </View>
              ),
            }}
          />
          <Tabs.Screen
            name="profile"
            options={{
              title: 'Profil',
              tabBarIcon: ({ focused }) => (
                <FontAwesome5
                  name="user"
                  solid={focused}
                  style={[styles.tabIcon, { color: focused ? activeColor : inactiveColor }]}
                />
              ),
            }}
          />
          <Tabs.Screen
            name="notifications"
            options={{
              href: null,
            }}
          />
        </Tabs>
      </SafeAreaView>
    </View>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  safeAreaTop: {
    backgroundColor: theme.colors.surface,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  tabBar: {
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 8,
    paddingBottom: 8,
    height: 65,
    elevation: 0,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  tabIcon: {
    fontSize: 24,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -10,
    backgroundColor: theme.colors.error,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: theme.colors.text.inverse,
    fontSize: 10,
    fontWeight: '700',
  },
});
