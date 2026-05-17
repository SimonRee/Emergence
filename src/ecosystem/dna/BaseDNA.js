export const CELL_TYPES = ["vegetation", "herbivore", "decomposer", "carnivore"];
export const CELL_STATES = ["alive", "dead"];

export const DNA_LIMITS = {
  textureVariant: [0, 29],

  size: [1, 40],
  speed: [0, 300],
  life: [5, 300],

  energy: [0, 100],
  metabolism: [0, 1],
  hunger: [0, 1],
  hungerThreshold: [0, 100],

  attraction: [0, 1],
  repulsion: [0, 1],
  aggression: [0, 1],
  fear: [0, 1],
  perceptionRadius: [5, 500],

  reproductionRate: [0, 1],
  mutationRate: [0, 1],
  spreadRadius: [0, 250],
  fertility: [0, 1],

  colorHue: [0, 1],
  opacity: [0.05, 1],
  glow: [0, 1],
  membraneSoftness: [0, 1],
  nucleusSize: [0, 1],
  internalComplexity: [0, 1],
  pulseSpeed: [0, 6],
  pulseAmount: [0, 1],

  //parametri fatti per le cellule vegetation
  branchiness: [0, 1],
branchLength: [2, 60],
sporeDensity: [0, 1],
colonyThickness: [0.5, 8],
blobAffinity: [0, 1],
};

export const BASE_DNA = {
  type: "vegetation",
  state: "alive",

  textureVariant: 0,

  size: 6,
  speed: 20,
  life: 60,

  energy: 40,
  metabolism: 0.25,
  hunger: 0.4,
  hungerThreshold: 60,

  attraction: 0.4,
  repulsion: 0.4,
  aggression: 0.2,
  fear: 0.3,
  perceptionRadius: 80,

  reproductionRate: 0.2,
  mutationRate: 0.05,
  spreadRadius: 30,
  fertility: 0.5,

  colorHue: 0.35,
  opacity: 0.7,
  glow: 0.35,
  membraneSoftness: 0.6,
  nucleusSize: 0.35,
  internalComplexity: 0.4,
  pulseSpeed: 1.5,
  pulseAmount: 0.12,

  //parametri fatti per le cellule vegetation
  branchiness: 0.5,
branchLength: 18,
sporeDensity: 0.5,
colonyThickness: 2,
blobAffinity: 0.5,
};

export function clampDNAValue(key, value) {
  const limits = DNA_LIMITS[key];
  if (!limits) return value;

  const [min, max] = limits;
  return Math.max(min, Math.min(max, value));
}

export function normalizeDNA(dna) {
  const normalized = {
    ...BASE_DNA,
    ...dna,
  };

  if (!CELL_TYPES.includes(normalized.type)) {
    normalized.type = "vegetation";
  }

  if (!CELL_STATES.includes(normalized.state)) {
    normalized.state = "alive";
  }

  for (const key of Object.keys(DNA_LIMITS)) {
    normalized[key] = clampDNAValue(key, normalized[key]);
  }

  return normalized;
}