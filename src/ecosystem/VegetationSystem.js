import { Container, Sprite } from "pixi.js";
import { getTextureFromPool } from "../visuals/textures/TexturePools.js";
import { createNoise2D } from "simplex-noise";
import { createDNA, mutateDNA, createDeadDNA } from "./dna/mutateDNA.js";

export class VegetationSystem {
  constructor({ worldWidth, worldHeight, texturePools }) {
    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;
    this.texturePools = texturePools;

    this.container = new Container();
    this.noise = createNoise2D();
    this.noiseTime = 0;

    this.plants = [];
    this.deadPlants = [];

    this.maxPlants = 4000;
    this.maxDeadPlants = 3000;

    this.globalSpawnTimer = 0;
  }

  update(deltaSeconds) {
    this.noiseTime += deltaSeconds * 0.025;
    this.globalSpawnTimer += deltaSeconds;

    if (this.globalSpawnTimer > 0.08) {
      this.globalSpawnTimer = 0;
      this.spawnFromFertilityMap(6);
    }

    this.updatePlants(deltaSeconds);
    this.updateDeadPlants(deltaSeconds);
  }

  getFertilityAt(x, y) {
    const scaleA = 0.0014;
    const scaleB = 0.004;

    const largeNoise = this.noise(
      x * scaleA + this.noiseTime,
      y * scaleA + this.noiseTime
    );

    const detailNoise = this.noise(
      x * scaleB - this.noiseTime * 1.7,
      y * scaleB + this.noiseTime * 1.3
    );

    const fertility = largeNoise * 0.75 + detailNoise * 0.25;
    return (fertility + 1) / 2;
  }

  spawnFromFertilityMap(attempts) {
    for (let i = 0; i < attempts; i++) {
      if (this.plants.length >= this.maxPlants) return;

      const x = Math.random() * this.worldWidth;
      const y = Math.random() * this.worldHeight;
      const fertility = this.getFertilityAt(x, y);

      const strongFertility = fertility > 0.58;
const weakRandomSpawn = fertility > 0.38 && Math.random() < 0.08;

if (strongFertility || weakRandomSpawn) {
  this.createPlant({
    x,
    y,
    fertility,
    generation: 0,
  });
}
    }
  }

  createPlant({ x, y, fertility = 0.7, generation = 0, parentDNA = null }) {
    const baseDNA = createDNA("vegetation");

const dna = parentDNA
  ? mutateDNA(parentDNA, parentDNA.mutationRate)
  : createDNA("vegetation", {
      fertility,
      size: baseDNA.size * this.randomRange(0.85, 1.15),
      life: baseDNA.life * this.randomRange(0.85, 1.15),
      reproductionRate: baseDNA.reproductionRate * this.randomRange(0.85, 1.15),
      spreadRadius: baseDNA.spreadRadius * this.randomRange(0.85, 1.15),
      textureVariant: Math.floor(Math.random() * 30),
    });

    const texture = getTextureFromPool(
  this.texturePools,
  "vegetation",
  dna.textureVariant
);

const plant = new Sprite(texture);
plant.anchor.set(0.5);
plant.position.set(x, y);
plant.rotation = Math.random() * Math.PI * 2;(x, y);

    plant.data = {
      type: dna.type,
      state: dna.state,
      x,
      y,
      age: 0,
      generation,
      spreadCooldown: 0,
      maturity: 0.25 + Math.random() * 0.25,
      visualSeed: Math.random() * 10000,
    rotationOffset: Math.random() * Math.PI * 2,
      dna,
    };


    plant.scale.set(0.1);
    plant.alpha = 0;

    this.plants.push(plant);
    this.container.addChild(plant);

    return plant;
  }

  updatePlants(deltaSeconds) {
    for (let i = this.plants.length - 1; i >= 0; i--) {
      const plant = this.plants[i];
      const d = plant.data;
      const dna = d.dna;

      d.age += deltaSeconds;
      d.spreadCooldown -= deltaSeconds;

      const lifeRatio = d.age / dna.life;
      const growthRatio = Math.min(lifeRatio / d.maturity, 1);

      const pulse =
        1 +
        Math.sin(d.age * dna.pulseSpeed + d.x * 0.01) *
          dna.pulseAmount;

      plant.scale.set(growthRatio * pulse);
      plant.alpha = Math.max(0.15, dna.opacity * (1 - lifeRatio * 0.45));

      if (
        growthRatio >= 1 &&
        d.spreadCooldown <= 0 &&
        Math.random() < dna.reproductionRate * deltaSeconds
      ) {
        this.trySpreadPlant(plant);
        d.spreadCooldown = 0.8 + Math.random() * 2.5;
      }

      if (d.age >= dna.life) {
        this.turnPlantDead(plant, i);
      }
    }
  }

  trySpreadPlant(parentPlant) {
    if (this.plants.length >= this.maxPlants) return;

    const d = parentPlant.data;
    const dna = d.dna;

    const angle = Math.random() * Math.PI * 2;
    const distance = 8 + Math.random() * dna.spreadRadius;

    const x = this.clamp(d.x + Math.cos(angle) * distance, 0, this.worldWidth);
    const y = this.clamp(d.y + Math.sin(angle) * distance, 0, this.worldHeight);

    const fertility = this.getFertilityAt(x, y);

    if (fertility < 0.48) return;
    if (this.countPlantsNear(x, y, 22) > 7) return;

    this.createPlant({
      x,
      y,
      fertility,
      generation: d.generation + 1,
      parentDNA: dna,
    });
  }

  countPlantsNear(x, y, radius) {
    let count = 0;
    const r2 = radius * radius;

    for (const plant of this.plants) {
      const dx = plant.data.x - x;
      const dy = plant.data.y - y;

      if (dx * dx + dy * dy < r2) count++;
      if (count > 7) return count;
    }

    return count;
  }

  turnPlantDead(plant, index) {
    this.plants.splice(index, 1);

    const deadDNA = createDeadDNA(plant.data.dna);

    plant.data.type = deadDNA.type;
    plant.data.state = deadDNA.state;
    plant.data.age = 0;
    plant.data.dna = {
      ...deadDNA,
      life: 300 + Math.random() * 400, //quanto rimangono vive le piante morte
    };

    plant.tint = 0x8a6b3f;
plant.alpha = 0.45;

    this.deadPlants.push(plant);

    if (this.deadPlants.length > this.maxDeadPlants) {
      const old = this.deadPlants.shift();
      this.container.removeChild(old);
      old.destroy();
    }
  }

  updateDeadPlants(deltaSeconds) {
  for (let i = this.deadPlants.length - 1; i >= 0; i--) {
    const dead = this.deadPlants[i];
    const d = dead.data;

    d.age += deltaSeconds;

    // La materia morta non scompare da sola.
    // Resta disponibile per i decompositori.
    dead.alpha = 0.45;
    dead.scale.set(0.85);
  }
}



seededRandom(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

  randomRange(min, max) {
    return min + Math.random() * (max - min);
  }

  clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }
}