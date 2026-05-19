import { Container, Graphics, RenderTexture, BlurFilter } from "pixi.js";

export function createDecomposerTextures(app, count = 30) {
  return Array.from({ length: count }, (_, i) =>
    createSingleDecomposerTexture(app, i)
  );
}

function createSingleDecomposerTexture(app, seed) {
  const size = 96;
  const c = new Container();
  const g = new Graphics();
  const center = size / 2;

  const purple = 0x9b5cff;
  const darkPurple = 0x4b2a73;
  const palePurple = 0xdcc8ff;

  const bodyRadius = 22 + seededRandom(seed + 1) * 6;
  const sporeCount = 18 + Math.floor(seededRandom(seed + 2) * 22);

  // Glow esterno morbido
  g.circle(center, center, bodyRadius * 1.85);
  g.fill({
    color: purple,
    alpha: 0.055,
  });

  // Corpo unico
  g.circle(center, center, bodyRadius);
  g.fill({
    color: darkPurple,
    alpha: 0.42,
  });

  // Secondo layer interno leggermente più acceso
  g.circle(center, center, bodyRadius * 0.82);
  g.fill({
    color: purple,
    alpha: 0.22,
  });

  // Bordo/membrana
  g.circle(center, center, bodyRadius);
  g.stroke({
    width: 1.8,
    color: palePurple,
    alpha: 0.42,
  });

  // Cerchietti interni random
  for (let i = 0; i < sporeCount; i++) {
    const a = seededRandom(seed * 61 + i * 5) * Math.PI * 2;
    const r =
      Math.sqrt(seededRandom(seed * 47 + i * 9)) * bodyRadius * 0.78;

    const x = center + Math.cos(a) * r;
    const y = center + Math.sin(a) * r;

    const dotRadius = 1.1 + seededRandom(seed + i * 4) * 2.2;

    g.circle(x, y, dotRadius);
    g.fill({
      color: seededRandom(seed + i * 13) > 0.35 ? palePurple : purple,
      alpha: 0.22 + seededRandom(seed + i * 17) * 0.18,
    });

    // micro bordo del cerchietto
    g.circle(x, y, dotRadius);
    g.stroke({
      width: 0.5,
      color: palePurple,
      alpha: 0.16,
    });
  }

  // Piccolo nucleo/scarto interno, opzionale ma meno invadente
  g.circle(
    center + randomRangeSeed(seed + 90, -5, 5),
    center + randomRangeSeed(seed + 91, -5, 5),
    4 + seededRandom(seed + 92) * 3
  );
  g.fill({
    color: 0xf0e4ff,
    alpha: 0.18,
  });

  g.filters = [new BlurFilter({ strength: 0.22 })];
  c.addChild(g);

  const texture = RenderTexture.create({
    width: size,
    height: size,
    resolution: 1,
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