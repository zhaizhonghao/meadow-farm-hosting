import {MAP_CENTER, MAP_SIZE} from './geography.mjs?v=8.6.0';

export const baseTileSize = (width, height) => Math.min(width / (MAP_SIZE * 2.25), height / (MAP_SIZE + 5));

export function farmFraming(buildings, width, height) {
  if (!buildings.length || !width || !height) return {x: MAP_CENTER, y: MAP_CENTER, zoom: 1};
  let left = Infinity, right = -Infinity, top = Infinity, bottom = -Infinity;
  for (const b of buildings) {
    const u = b.x - b.y, v = (b.x + b.y + 1) / 2;
    left = Math.min(left, u - 1); right = Math.max(right, u + 1);
    top = Math.min(top, v - 2); bottom = Math.max(bottom, v + .5);
  }
  const u = (left + right) / 2, v = (top + bottom) / 2;
  const tile = Math.min(width * .82 / (right - left), height * .70 / (bottom - top));
  return {x: v + u / 2, y: v - u / 2, zoom: Math.max(.55, Math.min(2.85, tile / baseTileSize(width, height)))};
}
