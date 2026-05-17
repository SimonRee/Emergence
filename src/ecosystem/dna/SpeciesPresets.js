import { normalizeDNA } from "./BaseDNA.js";

export const SPECIES_PRESETS = {
  vegetation: normalizeDNA({
    type: "vegetation",
    state: "alive",

    size: 6,
    speed: 0,
    life: 55,

    energy: 35,
    metabolism: 0.08,
    hunger: 0,

    attraction: 0.05,
    repulsion: 0.15,
    aggression: 0,
    fear: 0,
    perceptionRadius: 20,

    reproductionRate: 0.75,
    mutationRate: 0.04,
    spreadRadius: 45,
    fertility: 0.8,

    colorHue: 0.34,
    opacity: 0.65,
    glow: 0.35,
    membraneSoftness: 0.75,
    nucleusSize: 0.3,
    internalComplexity: 0.35,
    pulseSpeed: 1.2,
    pulseAmount: 0.1,

    branchiness: 0.75,
    branchLength: 22,
    sporeDensity: 0.65,
    colonyThickness: 2.2,
    blobAffinity: 0.8,
  }),

  herbivore: normalizeDNA({
    type: "herbivore",
    state: "alive",

    size: 20,
    speed: 200,
    life: 180,

    energy: 55,
    metabolism: 0.45,
    hunger: 0.65,
    hungerThreshold: 60,

    attraction: 0.75,
    repulsion: 0.55,
    aggression: 0.35,
    fear: 0.65,
    perceptionRadius: 120,

    reproductionRate: 0.8,
    mutationRate: 0.06,
    spreadRadius: 20,
    fertility: 0.35,

    colorHue: 0.55,
    opacity: 0.75,
    glow: 0.45,
    membraneSoftness: 0.6,
    nucleusSize: 0.4,
    internalComplexity: 0.55,
    pulseSpeed: 1.8,
    pulseAmount: 0.16,
  }),

  decomposer: normalizeDNA({
    type: "decomposer",
    state: "alive",

    size: 5,
    speed: 180,
    life: 200,

    energy: 50,
    metabolism: 0.32,
    hunger: 0.55,
    hungerThreshold: 60,

    attraction: 0.85,
    repulsion: 0.4,
    aggression: 0.55,
    fear: 0.35,
    perceptionRadius: 100,

    reproductionRate: 0.8,
    mutationRate: 0.07,
    spreadRadius: 25,
    fertility: 0.45,

    colorHue: 0.12,
    opacity: 0.72,
    glow: 0.28,
    membraneSoftness: 0.8,
    nucleusSize: 0.32,
    internalComplexity: 0.5,
    pulseSpeed: 1.1,
    pulseAmount: 0.2,
  }),

  carnivore: normalizeDNA({
    type: "carnivore",
    state: "alive",

    size: 15,
    speed: 600,
    life: 320,

    energy: 110,
    metabolism: 0.40,
    hunger: 0.75,
    hungerThreshold: 60,

    attraction: 0.9,
    repulsion: 0.75,
    aggression: 0.9,
    fear: 0.18,
    perceptionRadius: 400,

    reproductionRate: 0.5,
    mutationRate: 0.08,
    spreadRadius: 22,
    fertility: 0.2,

    colorHue: 0.96,
    opacity: 0.82,
    glow: 0.55,
    membraneSoftness: 0.45,
    nucleusSize: 0.48,
    internalComplexity: 0.7,
    pulseSpeed: 2.2,
    pulseAmount: 0.18,
  }),
};

export function getSpeciesDNA(type) {
  const preset = SPECIES_PRESETS[type];

  if (!preset) {
    console.warn(`Unknown cell type: ${type}. Falling back to vegetation.`);
    return { ...SPECIES_PRESETS.vegetation };
  }

  return { ...preset };
}