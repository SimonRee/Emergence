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

let HERBIVORE_ID = 0;

export class HerbivoreSystem {
  constructor({ worldWidth, worldHeight, vegetationSystem, carnivoreSystem = null, texturePools}) {
    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;
    this.vegetationSystem = vegetationSystem;
    this.carnivoreSystem = carnivoreSystem;
    this.texturePools = texturePools;

    this.container = new Container();
    this.cells = [];

    this.maxCells = 500;
  }

  seed(count = 50) {
    for (let i = 0; i < count; i++) {
      this.createHerbivore({
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
  ? grids.mobileCellsGrid.queryRadius(d.x, d.y, 140)
  : this.cells;

applyBoids(cell, nearbyMobiles, deltaSeconds, "herbivore");

      d.age += deltaSeconds;
      d.energy -= dna.metabolism * 8 * deltaSeconds;

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
      // Se non c'è minaccia, cerca cibo
      let target = null;

if (isHungry) {
  const possibleTargets = grids.aliveVegetationGrid
    ? grids.aliveVegetationGrid.queryRadius(d.x, d.y, dna.perceptionRadius)
    : this.vegetationSystem.plants;

  target = getBestClaimableTarget({
    cell,
    targets: possibleTargets,
    now,
    maxDistance: dna.perceptionRadius,
    filterFn: (plant) =>
      plant.data.type === "vegetation" &&
      plant.data.state === "alive",
  });
}

      if (target) {
        moveToward(
          cell,
          target,
          deltaSeconds,
          this.worldWidth,
          this.worldHeight
        );

        if (isCloseEnough(cell, target, dna.size + target.data.dna.size)) {
          this.eatPlant(cell, target);
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

  createHerbivore({ x, y, parentDNA = null, dnaOverride = null }) {
    if (this.cells.length >= this.maxCells) return null;

    const baseDNA = createDNA("herbivore");

const dna = dnaOverride
  ? dnaOverride
  : parentDNA
    ? mutateDNA(parentDNA, parentDNA.mutationRate)
    : createDNA("herbivore", {
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
      id: `herbivore-${HERBIVORE_ID++}`,
      type: dna.type,
      state: dna.state,
      x,
      y,
      vx: this.randomRange(-10, 10),
      vy: this.randomRange(-10, 10),
      age: 0,
      energy: dna.energy,
      wanderAngle: Math.random() * Math.PI * 2,
      reproductionCooldown: 4 + Math.random() * 8,
      visualSeed: Math.random() * 10000,
      dna,
    };

    //this.drawHerbivore(cell);
    this.cells.push(cell);
    this.container.addChild(cell);

    return cell;
  }

  eatPlant(cell, plant) {
    const d = cell.data;
    const dna = d.dna;

    

    d.energy = Math.min(100, d.energy + plant.data.dna.energy * 0.45);

    releaseClaim(plant, cell.data.id);

    const plantIndex = this.vegetationSystem.plants.indexOf(plant);

    if (plantIndex !== -1) {
      this.vegetationSystem.turnPlantDead(plant, plantIndex);
    }

    d.reproductionCooldown -= 1;

    if (
      d.energy > 65 &&
      d.reproductionCooldown <= 0 &&
      Math.random() < this.getDynamicBirthRate()    ) {
      this.reproduce(cell);
      d.energy *= 0.65;
      d.reproductionCooldown = 8 + Math.random() * 10;
    }
  }

  reproduce(parent) {
    if (this.cells.length >= this.maxCells) return;

    const d = parent.data;
    const angle = Math.random() * Math.PI * 2;
    const distance = d.dna.spreadRadius + Math.random() * 25;

    const x = this.clamp(d.x + Math.cos(angle) * distance, 0, this.worldWidth);
    const y = this.clamp(d.y + Math.sin(angle) * distance, 0, this.worldHeight);

    this.createHerbivore({
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

const BASE_VISUAL_SCALE = 0.70; // cambia questo
cell.scale.set(BASE_VISUAL_SCALE * energyVisual * pulse);
cell.alpha = dna.opacity * (0.85 + (d.energy / 100) * 0.4); //cambia opacity in base all'energia
  }

  drawHerbivore(cell) {
    const d = cell.data;
    const dna = d.dna;
    const size = dna.size;

    cell.clear();

    // glow esterno morbido
    cell.circle(0, 0, size * 2.1);
    cell.fill({
      color: 0x5bdcff,
      alpha: 0.035 + dna.glow * 0.04,
    });

    // corpo traslucido
    cell.ellipse(0, 0, size * 1.25, size * 0.82);
    cell.fill({
      color: 0x61d7ff,
      alpha: 0.22 + dna.opacity * 0.25,
    });

    // membrana
    cell.ellipse(0, 0, size * 1.25, size * 0.82);
    cell.stroke({
      width: 1.2,
      color: 0xb7f4ff,
      alpha: 0.35,
    });

    // nucleo interno
    cell.circle(size * 0.18, 0, size * dna.nucleusSize);
    cell.fill({
      color: 0xdbfbff,
      alpha: 0.35,
    });

    // micro dettagli interni
    const dots = 3 + Math.floor(dna.internalComplexity * 6);

    for (let i = 0; i < dots; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = Math.random() * size * 0.55;

      cell.circle(Math.cos(a) * r, Math.sin(a) * r, 0.6 + Math.random());
      cell.fill({
        color: 0xeaffff,
        alpha: 0.18,
      });
    }
  }

//birth rate dinamico basato sulla popolazione attuale per evitare sovrappopolazione
getDynamicBirthRate() {
  const count = this.cells.length;

  if (count < 120) return 0.95;
  if (count < 170) return 0.65;
  if (count < 200) return 0.35;
  if (count < 230) return 0.12;

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