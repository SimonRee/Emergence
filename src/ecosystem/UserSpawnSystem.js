import { createDNA, mutateDNA } from "./dna/mutateDNA.js";

export class UserSpawnSystem {
  constructor({
    viewport,
    herbivoreSystem,
    decomposerSystem,
    carnivoreSystem,
    enableMouseInput = true, // se non mi serve più il mouse metto false
  }) {
    this.viewport = viewport;
    this.herbivoreSystem = herbivoreSystem;
    this.decomposerSystem = decomposerSystem;
    this.carnivoreSystem = carnivoreSystem;

    this.isSpawning = false;
    this.currentSpawnType = null;
    this.currentSpawnDNA = null;

    this.spawnTimer = 0;
    this.spawnDuration = 0;

    this.spawnRate = 10; // cellule al secondo
    this.maxSpawnDuration = 5; // secondi
    this.cooldown = 30; // secondi
    this.cooldownTimer = 0;
    this.cooldownLogTimer = 0;

    if (enableMouseInput) {
      window.addEventListener("mousedown", () => this.startSpawn());
      window.addEventListener("mouseup", () => this.stopSpawn());
    }
  }

  update(deltaSeconds) {
    if (this.cooldownTimer > 0) {
  this.cooldownTimer -= deltaSeconds;

  this.cooldownLogTimer += deltaSeconds;

  if (this.cooldownLogTimer >= 1) {
    this.cooldownLogTimer = 0;

    console.log(
      `Spawn cooldown: ${this.cooldownTimer.toFixed(1)}s`
    );
  }
}

    if (!this.isSpawning) return;

    this.spawnDuration += deltaSeconds;
    this.spawnTimer += deltaSeconds;

    if (this.spawnDuration >= this.maxSpawnDuration) {
      this.stopSpawn();
      return;
    }

    const interval = 1 / this.spawnRate;

    while (this.spawnTimer >= interval) {
      this.spawnTimer -= interval;
      this.spawnOneCellAtCenter();
    }
  }

  startSpawn() {
  if (this.cooldownTimer > 0) return;

  this.currentSpawnType = this.getWeightedRandomType();
  this.currentSpawnDNA = this.createUserMutatedDNA(this.currentSpawnType);

  this.isSpawning = true;
  this.spawnTimer = 0;
  this.spawnDuration = 0;
}

  stopSpawn() {
  if (!this.isSpawning) return;

  this.isSpawning = false;
  this.currentSpawnType = null;
  this.currentSpawnDNA = null;
  this.cooldownTimer = this.cooldown;
}

  spawnOneCellAtCenter() {
    const centerScreenX = window.innerWidth / 2;
    const centerScreenY = window.innerHeight / 2;

    const worldPos = this.viewport.toWorld(centerScreenX, centerScreenY);

    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * 200; // spawn entro un cerchio di raggio 200 attorno al centro dello schermo

    const x = worldPos.x + Math.cos(angle) * radius;
    const y = worldPos.y + Math.sin(angle) * radius;

    const type = this.currentSpawnType || this.getWeightedRandomType();
    const dna = { ...this.currentSpawnDNA };

    if (type === "herbivore") {
      this.herbivoreSystem.createHerbivore({ x, y, dnaOverride: dna });
    }

    if (type === "decomposer") {
      this.decomposerSystem.createDecomposer({ x, y, dnaOverride: dna });
    }

    if (type === "carnivore") {
      this.carnivoreSystem.createCarnivore({ x, y, dnaOverride: dna });
    }
  }

  getWeightedRandomType() {
    const r = Math.random();

    if (r < 0.6) return "herbivore";
    if (r < 0.9) return "decomposer";
    return "carnivore";
  }

  createUserMutatedDNA(type) {
    const base = createDNA(type);
    const dna = mutateDNA(base, 0.22);

    dna.textureVariant = Math.floor(Math.random() * 30);

    // Un po' più forti, ma non assurde
    dna.energy = Math.min(100, dna.energy * this.randomRange(1.15, 1.35));
    dna.life = dna.life * this.randomRange(1.05, 1.25);
    dna.speed = dna.speed * this.randomRange(1.05, 1.25);
    dna.perceptionRadius = dna.perceptionRadius * this.randomRange(1.05, 1.25);

    // Colore davvero random
    dna.tintColor = this.generateRandomTint();

    return dna;
  }

  generateRandomTint() {
    return Math.floor(Math.random() * 0xffffff);
  }

  randomRange(min, max) {
    return min + Math.random() * (max - min);
  }
}