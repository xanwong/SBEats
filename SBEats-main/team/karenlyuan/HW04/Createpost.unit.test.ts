/** @jest-environment node */

/**
 * Createpost.unit.test.ts
 * TYPE: Unit Tests
 * Tests pure business logic — no React, no Firebase, no Expo.
 * Functions are defined locally (no app imports needed).
 */

// ── Logic under test (mirrors create_post.tsx) ────────────────────────────────

interface Restaurant { name: string; url: string; categories: string[] }

function isPostReady(image: string | null, caption: string): { ok: boolean; reason?: string } {
  if (!image) return { ok: false, reason: 'No photo selected' };
  if (!caption.trim()) return { ok: false, reason: 'No caption' };
  return { ok: true };
}

function estimateBase64Bytes(base64: string): number {
  return base64.length * 0.75;
}

function isImageWithinLimit(base64: string, limitBytes = 900_000): boolean {
  return estimateBase64Bytes(base64) <= limitBytes;
}

function addHashtag(existing: string[], raw: string): string[] {
  const tag = raw.trim().replace(/^#/, '');
  if (!tag || existing.includes(tag)) return existing;
  return [...existing, tag];
}

function removeHashtag(existing: string[], tag: string): string[] {
  return existing.filter((h) => h !== tag);
}

function searchRestaurants(data: Restaurant[], query: string): Restaurant[] {
  if (!query.trim()) return [];
  const lower = query.toLowerCase();
  return data
    .filter(
      (r) =>
        r.name.toLowerCase().includes(lower) ||
        r.categories.some((c) => c.toLowerCase().includes(lower))
    )
    .slice(0, 5);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('isPostReady', () => {
  it('fails when image is null', () => {
    expect(isPostReady(null, 'Great food!').ok).toBe(false);
  });

  it('fails when caption is empty', () => {
    expect(isPostReady('file://img.jpg', '   ').ok).toBe(false);
  });

  it('passes when both image and caption are present', () => {
    expect(isPostReady('file://img.jpg', 'Delicious tacos!').ok).toBe(true);
  });
});

describe('image size enforcement', () => {
  it('accepts image at exactly 900 KB', () => {
    expect(isImageWithinLimit('A'.repeat(1_200_000))).toBe(true);
  });

  it('rejects image over 900 KB', () => {
    expect(isImageWithinLimit('A'.repeat(1_200_002))).toBe(false);
  });
});

describe('addHashtag', () => {
  it('adds a new tag', () => {
    expect(addHashtag([], 'foodie')).toEqual(['foodie']);
  });

  it('strips leading #', () => {
    expect(addHashtag([], '#pizza')).toEqual(['pizza']);
  });

  it('does not add duplicates', () => {
    expect(addHashtag(['pizza'], '#pizza')).toEqual(['pizza']);
  });

  it('ignores empty input', () => {
    expect(addHashtag(['pizza'], '   ')).toEqual(['pizza']);
  });
});

describe('removeHashtag', () => {
  it('removes an existing tag', () => {
    expect(removeHashtag(['food', 'pizza'], 'pizza')).toEqual(['food']);
  });

  it('no-ops if tag not present', () => {
    expect(removeHashtag(['food'], 'sushi')).toEqual(['food']);
  });
});

describe('searchRestaurants', () => {
  const restaurants: Restaurant[] = [
    { name: 'Freebirds World Burrito', url: 'https://freebirds.com', categories: ['Mexican'] },
    { name: 'Blenders in the Grass',   url: 'https://blenders.com',  categories: ['Smoothies'] },
    { name: "Woodstock's Pizza",        url: 'https://woodstocks.com', categories: ['Pizza'] },
  ];

  it('returns [] for empty query', () => {
    expect(searchRestaurants(restaurants, '')).toEqual([]);
  });

  it('matches by name (case-insensitive)', () => {
    const results = searchRestaurants(restaurants, 'FREE');
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Freebirds World Burrito');
  });

  it('matches by category', () => {
    expect(searchRestaurants(restaurants, 'pizza')[0].name).toBe("Woodstock's Pizza");
  });

  it('returns [] when nothing matches', () => {
    expect(searchRestaurants(restaurants, 'zzznomatch')).toHaveLength(0);
  });
});