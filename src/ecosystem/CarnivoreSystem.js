import { Container, Sprite } from "pixi.js";
import { getTextureFromPool } from "../visuals/textures/TexturePools.js";
import { createDNA, mutateDNA } from "./dna/mutateDNA.js";

import {
  findNearestTarget,
  moveToward,
  wander,
  isCloseEnough,
} from "./movement/steering.js";
import { applyBoids } from "./movement/boids.js";
import { getBestClaimableTarget, releaseClaim } from "./targeting/claiming.js";

let CARNIVORE_ID = 0;

export class CarnivoreSystem {
  constructor({
    worldWidth,
    worldHeight,
    herbivoreSystem,
    decomposerSystem,
    texturePools
  }) {
    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;

    this.herbivoreSystem = herbivoreSystem;
    this.decomposerSystem = decomposerSystem;
    this.texturePools = texturePools;

    this.container = new Container();
    this.cells = [];
    this.frameCount = 0;

    this.maxCells = 90;
  }

  seed(count = 12) {
    for (let i = 0; i < count; i++) {
      this.createCarnivore({
        x: Math.random() * this.worldWidth,
        y: Math.random() * this.worldHeight,
      });
    }
  }

  update(deltaSeconds, grids = {}) {
    this.frameCount++;
    const now = performance.now() / 1000;

    for (let i = this.cells.length - 1; i >= 0; i--) {
      const cell = this.cells[i];
      const d = cell.data;
      const dna = d.dna;

      const isHungry = d.energy <= dna.hungerThreshold;

      const nearbyMobiles = grids.mobileCellsGrid
  ? grids.mobileCellsGrid.queryRadius(d.x, d.y, dna.perceptionRadius)
  : [
      ...this.herbivoreSystem.cells,
      ...this.decomposerSystem.cells,
      ...this.cells,
    ];

if (this.frameCount % 5 === 0) {
  applyBoids(cell, nearbyMobiles, deltaSeconds * 5, "carnivore");
}

      d.age += deltaSeconds;
      d.energy -= dna.metabolism * 14 * deltaSeconds; //quanta energia consumano al secondo

      let target = d.target || null;


if (isHungry && this.frameCount % 8 === 0) {

  target = getBestClaimableTarget({
    cell,
    targets: nearbyMobiles,
    now,
    maxDistance: dna.perceptionRadius,
    filterFn: (target) =>
      target.data.state === "alive" &&
      (
        target.data.type === "herbivore" ||
        target.data.type === "decomposer"
      ),
  });

  d.target = target;
}

if (!isHungry) {
  d.target = null;
  target = null;
}

      if (target) {
        moveToward(
          cell,
          target,
          deltaSeconds,
          this.worldWidth,
          this.worldHeight
        );

        if (
          isCloseEnough(
            cell,
            target,
            (dna.size + target.data.dna.size) * 1.8 //quanto devono essere vicini per mangiare
          )
        ) {
          this.eatTarget(cell, target);
        }
      } else {
        wander(cell, deltaSeconds, this.worldWidth, this.worldHeight);
      }

      this.updateVisual(cell);

      if (this.frameCount % 10 === 0 && (d.age >= dna.life || d.energy <= 0)) {
        this.killCell(cell, i);
      }
    }
  }

