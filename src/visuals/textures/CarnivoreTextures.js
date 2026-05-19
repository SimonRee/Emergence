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

  // Piccoli triangoli arrotondati interni
const triangles = 2 + Math.floor(seededRandom(seed + 7) * 4); // 2–5

for (let i = 0; i < triangles; i++) {
  const x = center + randomRangeSeed(seed + i * 11, -length * 0.42, length * 0.48);
  const y = center + randomRangeSeed(seed + i * 17, -width * 0.48, width * 0.48);

  const r = 3.2 + seededRandom(seed + i * 4) * 3.2;
  const rot = seededRandom(seed + i * 23) * Math.PI * 2;

  drawRoundedTriangle(g, x, y, r, rot, r * 0.38);

  g.fill({
    color: 0xffe4e7,
    alpha: 0.18,
  });

  drawRoundedTriangle(g, x, y, r, rot, r * 0.38);

  g.stroke({
    width: 0.7,
    color: 0xffd4db,
    alpha: 0.2,
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

function drawRoundedTriangle(g, x, y, radius, rotation = 0, cornerRadius = 2) {
  const points = [];

  for (let i = 0; i < 3; i++) {
    const a = rotation + i * (Math.PI * 2) / 3;

    points.push({
      x: x + Math.cos(a) * radius,
      y: y + Math.sin(a) * radius,
    });
  }

  drawRoundedPath(g, points, cornerRadius);
}

function drawRoundedPath(g, points, radius) {
  const len = points.length;

  for (let i = 0; i < len; i++) {
    const prev = points[(i - 1 + len) % len];
    const curr = points[i];
    const next = points[(i + 1) % len];

    const v1 = normalize(prev.x - curr.x, prev.y - curr.y);
    const v2 = normalize(next.x - curr.x, next.y - curr.y);

    const p1 = {
      x: curr.x + v1.x * radius,
      y: curr.y + v1.y * radius,
    };

    const p2 = {
      x: curr.x + v2.x * radius,
      y: curr.y + v2.y * radius,
    };

    if (i === 0) {
      g.moveTo(p1.x, p1.y);
    } else {
      g.lineTo(p1.x, p1.y);
    }

    g.quadraticCurveTo(curr.x, curr.y, p2.x, p2.y);
  }

  g.closePath();
}

function normalize(x, y) {
  const length = Math.sqrt(x * x + y * y) || 1;

  return {
    x: x / length,
    y: y / length,
  };
}

function seededRandom(seed) {
  const x = Math.sin(seed * 999.123) * 10000;
  return x - Math.floor(x);
}

function randomRangeSeed(seed, min, max) {
  return min + seededRandom(seed) * (max - min);
}