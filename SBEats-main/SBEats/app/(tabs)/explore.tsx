/**
 * Explore tab screen for searching new restaurants.
 */
import React, { useState, useMemo } from 'react';
import { StyleSheet, FlatList, TextInput, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing, Typography } from '@/constants/design';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Tabs, router } from 'expo-router';

import restaurantData from '../../assets/iv_restaurants.json';
export interface Restaurant {
  name: string;
  address: string | null;
  phone: string | null;
  categories: string[];
  opened: string | null;
  url: string;
}

export default function RestaurantScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const [searchQuery, setSearchQuery] = useState('');

  const filteredData = useMemo(() => {
    return restaurantData.filter(item => {
      const search = searchQuery.toLowerCase();
      const nameMatch = item.name.toLowerCase().includes(search);
      const categoryMatch = item.categories.some(cat => cat.toLowerCase().includes(search));
      return nameMatch || categoryMatch;
    });
  }, [searchQuery]);

  const renderItem = ({ item }: { item: Restaurant }) => (
    <TouchableOpacity style={[styles.itemCard, { borderBottomColor: Colors[colorScheme].tabIconDefault }]}
      onPress={() =>
        router.push({
          pathname: '/restaurant/[id]' as any,
          params: { id: item.url }
        })
      }>
      <ThemedView style={styles.itemHeader}>
        <ThemedText type="subtitle">{item.name}</ThemedText>
      </ThemedView>
      
      <ThemedText style={styles.addressText}>{item.address}</ThemedText>
      
      <ThemedView style={styles.categoryRow}>
        <ThemedText style={styles.categoryText}>
          {item.categories.join(', ')}
        </ThemedText>
      </ThemedView>
    </TouchableOpacity>
  );

  return (
    <ThemedView style={styles.container}>
      <Tabs.Screen
        options={{
          title: "Search Restaurants",
        }} 
      />
      <ThemedView style={styles.header}>
        <View style={[styles.searchContainer, { backgroundColor: Colors[colorScheme].inputBackground, borderColor: Colors[colorScheme].border }]}>
          <TextInput
            style={[styles.searchInput, { color: Colors[colorScheme].text }]}
            placeholder="Search restaurants or cuisines..."
            placeholderTextColor={Colors[colorScheme].mutedText}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </ThemedView>

      <FlatList
        data={filteredData}
        keyExtractor={(item) => item.url}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListFooterComponent={<View style={{ height: 80 }} />}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "transparent"
  },
  header: {
    paddingTop: Spacing.lg,
    paddingHorizontal: Spacing.md,
    paddingBottom: 0,
    gap: Spacing.lg,
    backgroundColor: 'transparent',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    height: 48,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.sm,
  },
  searchInput: {
    fontFamily: Typography.family,
    fontSize: Typography.size.md,
    lineHeight: Typography.lineHeight.md,
  },
  listContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.jumbo,
  },
  itemCard: {
    paddingVertical: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  itemHeader: {
    flexDirection: 'row',
    marginBottom: 4,
    backgroundColor: 'transparent',

  },
  addressText: {
    opacity: 0.6,
    fontSize: Typography.size.sm,
    marginBottom: Spacing.sm,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  categoryText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
  }
});
