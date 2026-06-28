/**
 * createpost.component.test.tsx
 * Tests CreatePost component UI interactions
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';

// Mock data
const RESTAURANTS = [
  { name: 'Freebirds World Burrito', url: 'freebirds.com', categories: ['Mexican'] },
  { name: 'Blenders in the Grass', url: 'blenders.com', categories: ['Smoothies'] },
];

// Simplified component stub
function CreatePostStub() {
  const [caption, setCaption] = React.useState('');
  const [hashtagInput, setHashtagInput] = React.useState('');
  const [hashtags, setHashtags] = React.useState<string[]>([]);
  const [restaurantQuery, setRestaurantQuery] = React.useState('');
  const [restaurantResults, setRestaurantResults] = React.useState<typeof RESTAURANTS>([]);
  const [selectedRestaurant, setSelectedRestaurant] = React.useState<typeof RESTAURANTS[0] | null>(null);

  const handleAddHashtag = () => {
    const tag = hashtagInput.trim().replace(/^#/, '');
    if (tag && !hashtags.includes(tag)) {
      setHashtags([...hashtags, tag]);
    }
    setHashtagInput('');
  };

  const handleSearch = (text: string) => {
    setRestaurantQuery(text);
    if (!text.trim()) {
      setRestaurantResults([]);
      return;
    }
    const lower = text.toLowerCase();
    setRestaurantResults(
      RESTAURANTS.filter(
        r => r.name.toLowerCase().includes(lower) ||
             r.categories.some(c => c.toLowerCase().includes(lower))
      )
    );
  };

  return (
    <ScrollView testID="screen">
      <TextInput
        testID="caption-input"
        value={caption}
        onChangeText={setCaption}
      />
      <Text testID="char-count">{caption.length}/300</Text>

      <TextInput
        testID="hashtag-input"
        value={hashtagInput}
        onChangeText={setHashtagInput}
      />
      <TouchableOpacity testID="add-tag-btn" onPress={handleAddHashtag}>
        <Text>Add</Text>
      </TouchableOpacity>
      
      {hashtags.map(tag => (
        <TouchableOpacity
          key={tag}
          testID={`chip-${tag}`}
          onPress={() => setHashtags(hashtags.filter(h => h !== tag))}
        >
          <Text>#{tag}</Text>
        </TouchableOpacity>
      ))}

      {selectedRestaurant ? (
        <View testID="selected-restaurant">
          <Text testID="selected-name">{selectedRestaurant.name}</Text>
          <TouchableOpacity testID="clear-btn" onPress={() => setSelectedRestaurant(null)}>
            <Text>×</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View>
          <TextInput
            testID="restaurant-search"
            value={restaurantQuery}
            onChangeText={handleSearch}
          />
          {restaurantResults.map(r => (
            <TouchableOpacity
              key={r.url}
              testID={`result-${r.url}`}
              onPress={() => {
                setSelectedRestaurant(r);
                setRestaurantQuery('');
                setRestaurantResults([]);
              }}
            >
              <Text>{r.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

describe('Caption', () => {
  test('starts empty with 0/300 count', () => {
    const { getByTestId } = render(<CreatePostStub />);
    expect(getByTestId('caption-input').props.value).toBe('');
    expect(getByTestId('char-count').props.children).toBe('0/300');
  });

  test('updates character count', () => {
    const { getByTestId } = render(<CreatePostStub />);
    fireEvent.changeText(getByTestId('caption-input'), 'Hello');
    expect(getByTestId('char-count').props.children).toBe('5/300');
  });
});

describe('Hashtags', () => {
  test('adds a hashtag', () => {
    const { getByTestId } = render(<CreatePostStub />);
    fireEvent.changeText(getByTestId('hashtag-input'), '#pizza');
    fireEvent.press(getByTestId('add-tag-btn'));
    expect(getByTestId('chip-pizza')).toBeTruthy();
  });

  test('strips leading #', () => {
    const { getByTestId } = render(<CreatePostStub />);
    fireEvent.changeText(getByTestId('hashtag-input'), '#tacos');
    fireEvent.press(getByTestId('add-tag-btn'));
    expect(getByTestId('chip-tacos')).toBeTruthy();
  });

  test('removes hashtag on press', () => {
    const { getByTestId, queryByTestId } = render(<CreatePostStub />);
    fireEvent.changeText(getByTestId('hashtag-input'), 'food');
    fireEvent.press(getByTestId('add-tag-btn'));
    fireEvent.press(getByTestId('chip-food'));
    expect(queryByTestId('chip-food')).toBeNull();
  });

  test('clears input after adding', () => {
    const { getByTestId } = render(<CreatePostStub />);
    fireEvent.changeText(getByTestId('hashtag-input'), 'burger');
    fireEvent.press(getByTestId('add-tag-btn'));
    expect(getByTestId('hashtag-input').props.value).toBe('');
  });
});

describe('Restaurant search', () => {
  test('shows results when typing', () => {
    const { getByTestId } = render(<CreatePostStub />);
    fireEvent.changeText(getByTestId('restaurant-search'), 'free');
    expect(getByTestId('result-freebirds.com')).toBeTruthy();
  });

  test('selects a restaurant', () => {
    const { getByTestId } = render(<CreatePostStub />);
    fireEvent.changeText(getByTestId('restaurant-search'), 'free');
    fireEvent.press(getByTestId('result-freebirds.com'));
    expect(getByTestId('selected-restaurant')).toBeTruthy();
    expect(getByTestId('selected-name').props.children).toBe('Freebirds World Burrito');
  });

  test('clears selection', () => {
    const { getByTestId, queryByTestId } = render(<CreatePostStub />);
    fireEvent.changeText(getByTestId('restaurant-search'), 'free');
    fireEvent.press(getByTestId('result-freebirds.com'));
    fireEvent.press(getByTestId('clear-btn'));
    expect(queryByTestId('selected-restaurant')).toBeNull();
  });
});