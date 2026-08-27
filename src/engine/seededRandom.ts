/**
 * Deterministic seeded PRNG (mulberry32).
 * Same seed → same sequence — required for reproducible mission tests.
 */
export function createSeededRandom(seed: number): () => number {
  let t = seed >>> 0
  return () => {
    t += 0x6d2b79f5
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

export function pickIndex(rng: () => number, length: number): number {
  if (length <= 0) {
    throw new Error('Cannot pick from empty collection')
  }
  return Math.floor(rng() * length)
}

export function shuffleInPlace<T>(items: T[], rng: () => number): T[] {
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = pickIndex(rng, i + 1)
    const tmp = items[i]!
    items[i] = items[j]!
    items[j] = tmp
  }
  return items
}
