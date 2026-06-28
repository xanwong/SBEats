# Codebase Architecture Guide

How to structure files, functions, and abstractions when building new features in SBEats.

---

## Where to Put New Files

| You're building... | Put it in... | 
|---------------------|-------------|
| A new screen/page | `app/` (following Expo Router conventions) | 
| A new tab | `app/(tabs)/` | 
| A reusable UI component | `components/ui/` | 
| A feature-specific component | `components/<feature>/` | 
| Firestore or API logic | `components/<feature>/` as a service file | 
| TypeScript types for a feature | `components/<feature>/types.ts` | 
| Pure computation (no React, no Firebase) | `app/<related-area>/` or `utils/` | 
| A custom hook | `hooks/` |
| Static data or config | `constants/` or `assets/` | 
---


## Components

### When to Make a Component

Make a new component when:
- The same UI appears on 2+ screens
- A section of a screen is 50+ lines and has its own state
- You want to isolate a piece of logic for testing

Keep it inline when:
- It's a one-off piece of UI specific to one screen
- It's under 20 lines with no independent state

---

## Services

A **service file** handles all external communication (Firestore, APIs, etc.) for a feature.

### Rules for Services

1. **Services are plain async functions, not React components or hooks.** They should be importable and callable from anywhere.

2. **Services handle their own error logging.** Catch errors, log them, and return a safe default (null, empty array, etc.). 

3. **Services should not import React.** If you need `useState` or `useEffect`, that's a hook, not a service.

### Service File Template

```typescript
// components/<feature>/<feature>Service.ts

import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../../firebaseconfig';
import { YourType } from './types';

export async function getSomething(id: string): Promise<YourType | null> {
  const user = auth.currentUser;
  if (!user) return null;

  try {
    const q = query(
      collection(db, 'yourCollection'),
      where('someField', '==', id)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as YourType);
  } catch (error: any) {
    console.error('getSomething error:', error.message);
    return null;
  }
}

export async function saveSomething(id: string, data: Partial<YourType>): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('User not logged in');

  try {
    // ... Firestore write logic
  } catch (error: any) {
    console.error('saveSomething error:', error.message);
    throw error; // re-throw so the screen can show a toast
  }
}
```

### External API Service Template

For features that call external APIs (e.g., AI, Google Places):

```typescript
// components/<feature>/<feature>Service.ts

import { YourResponseType } from './types';

const API_BASE_URL = 'https://api.example.com';

export async function fetchRecommendation(prompt: string): Promise<YourResponseType | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/recommend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error('fetchRecommendation error:', error.message);
    return null;
  }
}
```

---

## Types

### Rules for Types

1. **Define types close to where they're used.** Each feature folder should have its own `types.ts`.

2. **Export types that are shared.** If only one file uses a type, keep it in that file. If multiple files use it, put it in `types.ts`.

3. **Use `as const` for fixed sets of values.** This gives you type-safe keys:

```typescript
export const RATING_CATEGORIES = [
  { key: "food", label: "Food Quality" },
  { key: "service", label: "Service" },
] as const;

export type RatingKey = typeof RATING_CATEGORIES[number]["key"];
// Result: "food" | "service"
```

4. **Firestore document types should match the actual document shape exactly.** Don't add computed fields to the type — keep those in the compute functions.

---

## Hooks

Use a custom hook when you need to share **stateful logic** (not just UI, not just data fetching).

### When to Use a Hook vs a Service

| Situation | Use |
|-----------|-----|
| Fetch data from Firestore | Service function |
| Fetch data and manage loading/error state | Hook that calls a service |
| Reusable stateful UI logic (e.g., toggle, timer) | Hook |
| Pure computation | Plain function |

---

## Constants and Config

| File | Purpose |
|------|---------|
| `constants/theme.ts` | Colors, fonts, spacing values |
| `firebaseconfig.ts` | Firebase app initialization |
| `assets/iv_restaurants.json` | Static restaurant data |

### Rules

- **Never hardcode colors, API keys, or magic numbers in screens.** Extract them.
- **Environment variables** go in `.env`.
- **Category lists, icon maps, and color maps** should be in `constants/` if used by multiple screens.

---
