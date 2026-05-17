import { Container, Sprite } from "pixi.js";
import { getTextureFromPool } from "../visuals/textures/TexturePools.js";
import { createDNA, mutateDNA } from "./dna/mutateDNA.js";
import {
  findNearestTarget,
  moveToward,
  wander,
  isCloseEnough,
  fleeFromTarget,
} from "./movement/steering.js";
import { applyBoids } from "./movement/boids.js";
import { getBestClaimableTarget, releaseClaim } from "./targeting/claiming.js";

let DECOMPOSER_ID = 0;

export class DecomposerSystem {
  constructor({ worldWidth, worldHeight, vegetationSystem, carnivoreSystem = null, texturePools }) {
    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;
    this.vegetationSystem = vegetationSystem;
    this.carnivoreSystem = carnivoreSystem;
    this.texturePools = texturePools;

    this.container = new Container();
    this.cells = [];

    this.maxCells = 400;
  }

  seed(count = 35) {
    for (let i = 0; i < count; i++) {
      this.createDecomposer({
        x: Math.random() * this.worldWidth,
        y: Math.random() * this.worldHeight,
      });
    }
  }

  update(deltaSeconds, grids = {}) {
    for (let i = this.cells.length - 1; i >= 0; i--) {
      const cell = this.cells[i];
      const d = cell.data;
      const dna = d.dna;

      const isHungry = d.energy <= dna.hungerThreshold;

      const now = performance.now() / 1000;

const nearbyMobiles = grids.mobileCellsGrid
  ? grids.mobileCellsGrid.queryRadius(d.x, d.y, 130)
  : this.cells;

applyBoids(cell, nearbyMobiles, deltaSeconds, "decomposer");

      d.age += deltaSeconds;
      d.energy -= dna.metabolism * 6 * deltaSeconds;
    
      // Controlla se c'è un carnivoro nelle vicinanze e fuggi se necessario
      const threat = grids.mobileCellsGrid
  ? getBestThreat(cell, nearbyMobiles, dna.perceptionRadius * 0.45)
  : this.carnivoreSystem
    ? findNearestTarget(
        cell,
        this.carnivoreSystem.cells,
        (carnivore) => carnivore.data.state === "alive",
        dna.perceptionRadius * 0.45
      )
    : null;

if (threat) {
  fleeFromTarget(
    cell,
    threat,
    deltaSeconds,
    this.worldWidth,
    this.worldHeight
  );

  this.updateVisual(cell);

  if (d.age >= dna.life || d.energy <= 0) {
    this.killCell(cell, i);
  }

  continue;
}

    // Cerca piante morte da decomporre
      let target = null;

if (isHungry) {
  const possibleTargets = grids.deadVegetationGrid
    ? grids.deadVegetationGrid.queryRadius(d.x, d.y, dna.perceptionRadius)
    : this.vegetationSystem.deadPlants;

  target = getBestClaimableTarget({
    cell,
    targets: possibleTargets,
    now,
    maxDistance: dna.perceptionRadius,
    filterFn: (plant) =>
      plant.data.type === "vegetation" &&
      plant.data.state === "dead",
  });
}

      if (target) {
        moveToward(cell, target, deltaSeconds, this.worldWidth, this.worldHeight);

        if (isCloseEnough(cell, target, dna.size + target.data.dna.size)) {
          this.eatDeadPlant(cell, target);
        }
      } else {
        wander(cell, deltaSeconds, this.worldWidth, this.worldHeight);
      }

      this.updateVisual(cell);

      if (d.age >= dna.life || d.energy <= 0) {
        this.killCell(cell, i);
      }
    }
  }

  createDecomposer({ x, y, parentDNA = null, dnaOverride = null }) {
    if (this.cells.length >= this.maxCells) return null;

    const baseDNA = createDNA("decomposer");

const dna = dnaOverride
  ? dnaOverride
  : parentDNA
    ? mutateDNA(parentDNA, parentDNA.mutationRate)
    : createDNA("decomposer", {
        size: baseDNA.size * this.randomRange(0.85, 1.15),
        energy: baseDNA.energy * this.randomRange(0.85, 1.15),
        textureVariant: Math.floor(Math.random() * 30),
      });

    const texture = getTextureFromPool(this.texturePools, dna.type, dna.textureVariant);

const cell = new Sprite(texture);
cell.anchor.set(0.5);
cell.position.set(x, y);
cell.rotation = Math.random() * Math.PI * 2;

if (dna.tintColor) {
  cell.tint = dna.tintColor;
}

    cell.data = {
      id: `decomposer-${DECOMPOSER_ID++}`,
      type: dna.type,
      state: dna.state,
      x,
      y,
      vx: this.randomRange(-8, 8),
      vy: this.randomRange(-8, 8),
      age: 0,
      energy: dna.energy,
      wanderAngle: Math.random() * Math.PI * 2,
      reproductionCooldown: 4 + Math.random() * 10,
      visualSeed: Math.random() * 10000,
      dna,
    };

    //this.drawDecomposer(cell);
    this.cells.push(cell);
    this.container.addChild(cell);

    return cell;
  }

