import { Container, Graphics, RenderTexture, BlurFilter } from "pixi.js";

export function createCarnivoreTextures(app, count = 30) {
  return Array.from({ length: count }, (_, i) =>
    createSingleCarnivoreTexture(app, i)
  );
}

function createSingleCarnivoreTexture(app, seed) {
  const size = 128;
  const c = new Container();
  const g = new Graphics();
  const center = size / 2;

  const s = 18 + seededRandom(seed + 1) * 8;
  const length = s * (2.2 + seededRandom(seed + 2) * 0.35);
  const width = s * (1.0 + seededRandom(seed + 3) * 0.18);

  // Glow
  g.ellipse(center, center, length * 1.05, width * 1.55);
  g.fill({
    color: 0xff405f,
    alpha: 0.045,
  });

  // Rombo leggermente allungato con curve morbide
  g.moveTo(center - length, center);
  g.quadraticCurveTo(
    center - length * 0.35,
    center - width,
    center,
    center - width
  );
  g.quadraticCurveTo(
    center + length * 0.65,
    center - width * 0.75,
    center + length,
    center
  );
  g.quadraticCurveTo(
    center + length * 0.65,
    center + width * 0.75,
    center,
    center + width
  );
  g.quadraticCurveTo(
    center - length * 0.35,
    center + width,
    center - length,
    center
  );

  g.fill({
    color: 0xff5a72,
    alpha: 0.46,
  });

  // Bordo
  g.moveTo(center - length, center);
  g.quadraticCurveTo(
    center - length * 0.35,
    center - width,
    center,
    center - width
  );
  g.quadraticCurveTo(
    center + length * 0.65,
    center - width * 0.75,
    center + length,
    center
  );
  g.quadraticCurveTo(
    center + length * 0.65,
    center + width * 0.75,
    center,
    center + width
  );
  g.quadraticCurveTo(
    center - length * 0.35,
    center + width,
    center - length,
    center
  );

  g.stroke({
    width: 2,
    color: 0xffd4db,
    alpha: 0.52,
  });

  // Nucleo
  g.circle(center + length * 0.18, center, s * 0.45);
  g.fill({
    color: 0xffffff,
    alpha: 0.32,
  });

  // Dettagli interni minimi
  const dots = 3 + Math.floor(seededRandom(seed + 7) * 5);

  for (let i = 0; i < dots; i++) {
    const x = center + randomRangeSeed(seed + i * 11, -length * 0.35, length * 0.45);
    const y = center + randomRangeSeed(seed + i * 17, -width * 0.45, width * 0.45);

    g.circle(x, y, 1.2 + seededRandom(seed + i * 4) * 1.8);
    g.fill({
      color: 0xffe4e7,
      alpha: 0.16,
    });
  }

  g.filters = [new BlurFilter({ strength: 0.25 })];
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