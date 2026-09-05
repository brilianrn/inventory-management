export const createRandom = (seed = 20240915) => {
  let state = seed >>> 0;

  const next = () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  return {
    next,
    int: (min, max) => Math.floor(next() * (max - min + 1)) + min,
    float: (min, max, decimals = 2) => Number((next() * (max - min) + min).toFixed(decimals)),
    pick: (items) => items[Math.floor(next() * items.length)],
    sample: (items, count) => {
      const pool = [...items];
      const picked = [];
      const size = Math.min(count, pool.length);
      for (let i = 0; i < size; i += 1) {
        picked.push(pool.splice(Math.floor(next() * pool.length), 1)[0]);
      }
      return picked;
    },
    chance: (probability) => next() < probability,
    weighted: (options) => {
      const total = options.reduce((sum, option) => sum + option.weight, 0);
      let threshold = next() * total;
      for (const option of options) {
        threshold -= option.weight;
        if (threshold <= 0) return option.value;
      }
      return options[options.length - 1].value;
    },
  };
};

export const seedFromString = (value = '') => {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};
