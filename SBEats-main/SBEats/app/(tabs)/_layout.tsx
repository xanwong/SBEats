/**
 * Layout component for the main tabbed navigation of the app.
 */
import { Tabs, router } from 'expo-router';
import { onAuthStateChanged, User } from 'firebase/auth';
import React, { useEffect, useState } from 'react';

import { HapticTab } from '@/components/haptic-tab';
import LoginScreen from '@/components/LoginScreen';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Spacing, Typography, AppColor } from '@/constants/design';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { auth } from '../../firebaseconfig';
import { useSafeAreaInsets } from 'react-native-safe-area-context';


export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const inset = useSafeAreaInsets();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ThemedText>Loading...</ThemedText>
      </ThemedView>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        tabBarInactiveTintColor: Colors[colorScheme ?? 'light'].tabIconDefault,
        headerShown: true,
        tabBarButton: HapticTab,
        header: ({ options }) => (
          <View
            style={[
              styles.sharedHeader,
              { backgroundColor: AppColor[colorScheme ?? 'light'].background },
              { paddingTop: inset.top + Spacing.md },
            ]}
          >
            <ThemedText style={[styles.sharedHeaderTitle, { color: AppColor[colorScheme ?? 'light'].tint }]}>
              SBEats
            </ThemedText>
            <View style={styles.sharedHeaderRight}>
              {options.headerRight ? options.headerRight({ tintColor: Colors[colorScheme ?? 'light'].text, canGoBack: false }) : null}
            </View>
          </View>
        ),
        headerStyle: {
          borderBottomWidth: 1,
          borderBottomColor: '#e0e0e0',
        },
        headerTitleStyle: {
          fontFamily: Typography.family,
          fontSize: Typography.size.xxl,
          fontWeight: Typography.weight.heavy,
          fontStyle: 'italic',
          color: AppColor[colorScheme ?? 'light'].tint
        },
        headerTintColor: Colors[colorScheme ?? 'light'].text,
        tabBarStyle: {
          height: 80,
          paddingBottom: inset.bottom + Spacing.sm,
          paddingTop: Spacing.sm,
          backgroundColor: Colors[colorScheme ?? 'light'].surface,
          borderTopColor: Colors[colorScheme ?? 'light'].border,
          borderTopWidth: StyleSheet.hairlineWidth,
        },
        tabBarLabelStyle: {
          fontFamily: Typography.family,
          fontSize: Typography.size.xs,
          fontWeight: Typography.weight.regular,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={26} name="house.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          href: null,
          title: 'Explore',
          tabBarIcon: ({ color }) => (
            <FontAwesome name="search" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          title: 'Discover',
          tabBarIcon: ({ color }) => (
            <Ionicons name="compass-outline" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="posts"
        options={{
          title: 'Posts',
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.push('/create-post')}
              style={styles.headerActionButton}
            >
              <Ionicons
                name="add-circle-outline"
                size={28}
                color={AppColor[colorScheme ?? 'light'].tint}
              />
            </TouchableOpacity>
          ),
          tabBarIcon: ({ color }) => (
            <Ionicons name="apps-outline" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          tabBarIcon: ({ color }) => (
            <Ionicons name="calendar-outline" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          href: null,
          title: 'Leaderboard',
          tabBarIcon: ({ color }) => (
            <Ionicons name="trophy-outline" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => (
            <Ionicons name="person-circle-outline" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sharedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  sharedHeaderTitle: {
    fontFamily: Typography.family,
    fontSize: Typography.size.xxl,
    fontWeight: Typography.weight.heavy,
    fontStyle: 'italic',
  },
  sharedHeaderRight: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  headerActionButton: {
    padding: 2,
  },
});
