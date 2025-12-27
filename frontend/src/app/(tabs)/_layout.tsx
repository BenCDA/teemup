import { Tabs } from 'expo-router';
import { StyleSheet, View, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { theme } from '@/features/shared/styles/theme';
import { HeaderImg } from '@/components/ui';

/**
 * Mise en page des onglets
 * Définit la structure de navigation des onglets en bas avec un en-tête persistant et une SafeArea centralisée
 * SafeAreaView gère les zones sûres supérieure (noire) et inférieure (blanche) avec des couleurs de fond différentes
 */
export default function TabsLayout() {
  const activeColor = theme.colors.primary;
  const inactiveColor = '#666';

  return (
    <View style={styles.outerContainer}>
      {/* Barre de statut - Texte blanc sur fond noir */}
      <StatusBar barStyle="light-content" backgroundColor="black" />

      {/* SafeArea supérieure - Noire */}
      <SafeAreaView style={styles.safeAreaTop} edges={['top']}>
        <HeaderImg />
      </SafeAreaView>

      {/* Contenu principal avec SafeArea inférieure - Blanc */}
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
            name="index"
            options={{
              title: 'Messages',
              tabBarIcon: ({ focused }) => (
                <MaterialCommunityIcons
                  name="message"
                  style={[styles.tabIcon, { color: focused ? activeColor : inactiveColor }]}
                />
              ),
            }}
          />
          <Tabs.Screen
            name="discover"
            options={{
              title: 'Découvrir',
              tabBarIcon: ({ focused }) => (
                <Ionicons
                  name="search"
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
                <Ionicons
                  name="people"
                  style={[styles.tabIcon, { color: focused ? activeColor : inactiveColor }]}
                />
              ),
            }}
          />
          <Tabs.Screen
            name="notifications"
            options={{
              title: 'Notifs',
              tabBarIcon: ({ focused }) => (
                <Ionicons
                  name="notifications"
                  style={[styles.tabIcon, { color: focused ? activeColor : inactiveColor }]}
                />
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
                  style={[styles.tabIcon, { color: focused ? activeColor : inactiveColor }]}
                />
              ),
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
    backgroundColor: 'black',
  },
  safeAreaTop: {
    backgroundColor: 'black',
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
    fontSize: 12,
    fontWeight: '600',
  },
  tabIcon: {
    fontSize: 24,
  },
});