  createCarnivore({ x, y, parentDNA = null, dnaOverride = null }) {
    if (this.cells.length >= this.maxCells) return null;

    const baseDNA = createDNA("carnivore");

const dna = dnaOverride
  ? dnaOverride
  : parentDNA
    ? mutateDNA(parentDNA, parentDNA.mutationRate)
    : createDNA("carnivore", {
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
      id: `carnivore-${CARNIVORE_ID++}`,
      type: dna.type,
      state: dna.state,

      x,
      y,

      vx: this.randomRange(-15, 15),
      vy: this.randomRange(-15, 15),

      age: 0,
      energy: dna.energy,

      wanderAngle: Math.random() * Math.PI * 2,

      reproductionCooldown: 6 + Math.random() * 12,

      visualSeed: Math.random() * 10000,

      dna,
      target: null,
    };

    //this.drawCarnivore(cell);
    this.cells.push(cell);
    this.container.addChild(cell);

    return cell;
  }

  eatTarget(cell, target) {
    const d = cell.data;
    const dna = d.dna;

    d.energy = Math.min(
      100,
      d.energy + target.data.dna.energy * 0.75
    );

    releaseClaim(target, cell.data.id);

    // uccidi preda
    this.removePrey(target);

    d.reproductionCooldown -= 1;

    if (
  this.frameCount % 30 === 0 &&
  d.energy > 70 &&
      d.reproductionCooldown <= 0 &&
      Math.random() < this.getDynamicBirthRate()
    ) {
      this.reproduce(cell);

      d.energy *= 0.6;

      d.reproductionCooldown = 10 + Math.random() * 14;
    }
  }

  removePrey(target) {
    const type = target.data.type;

    if (type === "herbivore") {
      const index =
        this.herbivoreSystem.cells.indexOf(target);

      if (index !== -1) {
        this.herbivoreSystem.cells.splice(index, 1);
        this.herbivoreSystem.container.removeChild(target);
        target.destroy();
      }
    }

    if (type === "decomposer") {
      const index =
        this.decomposerSystem.cells.indexOf(target);

      if (index !== -1) {
        this.decomposerSystem.cells.splice(index, 1);
        this.decomposerSystem.container.removeChild(target);
        target.destroy();
      }
    }
  }

  reproduce(parent) {
    if (this.cells.length >= this.maxCells) return;

    const d = parent.data;

    const angle = Math.random() * Math.PI * 2;
    const distance = d.dna.spreadRadius + Math.random() * 40;

    const x = this.clamp(
      d.x + Math.cos(angle) * distance,
      0,
      this.worldWidth
    );

    const y = this.clamp(
      d.y + Math.sin(angle) * distance,
      0,
      this.worldHeight
    );

    this.createCarnivore({
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

const BASE_VISUAL_SCALE = 0.45; // cambia questo
cell.scale.set(BASE_VISUAL_SCALE * energyVisual * pulse);
cell.alpha = dna.opacity * (0.85 + (d.energy / 100) * 0.4); //cambia opacity in base all'energia
  }

  drawCarnivore(cell) {
    const d = cell.data;
    const dna = d.dna;

    const size = dna.size;

    cell.clear();

    // glow rosso aggressivo
    cell.circle(0, 0, size * 2.5);
    cell.fill({
      color: 0xff445e,
      alpha: 0.03 + dna.glow * 0.05,
    });

    // corpo appuntito
    cell.poly([
      -size * 1.4, 0,
      0, -size * 0.9,
      size * 1.6, 0,
      0, size * 0.9,
    ]);

    cell.fill({
      color: 0xff5a72,
      alpha: 0.22 + dna.opacity * 0.24,
    });

    // bordo
    cell.poly([
      -size * 1.4, 0,
      0, -size * 0.9,
      size * 1.6, 0,
      0, size * 0.9,
    ]);

    cell.stroke({
      width: 1.2,
      color: 0xffd4db,
      alpha: 0.35,
    });

    // nucleo
    cell.circle(size * 0.25, 0, size * 0.32);

    cell.fill({
      color: 0xffffff,
      alpha: 0.35,
    });

    // dettagli interni
    const spikes =
      3 + Math.floor(dna.internalComplexity * 7);

    for (let i = 0; i < spikes; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = Math.random() * size * 0.75;

      cell.circle(
        Math.cos(a) * r,
        Math.sin(a) * r,
        0.6 + Math.random()
      );

      cell.fill({
        color: 0xffe4e7,
        alpha: 0.16,
      });
    }
  }

// Regola dinamica per il tasso di nascita in base alla popolazione attuale
getDynamicBirthRate() {
  const count = this.cells.length;

  if (count < 12) return 0.95;
  if (count < 25) return 0.7;
  if (count < 40) return 0.38;
  if (count < 55) return 0.12;

  return 0.01;
}

  randomRange(min, max) {
    return min + Math.random() * (max - min);
  }

  clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }
}