  eatDeadPlant(cell, deadPlant) {
    const d = cell.data;
    const dna = d.dna;

    d.energy = Math.min(100, d.energy + deadPlant.data.dna.energy * 0.55);

    releaseClaim(deadPlant, cell.data.id);

    const index = this.vegetationSystem.deadPlants.indexOf(deadPlant);

    if (index !== -1) {
      this.vegetationSystem.deadPlants.splice(index, 1);
      this.vegetationSystem.container.removeChild(deadPlant);
      deadPlant.destroy();
    }

    d.reproductionCooldown -= 1;

    if (
      d.energy > 65 &&
      d.reproductionCooldown <= 0 &&
      Math.random() < this.getDynamicBirthRate()
    ) {
      this.reproduce(cell);
      d.energy *= 0.68;
      d.reproductionCooldown = 8 + Math.random() * 12;
    }
  }

  reproduce(parent) {
    if (this.cells.length >= this.maxCells) return;

    const d = parent.data;
    const angle = Math.random() * Math.PI * 2;
    const distance = d.dna.spreadRadius + Math.random() * 30;

    const x = this.clamp(d.x + Math.cos(angle) * distance, 0, this.worldWidth);
    const y = this.clamp(d.y + Math.sin(angle) * distance, 0, this.worldHeight);

    this.createDecomposer({
      x,
      y,
      parentDNA: d.dna,
    });
  }

  killCell(cell, index) {
    this.cells.splice(index, 1);
    this.container.removeChild(cell);
    cell.destroy();
  }

  updateVisual(cell) {
    const d = cell.data;
    const dna = d.dna;

    const energyVisual = 0.85 + (d.energy / 100) * 0.15;

const pulse =
  1 +
  Math.sin(d.age * dna.pulseSpeed + d.visualSeed) *
    dna.pulseAmount * 0.35;

const BASE_VISUAL_SCALE = 0.55; // cambia questo
cell.scale.set(BASE_VISUAL_SCALE * energyVisual * pulse);
cell.alpha = dna.opacity * (0.85 + (d.energy / 100) * 0.4); //cambia opacity in base all'energia
  }

  drawDecomposer(cell) {
    const d = cell.data;
    const dna = d.dna;
    const size = dna.size;

    cell.clear();

    // glow caldo/fungino
    cell.circle(0, 0, size * 2.2);
    cell.fill({
      color: 0xffb45a,
      alpha: 0.025 + dna.glow * 0.035,
    });

    // blob principale
    cell.circle(0, 0, size * 1.05);
    cell.fill({
      color: 0xc98a4a,
      alpha: 0.22 + dna.opacity * 0.22,
    });

    // secondo blob decentrato per forma più organica
    cell.circle(size * 0.35, -size * 0.2, size * 0.72);
    cell.fill({
      color: 0x8f5b35,
      alpha: 0.18,
    });

    // membrana molle
    cell.circle(0, 0, size * 1.08);
    cell.stroke({
      width: 1.2,
      color: 0xffd39a,
      alpha: 0.28,
    });

    // spore interne
    const dots = 4 + Math.floor(dna.internalComplexity * 8);

    for (let i = 0; i < dots; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = Math.random() * size * 0.75;

      cell.circle(Math.cos(a) * r, Math.sin(a) * r, 0.7 + Math.random() * 1.2);
      cell.fill({
        color: 0xffe0a8,
        alpha: 0.16,
      });
    }
  }

  // La birth rate dinamica riduce la probabilità di riproduzione quando la popolazione è alta
  getDynamicBirthRate() {
  const count = this.cells.length;

  if (count < 70) return 0.95;
  if (count < 100) return 0.65;
  if (count < 130) return 0.35;
  if (count < 160) return 0.12;

  return 0.02;
}

  randomRange(min, max) {
    return min + Math.random() * (max - min);
  }

  clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }
}

function getBestThreat(cell, nearbyMobiles, radius) {
  let best = null;
  let bestDistSq = radius * radius;

  for (const other of nearbyMobiles) {
    if (other === cell) continue;
    if (other.data.type !== "carnivore") continue;
    if (other.data.state !== "alive") continue;

    const dx = other.data.x - cell.data.x;
    const dy = other.data.y - cell.data.y;
    const distSq = dx * dx + dy * dy;

    if (distSq < bestDistSq) {
      best = other;
      bestDistSq = distSq;
    }
  }

  return best;
}