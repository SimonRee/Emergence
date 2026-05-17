import { Container, Graphics, RenderTexture, BlurFilter } from "pixi.js";

export function createDecomposerTextures(app, count = 30) {
  return Array.from({ length: count }, (_, i) =>
    createSingleDecomposerTexture(app, i)
  );
}

function createSingleDecomposerTexture(app, seed) {
  const size = 256;
  const c = new Container();
  const g = new Graphics();
  const center = size / 2;

  const blobCount = 3 + Math.floor(seededRandom(seed + 1) * 5);
  const sporeCount = 8 + Math.floor(seededRandom(seed + 2) * 14);

  const purple = 0x9b5cff;
  const darkPurple = 0x4b2a73;
  const palePurple = 0xdcc8ff;

  // Glow viola, ma controllato
  g.circle(center, center, 42);
  g.fill({
    color: purple,
    alpha: 0.035,
  });

  // Corpo blob con bordo più definito
  for (let i = 0; i < blobCount; i++) {
    const a = seededRandom(seed * 31 + i * 7) * Math.PI * 2;
    const r = seededRandom(seed * 53 + i * 13) * 18;
    const blobSize = 16 + seededRandom(seed + i * 3) * 18;

    const x = center + Math.cos(a) * r;
    const y = center + Math.sin(a) * r;

    g.circle(x, y, blobSize);
    g.fill({
      color: i % 2 === 0 ? purple : darkPurple,
      alpha: 0.24 + seededRandom(seed + i * 8) * 0.16,
    });

    g.circle(x, y, blobSize);
    g.stroke({
      width: 1.8,
      color: palePurple,
      alpha: 0.22,
    });
  }

  // Nucleo/scarto interno
  g.circle(
    center + randomRangeSeed(seed + 9, -8, 8),
    center + randomRangeSeed(seed + 11, -8, 8),
    9 + seededRandom(seed + 12) * 7
  );
  g.fill({
    color: 0xf0e4ff,
    alpha: 0.18,
  });

  // Spore interne viola/biancastre
  for (let i = 0; i < sporeCount; i++) {
    const a = seededRandom(seed * 61 + i * 5) * Math.PI * 2;
    const r = seededRandom(seed * 47 + i * 9) * 30;

    g.circle(
      center + Math.cos(a) * r,
      center + Math.sin(a) * r,
      1.1 + seededRandom(seed + i * 4) * 2
    );

    g.fill({
      color: palePurple,
      alpha: 0.16,
    });
  }

  // Poco blur: deve avere bordi più leggibili
  g.filters = [new BlurFilter({ strength: 0.25 })];
  c.addChild(g);

  const texture = RenderTexture.create({
    width: size,
    height: size,
    resolution: 2,
  });

  app.renderer.render({ container: c, target: texture });
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