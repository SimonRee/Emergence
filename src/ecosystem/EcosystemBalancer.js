export class EcosystemBalancer {
  constructor({
    worldWidth,
    worldHeight,
    herbivoreSystem,
    decomposerSystem,
    carnivoreSystem,
  }) {
    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;

    this.herbivoreSystem = herbivoreSystem;
    this.decomposerSystem = decomposerSystem;
    this.carnivoreSystem = carnivoreSystem;

    this.timer = 0;
    this.interval = 3; // ogni 3 secondi controlla l'equilibrio

    this.targets = {
      herbivore: {
  target: 200,
  min: 180,
  max: 230,
  emergency: 80,
  softSpawn: 12,
  emergencySpawn: 35,
},

decomposer: {
  target: 130,
  min: 110,
  max: 160,
  emergency: 50,
  softSpawn: 8,
  emergencySpawn: 25,
},

carnivore: {
  target: 40,
  min: 30,
  max: 55,
  emergency: 10,
  softSpawn: 3,
  emergencySpawn: 8,
},
    };
  }

  update(deltaSeconds) {
    this.timer += deltaSeconds;

    if (this.timer < this.interval) return;
    this.timer = 0;

    this.balanceHerbivores();
    this.balanceDecomposers();
    this.balanceCarnivores();
  }

  balanceHerbivores() {
    const count = this.herbivoreSystem.cells.length;
    const t = this.targets.herbivore;

    if (count < t.emergency) {
      this.spawnHerbivores(t.emergencySpawn);
    } else if (count < t.min) {
      this.spawnHerbivores(t.softSpawn);
    }
  }

  balanceDecomposers() {
    const count = this.decomposerSystem.cells.length;
    const t = this.targets.decomposer;

    if (count < t.emergency) {
      this.spawnDecomposers(t.emergencySpawn);
    } else if (count < t.min) {
      this.spawnDecomposers(t.softSpawn);
    }
  }

  balanceCarnivores() {
    const count = this.carnivoreSystem.cells.length;
    const t = this.targets.carnivore;

    if (count < t.emergency) {
      this.spawnCarnivores(t.emergencySpawn);
    } else if (count < t.min) {
      this.spawnCarnivores(t.softSpawn);
    }
  }

  spawnHerbivores(amount) {
    for (let i = 0; i < amount; i++) {
      this.herbivoreSystem.createHerbivore(this.randomPosition());
    }
  }

  spawnDecomposers(amount) {
    for (let i = 0; i < amount; i++) {
      this.decomposerSystem.createDecomposer(this.randomPosition());
    }
  }

  spawnCarnivores(amount) {
    for (let i = 0; i < amount; i++) {
      this.carnivoreSystem.createCarnivore(this.randomPosition());
    }
  }

  randomPosition() {
    return {
      x: Math.random() * this.worldWidth,
      y: Math.random() * this.worldHeight,
    };
  }
}