import { OUTLETS, PRODUCTS } from './master.js';
import { createRandom } from './random.js';

export const stockKey = (outletId, productId) => `${outletId}:${productId}`;

export const buildStockLevels = () => {
  const random = createRandom(51009);
  const levels = new Map();

  OUTLETS.forEach((outlet) => {
    PRODUCTS.forEach((product) => {
      const quantity = random.chance(0.05) ? 0 : random.float(6, 640, 2);
      levels.set(stockKey(outlet.id, product.id), quantity);
    });
  });

  return levels;
};

export const readStock = (levels, outletId, productId) =>
  levels.get(stockKey(outletId, productId)) ?? 0;

export const increaseStock = (levels, outletId, productId, quantity) => {
  const key = stockKey(outletId, productId);
  const next = Number(((levels.get(key) ?? 0) + quantity).toFixed(2));
  levels.set(key, next);
  return next;
};

export const reduceStock = (levels, outletId, productId, quantity) => {
  const key = stockKey(outletId, productId);
  const next = Number(Math.max(0, (levels.get(key) ?? 0) - quantity).toFixed(2));
  levels.set(key, next);
  return next;
};
