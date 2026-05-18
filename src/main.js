import "./styles/style.css";
import { Application, Container, Graphics } from "pixi.js";
import { Viewport } from "pixi-viewport";
import { SpatialGrid } from "./ecosystem/spatial/SpatialGrid.js";

import { DebugPanel } from "./DebugPanel.js";

import { createMicroscopeMask } from "./visuals/MicroscopeMask.js";
import { VegetationSystem } from "./ecosystem/VegetationSystem.js";
import { HerbivoreSystem } from "./ecosystem/HerbivoreSystem.js";
import { DecomposerSystem } from "./ecosystem/DecomposerSystem.js";
import { CarnivoreSystem } from "./ecosystem/CarnivoreSystem.js";

import { createTexturePools } from "./visuals/textures/TexturePools.js";
import { UserSpawnSystem } from "./ecosystem/UserSpawnSystem.js";
import { HandInputSystem } from "./input/HandInputSystem.js";

import { ZoomIndicator } from "./visuals/ZoomIndicator.js";

import { EcosystemBalancer } from "./ecosystem/EcosystemBalancer.js";

import { TutorialOverlay } from "./input/TutorialOverlay.js";


const WORLD_WIDTH = 3000;
const WORLD_HEIGHT = 3000;

const app = new Application();

await app.init({
  resizeTo: window,
  backgroundColor: 0x000000,
  antialias: false,
  resolution: window.devicePixelRatio || 0.75,
  autoDensity: true,
});

document.querySelector("#app").appendChild(app.canvas);

const texturePools = createTexturePools(app);

// ===============================
// WORLD / CAMERA
// ===============================

const viewport = new Viewport({
  screenWidth: window.innerWidth,
  screenHeight: window.innerHeight,
  worldWidth: WORLD_WIDTH,
  worldHeight: WORLD_HEIGHT,
  events: app.renderer.events,
});

app.stage.addChild(viewport);

// Posiziona la camera al centro del mondo
viewport.moveCenter(WORLD_WIDTH / 2, WORLD_HEIGHT / 2);
viewport.setZoom(0.4, true);

// Per ora abilitiamo drag e zoom, utili per testare
viewport.drag();
viewport.pinch();
viewport.wheel();
viewport.clamp({
  direction: "all",
});
viewport.clampZoom({
  minScale: 0.1, //questo qui è con il mouse me lo gestisco io, quindi lo lascio più ampio
  maxScale: 4,
});

// ===============================
// TEST WORLD BACKGROUND
// ===============================

const worldLayer = new Container();
viewport.addChild(worldLayer);



// Sfondo leggermente verdastro molto scuro
const background = new Graphics();
background.rect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
background.fill({ color: 0x020806 });
worldLayer.addChild(background);

// Griglia temporanea per capire che il mondo è grande
const grid = new Graphics();

for (let x = 0; x <= WORLD_WIDTH; x += 250) {
  grid.moveTo(x, 0);
  grid.lineTo(x, WORLD_HEIGHT);
}

for (let y = 0; y <= WORLD_HEIGHT; y += 250) {
  grid.moveTo(0, y);
  grid.lineTo(WORLD_WIDTH, y);
}

grid.stroke({
  width: 1,
  color: 0x123322,
  alpha: 0.25,
});

worldLayer.addChild(grid);

// Croce centrale di riferimento
const centerMarker = new Graphics();

centerMarker.moveTo(WORLD_WIDTH / 2 - 14, WORLD_HEIGHT / 2);
centerMarker.lineTo(WORLD_WIDTH / 2 + 14, WORLD_HEIGHT / 2);

centerMarker.moveTo(WORLD_WIDTH / 2, WORLD_HEIGHT / 2 - 14);
centerMarker.lineTo(WORLD_WIDTH / 2, WORLD_HEIGHT / 2 + 14);

centerMarker.stroke({
  width: 1,
  color: 0x66ff99,
  alpha: 0.65,
});

worldLayer.addChild(centerMarker);


// ===============================
// VEGETATION SYSTEM
// ===============================

const vegetationSystem = new VegetationSystem({
  worldWidth: WORLD_WIDTH,
  worldHeight: WORLD_HEIGHT,
  texturePools,
});

worldLayer.addChild(vegetationSystem.container);


// ===============================
// HERBIVORE SYSTEM
// ===============================
const herbivoreSystem = new HerbivoreSystem({
  worldWidth: WORLD_WIDTH,
  worldHeight: WORLD_HEIGHT,
  vegetationSystem,
  texturePools,
});

worldLayer.addChild(herbivoreSystem.container);

setTimeout(() => {
  herbivoreSystem.seed(5);
}, 30000); //le erbivore spawnano dopo 15 secondi per permettere alla vegetazione di popolarsi



// ===============================
// DECOMPOSER SYSTEM
// ===============================
const decomposerSystem = new DecomposerSystem({
  worldWidth: WORLD_WIDTH,
  worldHeight: WORLD_HEIGHT,
  vegetationSystem,
  texturePools,
});

