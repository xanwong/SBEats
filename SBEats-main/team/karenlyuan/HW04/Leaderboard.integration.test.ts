/**
 * Leaderboard.integration.test.ts
 * TYPE: Integration Tests
 * Tests leaderboard aggregation and profile summary logic.
 */

// @jest-environment node

interface LeaderboardEntry {
  uid: string;
  username: string;
  avatarUrl?: string | null;
  ratingCount: number;
  rank: number;
}

function buildLeaderboard(
  userDocs: { id: string; data: () => Record<string, any> }[],
  ratingDocs: { data: () => Record<string, any> }[]
): LeaderboardEntry[] {
  const usersMap = new Map<string, { username?: string; avatarUrl?: string }>();
  userDocs.forEach((d) => usersMap.set(d.id, d.data()));

  const ratingsCountMap = new Map<string, number>();
  ratingDocs.forEach((d) => {
    const { userId } = d.data();
    if (userId) ratingsCountMap.set(userId, (ratingsCountMap.get(userId) || 0) + 1);
  });

  const entries: LeaderboardEntry[] = [];
  usersMap.forEach((user, uid) => {
    entries.push({
      uid,
      username: user.username || 'Anonymous',
      avatarUrl: user.avatarUrl ?? null,
      ratingCount: ratingsCountMap.get(uid) || 0,
      rank: 0,
    });
  });

  entries.sort((a, b) => b.ratingCount - a.ratingCount);
  entries.forEach((e, i) => { e.rank = i + 1; });
  return entries;
}

function computeProfileSummary(entries: LeaderboardEntry[], currentUid: string) {
  const total = entries.length;
  const myEntry = entries.find((e) => e.uid === currentUid);
  const rank = myEntry?.rank ?? null;
  const topPercent = rank && total > 0
    ? Math.max(1, Math.ceil((rank / total) * 100))
    : null;
  return { rank, total, topPercent, ratingCount: myEntry?.ratingCount ?? 0 };
}

const makeUser = (id: string, username: string) =>
  ({ id, data: () => ({ username }) });

const makeRating = (userId: string) =>
  ({ data: () => ({ userId, restaurantId: 'r1' }) });

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('buildLeaderboard', () => {
  const users = [
    makeUser('alice', 'Alice'),
    makeUser('bob', 'Bob'),
    makeUser('carol', 'Carol'),
  ];
  const ratings = [
    makeRating('carol'), makeRating('carol'), makeRating('carol'),
    makeRating('alice'), makeRating('alice'),
    makeRating('bob'),
  ];

  it('ranks users by rating count', () => {
    const lb = buildLeaderboard(users, ratings);
    expect(lb.find(e => e.uid === 'carol')?.rank).toBe(1);
    expect(lb.find(e => e.uid === 'alice')?.rank).toBe(2);
    expect(lb.find(e => e.uid === 'bob')?.rank).toBe(3);
  });

  it('returns empty array for empty input', () => {
    expect(buildLeaderboard([], [])).toEqual([]);
  });

  it('includes user with 0 ratings', () => {
    const lb = buildLeaderboard([makeUser('ghost', 'Ghost')], []);
    expect(lb).toHaveLength(1);
    expect(lb[0].ratingCount).toBe(0);
  });

  it('ignores ratings with no userId', () => {
    const lb = buildLeaderboard(
      [makeUser('alice', 'Alice')],
      [{ data: () => ({ restaurantId: 'r1' }) }]
    );
    expect(lb[0].ratingCount).toBe(0);
  });

  it('falls back to Anonymous for missing username', () => {
    const lb = buildLeaderboard([{ id: 'x', data: () => ({}) }], []);
    expect(lb[0].username).toBe('Anonymous');
  });
});

describe('computeProfileSummary', () => {
  const entries: LeaderboardEntry[] = [
    { uid: 'a', username: 'A', ratingCount: 10, rank: 1, avatarUrl: null },
    { uid: 'b', username: 'B', ratingCount: 8,  rank: 2, avatarUrl: null },
    { uid: 'c', username: 'C', ratingCount: 5,  rank: 3, avatarUrl: null },
    { uid: 'd', username: 'D', ratingCount: 2,  rank: 4, avatarUrl: null },
  ];

  it('returns correct rank and count for known user', () => {
    const summary = computeProfileSummary(entries, 'a');
    expect(summary.rank).toBe(1);
    expect(summary.ratingCount).toBe(10);
  });

  it('returns null for unknown user', () => {
    const { rank, topPercent } = computeProfileSummary(entries, 'nobody');
    expect(rank).toBeNull();
    expect(topPercent).toBeNull();
  });

  it('topPercent is never below 1', () => {
    const big = Array.from({ length: 1000 }, (_, i) => ({
      uid: String(i), username: `u${i}`, ratingCount: 1000 - i, rank: i + 1, avatarUrl: null,
    }));
    expect(computeProfileSummary(big, '0').topPercent).toBeGreaterThanOrEqual(1);
  });
});