/**
 * visitedplacescard.ab.test.tsx
 * Tests two card variants with the same acceptance criteria
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { View, Text, Image, TouchableOpacity } from 'react-native';

// Test data
const ENTRY = {
  restaurantId: 'freebirds.com',
  name: 'Freebirds World Burrito',
  category: 'Mexican',
  imageUri: 'https://example.com/image.jpg',
  overallRating: 8.5,
  studyStars: 4,
  visitedAt: new Date('2025-03-01'),
};

// Mock navigation
const mockNavigate = jest.fn();
jest.mock('expo-router', () => ({
  router: { push: mockNavigate },
}));

// Helper functions
function formatDate(d: Date) {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Simple star row component
function StarRow({ stars, testID }: { stars: number; testID: string }) {
  return (
    <View testID={testID}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Text key={i}>{stars >= i ? '★' : '☆'}</Text>
      ))}
    </View>
  );
}

// Variant A: Compact Row
function VariantA({ empty = false }) {
  if (empty) return <Text testID="a-empty">No visited places yet</Text>;
  
  return (
    <TouchableOpacity
      testID="a-card"
      onPress={() => mockNavigate({ pathname: '/restaurant/[id]', params: { id: ENTRY.restaurantId } })}
    >
      <Image testID="a-image" source={{ uri: ENTRY.imageUri }} style={{ width: 52, height: 52 }} />
      <View>
        <Text testID="a-name">{ENTRY.name}</Text>
        <Text testID="a-category">{ENTRY.category}</Text>
        <StarRow stars={ENTRY.studyStars} testID="a-stars" />
        <Text testID="a-date">{formatDate(ENTRY.visitedAt)}</Text>
      </View>
      <Text testID="a-rating">{ENTRY.overallRating.toFixed(1)}/10</Text>
    </TouchableOpacity>
  );
}

// Variant B: Expanded Card
function VariantB({ empty = false }) {
  if (empty) return <Text testID="b-empty">No visited places yet</Text>;
  
  return (
    <TouchableOpacity
      testID="b-card"
      onPress={() => mockNavigate({ pathname: '/restaurant/[id]', params: { id: ENTRY.restaurantId } })}
    >
      <Image testID="b-image" source={{ uri: ENTRY.imageUri }} style={{ width: '100%', height: 120 }} />
      <View>
        <Text testID="b-name">{ENTRY.name}</Text>
        <Text testID="b-rating">{ENTRY.overallRating.toFixed(1)}/10</Text>
      </View>
      <View>
        <StarRow stars={ENTRY.studyStars} testID="b-stars" />
        <Text testID="b-date">{formatDate(ENTRY.visitedAt)}</Text>
      </View>
    </TouchableOpacity>
  );
}

// Shared acceptance criteria tests
describe('Variant A', () => {
  beforeEach(() => mockNavigate.mockClear());

  test('renders restaurant name', () => {
    const { getByTestId } = render(<VariantA />);
    expect(getByTestId('a-name').props.children).toBe(ENTRY.name);
  });

  test('renders overall rating as X.X/10', () => {
    const { getByTestId } = render(<VariantA />);
    expect(getByTestId('a-rating').props.children).toBe('8.5/10');
  });

  test('renders star row', () => {
    const { getByTestId } = render(<VariantA />);
    expect(getByTestId('a-stars')).toBeTruthy();
  });

  test('renders visit date', () => {
    const { getByTestId } = render(<VariantA />);
    expect(getByTestId('a-date').props.children).toMatch(/Mar 1, 2025/);
  });

  test('navigates on press', () => {
    const { getByTestId } = render(<VariantA />);
    fireEvent.press(getByTestId('a-card'));
    expect(mockNavigate).toHaveBeenCalled();
  });

  test('shows empty state', () => {
    const { getByTestId } = render(<VariantA empty={true} />);
    expect(getByTestId('a-empty')).toBeTruthy();
  });

  test('image is 52x52', () => {
    const { getByTestId } = render(<VariantA />);
    expect(getByTestId('a-image').props.style.width).toBe(52);
    expect(getByTestId('a-image').props.style.height).toBe(52);
  });
});

describe('Variant B', () => {
  beforeEach(() => mockNavigate.mockClear());

  test('renders restaurant name', () => {
    const { getByTestId } = render(<VariantB />);
    expect(getByTestId('b-name').props.children).toBe(ENTRY.name);
  });

  test('renders overall rating', () => {
    const { getByTestId } = render(<VariantB />);
    expect(getByTestId('b-rating').props.children).toBe('8.5/10');
  });

  test('renders star row', () => {
    const { getByTestId } = render(<VariantB />);
    expect(getByTestId('b-stars')).toBeTruthy();
  });

  test('renders visit date', () => {
    const { getByTestId } = render(<VariantB />);
    expect(getByTestId('b-date').props.children).toMatch(/Mar 1, 2025/);
  });

  test('navigates on press', () => {
    const { getByTestId } = render(<VariantB />);
    fireEvent.press(getByTestId('b-card'));
    expect(mockNavigate).toHaveBeenCalled();
  });

  test('shows empty state', () => {
    const { getByTestId } = render(<VariantB empty={true} />);
    expect(getByTestId('b-empty')).toBeTruthy();
  });

  test('image is full width', () => {
    const { getByTestId } = render(<VariantB />);
    expect(getByTestId('b-image').props.style.height).toBe(120);
    expect(getByTestId('b-image').props.style.width).toBe('100%');
  });
});