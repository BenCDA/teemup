import { useEffect, useState } from 'react';
import { Tabs } from 'expo-router';
import { StyleSheet, View, StatusBar, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { theme } from '@/features/shared/styles/theme';
import { notificationService } from '@/features/notifications/notificationService';
import { friendService } from '@/features/friends/friendService';

/**
 * Tab Layout - 5 tabs in logical order like modern apps
 * 1. Discover (Home) - Find new people
 * 2. Events - Sports events
 * 3. Messages - Conversations
 * 4. Friends - Social connections (with notification badge)
 * 5. Profile - User settings
 */
export default function TabsLayout() {
  const activeColor = theme.colors.primary;
  const inactiveColor = '#666';

  // Fetch unread counts for badges
  const { data: unreadCount } = useQuery({
    queryKey: ['unreadNotifications'],
    queryFn: notificationService.getUnreadCount,
    refetchInterval: 30000, // Refresh every 30s
  });

  const { data: friendRequests } = useQuery({
    queryKey: ['friendRequests'],
    queryFn: friendService.getPendingReceivedRequests,
    refetchInterval: 30000,
  });

  const friendBadgeCount = (friendRequests?.length || 0) + (unreadCount || 0);

  return (
    <View style={styles.outerContainer}>
      {/* Status Bar */}
      <StatusBar barStyle="dark-content" backgroundColor="white" />

      {/* Top Safe Area */}
      <SafeAreaView style={styles.safeAreaTop} edges={['top']} />

      {/* Main Content with Bottom Safe Area */}
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
          {/* 1. Discover - Home/Feed */}
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

          {/* 2. Events */}
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

          {/* 3. Messages */}
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

          {/* 4. Friends (with badge for requests + notifications) */}
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

          {/* 5. Profile */}
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

          {/* Hidden - Notifications (accessible from Friends tab) */}
          <Tabs.Screen
            name="notifications"
            options={{
              href: null, // Hide from tab bar
            }}
          />
        </Tabs>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  safeAreaTop: {
    backgroundColor: 'white',
  },
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  tabBar: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
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
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
});
