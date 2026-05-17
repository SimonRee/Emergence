import { Graphics, RenderTexture, Container, BlurFilter } from "pixi.js";

export function createVegetationTextures(app, count = 30) {
  const textures = [];

  for (let i = 0; i < count; i++) {
    textures.push(createSingleVegetationTexture(app, i));
  }

  return textures;
}

function createSingleVegetationTexture(app, seed) {
  const size = 128;
  const c = new Container();

  const g = new Graphics();

  const center = size / 2;
  const baseRadius = 10 + seededRandom(seed + 1) * 10;
  const colonyRadius = 22 + seededRandom(seed + 2) * 20;

  const blobCount = 6 + Math.floor(seededRandom(seed + 3) * 8);
  const branchCount = 4 + Math.floor(seededRandom(seed + 4) * 8);
  const sporeCount = 10 + Math.floor(seededRandom(seed + 5) * 22);

  const green = 0x6dff8a;
  const pale = 0xd2ffad;
  const dark = 0x245f35;

  // Massa morbida irregolare
  for (let i = 0; i < blobCount; i++) {
    const a = seededRandom(seed * 20 + i * 11) * Math.PI * 2;
    const r = seededRandom(seed * 30 + i * 17) * colonyRadius * 0.8;

    const x = center + Math.cos(a) * r;
    const y = center + Math.sin(a) * r;

    const blobSize = baseRadius * (0.7 + seededRandom(seed + i * 9) * 1.7);

    g.circle(x, y, blobSize);
    g.fill({
      color: green,
      alpha: 0.055 + seededRandom(seed + i * 3) * 0.055,
    });
  }

  // Zone interne più scure
  for (let i = 0; i < blobCount; i++) {
    const a = seededRandom(seed * 41 + i * 13) * Math.PI * 2;
    const r = seededRandom(seed * 51 + i * 19) * colonyRadius * 0.55;

    g.circle(
      center + Math.cos(a) * r,
      center + Math.sin(a) * r,
      baseRadius * (0.3 + seededRandom(seed + i * 7) * 0.65)
    );

    g.fill({
      color: dark,
      alpha: 0.04,
    });
  }

  // Filamenti morbidi / lichene
  for (let i = 0; i < branchCount; i++) {
    const a = seededRandom(seed * 100 + i * 14.3) * Math.PI * 2;
    const startR = seededRandom(seed * 20 + i * 5.1) * colonyRadius * 0.35;

    const x = center + Math.cos(a) * startR;
    const y = center + Math.sin(a) * startR;

    const length = 10 + seededRandom(seed + i * 18.2) * 20;
    const endA = a + randomRangeSeed(seed + i * 25.1, -0.45, 0.45);

    const endX = x + Math.cos(endA) * length;
    const endY = y + Math.sin(endA) * length;

    const cx = (x + endX) / 2 + randomRangeSeed(seed + i * 4.2, -8, 8);
    const cy = (y + endY) / 2 + randomRangeSeed(seed + i * 6.7, -8, 8);

    g.moveTo(x, y);
    g.quadraticCurveTo(cx, cy, endX, endY);
    g.stroke({
      width: 0.8 + seededRandom(seed + i * 2.9) * 1.6,
      color: pale,
      alpha: 0.08 + seededRandom(seed + i * 8.4) * 0.12,
    });
  }

  // Spore
  for (let i = 0; i < sporeCount; i++) {
    const a = seededRandom(seed * 61 + i * 7.7) * Math.PI * 2;
    const r = seededRandom(seed * 71 + i * 9.2) * colonyRadius;

    g.circle(
      center + Math.cos(a) * r,
      center + Math.sin(a) * r,
      0.7 + seededRandom(seed + i * 12.8) * 1.4
    );

    g.fill({
      color: pale,
      alpha: 0.08 + seededRandom(seed + i * 3.4) * 0.15,
    });
  }

  // Blur leggero per renderlo più microscopico/morbido
  g.filters = [new BlurFilter({ strength: 0.8 })];

  c.addChild(g);

  const texture = RenderTexture.create({
    width: size,
    height: size,
    resolution: 1,
  });

  app.renderer.render({
    container: c,
    target: texture,
  });

  c.destroy({ children: true });

  return texture;
}

function seededRandom(seed) {
  const x = Math.sin(seed * 999.123) * 10000;
  return x - Math.floor(x);
}

function randomRangeSeed(seed, min, max) {
  return min + seededRandom(seed) * (max - min);
}