worldLayer.addChild(decomposerSystem.container);

setTimeout(() => {
  decomposerSystem.seed(5);
}, 30000);



// ===============================
// CARNIVORE SYSTEM
// ===============================
const carnivoreSystem = new CarnivoreSystem({
  worldWidth: WORLD_WIDTH,
  worldHeight: WORLD_HEIGHT,

  herbivoreSystem,
  decomposerSystem,
  texturePools,
});
// collego carnivoreSystem a herbivoreSystem e decomposerSystem in modo che erbivori e decompositori possano "vedere" i carnivori e scappare da loro
herbivoreSystem.carnivoreSystem = carnivoreSystem;
decomposerSystem.carnivoreSystem = carnivoreSystem;

worldLayer.addChild(carnivoreSystem.container);

setTimeout(() => {
  carnivoreSystem.seed(5);
}, 30000);


// ===============================
// ECOSYSTEM BALANCER
// ===============================

const ecosystemBalancer = new EcosystemBalancer({
  worldWidth: WORLD_WIDTH,
  worldHeight: WORLD_HEIGHT,
  herbivoreSystem,
  decomposerSystem,
  carnivoreSystem,
});

// ===============================
// USER SPAWN SYSTEM
// ===============================

const userSpawnSystem = new UserSpawnSystem({
  viewport,
  herbivoreSystem,
  decomposerSystem,
  carnivoreSystem,
  enableMouseInput: true,
});

// ===============================
// ROBE MEDIA PIPE
// ===============================

const handInputSystem = new HandInputSystem({
  viewport,
  userSpawnSystem,
  minZoom: 0.4,
  maxZoom: 1.0,
  onActivity: () => tutorialOverlay.registerActivity(),
});

handInputSystem.init();

const zoomIndicator = new ZoomIndicator({
  viewport,
  minZoom: 0.4,
  maxZoom: 1.0,
});

//tutorial overlay
const tutorialOverlay = new TutorialOverlay({
  inactivityTime: 60, //tempo di inattività in secondi prima di mostrare l'overlay
});

// ===============================
// ROBE PER GRIGLIE E BOIDS
// ===============================

const aliveVegetationGrid = new SpatialGrid({
  worldWidth: WORLD_WIDTH,
  worldHeight: WORLD_HEIGHT,
  cellSize: 180,
});

const deadVegetationGrid = new SpatialGrid({
  worldWidth: WORLD_WIDTH,
  worldHeight: WORLD_HEIGHT,
  cellSize: 180,
});

const mobileCellsGrid = new SpatialGrid({
  worldWidth: WORLD_WIDTH,
  worldHeight: WORLD_HEIGHT,
  cellSize: 180,
});

//DEBUG PANEL (disattivato per la mostra, lo attivo se serve a me)
//const debugPanel = new DebugPanel();



//TICKER CHE ANIMA ROBE
let frameCount = 0;

app.ticker.add((ticker) => {

  frameCount++;

  const deltaSeconds = ticker.deltaMS / 1000;

  vegetationSystem.update(deltaSeconds);

  // aggiorna le griglie solo ogni 3 frame
  if (frameCount % 3 === 0) {

    aliveVegetationGrid.rebuild(
      vegetationSystem.plants
    );

    deadVegetationGrid.rebuild(
      vegetationSystem.deadPlants
    );

    mobileCellsGrid.rebuild([
      ...herbivoreSystem.cells,
      ...decomposerSystem.cells,
      ...carnivoreSystem.cells,
    ]);
  }

  herbivoreSystem.update(deltaSeconds, {
    aliveVegetationGrid,
    mobileCellsGrid,
  });

  decomposerSystem.update(deltaSeconds, {
    deadVegetationGrid,
    mobileCellsGrid,
  });

  carnivoreSystem.update(deltaSeconds, {
    mobileCellsGrid,
  });

  ecosystemBalancer.update(deltaSeconds);

  userSpawnSystem.update(deltaSeconds);

  handInputSystem.update();

  zoomIndicator.update();

  tutorialOverlay.update(deltaSeconds);

  //debug mostra
  /*debugPanel.update(deltaSeconds, {
    vegetationAlive: vegetationSystem.plants.length,
    vegetationDead: vegetationSystem.deadPlants.length,
    herbivores: herbivoreSystem.cells.length,
    decomposers: decomposerSystem.cells.length,
    carnivores: carnivoreSystem.cells.length,
  });*/
});

// ===============================
// MICROSCOPE OVERLAY
// ===============================

const microscopeMask = createMicroscopeMask(app);
app.stage.addChild(microscopeMask);

// ===============================
// RESIZE
// ===============================

window.addEventListener("resize", () => {
  viewport.resize(window.innerWidth, window.innerHeight, WORLD_WIDTH, WORLD_HEIGHT);
});