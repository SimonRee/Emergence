import { createVegetationTextures } from "./VegetationTextures.js";
import { createHerbivoreTextures } from "./HerbivoreTextures.js";
import { createDecomposerTextures } from "./DecomposerTextures.js";
import { createCarnivoreTextures } from "./CarnivoreTextures.js";

export function createTexturePools(app) {
  return {
    vegetation: createVegetationTextures(app, 30),
    herbivore: createHerbivoreTextures(app, 30),
    decomposer: createDecomposerTextures(app, 30),
    carnivore: createCarnivoreTextures(app, 30),
  };
}

export function getTextureFromPool(texturePools, type, variant = 0) {
  const pool = texturePools[type];

  if (!pool || pool.length === 0) {
    console.warn(`No texture pool found for type: ${type}`);
    return null;
  }

  return pool[Math.abs(Math.floor(variant)) % pool.length];
}