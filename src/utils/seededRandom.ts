const hashString = (value: string): number => {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

const mulberry32 = (seed: number) => {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export const buildWaveformHeights = (seed: string, count: number): number[] => {
  const rng = mulberry32(hashString(seed));
  return Array.from({ length: count }, (_, index) => {
    const randomFactor = 0.3 + rng() * 0.4;
    const height = Math.abs(Math.sin((index + 1) * randomFactor) * 100);
    return height;
  });
};
