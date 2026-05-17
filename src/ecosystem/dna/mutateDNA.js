import { DNA_LIMITS, normalizeDNA, CELL_TYPES } from "./BaseDNA.js";
import { getSpeciesDNA } from "./SpeciesPresets.js";

export function createDNA(type = "vegetation", overrides = {}) {
  return normalizeDNA({
    ...getSpeciesDNA(type),
    ...overrides,
  });
}

export function mutateDNA(dna, intensity = 0.12) {
  const mutated = { ...dna };

  for (const key of Object.keys(DNA_LIMITS)) {
    const value = mutated[key];
    if (typeof value !== "number") continue;

    const [min, max] = DNA_LIMITS[key];
    const range = max - min;

    mutated[key] = value + randomRange(-range * intensity, range * intensity);
  }

  mutated.type = dna.type;
  mutated.state = dna.state;

  return normalizeDNA(mutated);
}

export function createRandomDNA(type = null, intensity = 0.35) {
  const selectedType =
    type || CELL_TYPES[Math.floor(Math.random() * CELL_TYPES.length)];

  return mutateDNA(getSpeciesDNA(selectedType), intensity);
}

export function createUserSpawnDNA() {
  const type = CELL_TYPES[Math.floor(Math.random() * CELL_TYPES.length)];
  return createRandomDNA(type, 0.45);
}

export function createDeadDNA(dna) {
  return normalizeDNA({
    ...dna,
    state: "dead",
    speed: 0,
    hunger: 0,
    attraction: 0,
    aggression: 0,
    fear: 0,
    reproductionRate: 0,
    opacity: dna.opacity * 0.65,
    glow: dna.glow * 0.25,
    colorHue: 0.11,
  });
}

export function canEatCell(predatorDNA, targetDNA) {
  if (predatorDNA.state !== "alive") return false;

  if (predatorDNA.type === "herbivore") {
    return targetDNA.type === "vegetation" && targetDNA.state === "alive";
  }

  if (predatorDNA.type === "decomposer") {
    return targetDNA.type === "vegetation" && targetDNA.state === "dead";
  }

  if (predatorDNA.type === "carnivore") {
    return (
      targetDNA.state === "alive" &&
      (targetDNA.type === "herbivore" || targetDNA.type === "decomposer")
    );
  }

  return false;
}

function randomRange(min, max) {
  return min + Math.random() * (max - min);
}