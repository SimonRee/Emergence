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
    this.interval = 5; // ogni 5 secondi controlla l'equilibrio

    this.targets = {
      herbivore: {
  target: 130,
  min: 100,
  max: 150,
  emergency: 80,
  softSpawn: 12,
  emergencySpawn: 35,
},

decomposer: {
  target: 100,
  min: 80,
  max: 130,
  emergency: 50,
  softSpawn: 8,
  emergencySpawn: 25,
},

carnivore: {
  target: 30,
  min: 25,
  max: 40,
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

    const pos = this.smartSpawnPosition(this.herbivoreSystem.cells);

    const cell = this.herbivoreSystem.createHerbivore(pos);

    // se è nata ai bordi viene attirata verso il centro
    if (pos.fromEdge && cell) {
  cell.data.centerAttractionTimer = 6 + Math.random() * 6;
}
  }
}

  spawnDecomposers(amount) {
  for (let i = 0; i < amount; i++) {

    const pos = this.smartSpawnPosition(this.decomposerSystem.cells);

    const cell = this.decomposerSystem.createDecomposer(pos);

    if (pos.fromEdge && cell) {
  cell.data.centerAttractionTimer = 6 + Math.random() * 6;
}
  }
}

  spawnCarnivores(amount) {
  for (let i = 0; i < amount; i++) {

    const pos = this.smartSpawnPosition(this.carnivoreSystem.cells);

    const cell = this.carnivoreSystem.createCarnivore(pos);

    if (pos.fromEdge && cell) {
  cell.data.centerAttractionTimer = 6 + Math.random() * 6;
}
  }
}

  smartSpawnPosition(existingCells) {
  // se ci sono cellule simili, nasce vicino a loro
  if (existingCells.length > 0 && Math.random() < 0.75) {
    const parent =
      existingCells[Math.floor(Math.random() * existingCells.length)];

    const angle = Math.random() * Math.PI * 2;
    const distance = 80 + Math.random() * 180;

    return {
      x: this.clamp(parent.x + Math.cos(angle) * distance, 0, this.worldWidth),
      y: this.clamp(parent.y + Math.sin(angle) * distance, 0, this.worldHeight),
      fromEdge: false,
    };
  }

  // altrimenti nasce ai bordi del mondo
  return this.edgePosition();
}

edgePosition() {
  const margin = 180;
  const side = Math.floor(Math.random() * 4);

  if (side === 0) {
    return {
      x: Math.random() * this.worldWidth,
      y: Math.random() * margin,
      fromEdge: true,
    };
  }

  if (side === 1) {
    return {
      x: Math.random() * this.worldWidth,
      y: this.worldHeight - Math.random() * margin,
      fromEdge: true,
    };
  }

  if (side === 2) {
    return {
      x: Math.random() * margin,
      y: Math.random() * this.worldHeight,
      fromEdge: true,
    };
  }

  return {
    x: this.worldWidth - Math.random() * margin,
    y: Math.random() * this.worldHeight,
    fromEdge: true,
  };
}

clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
}