import { Container, Graphics, RenderTexture, BlurFilter } from "pixi.js";

export function createHerbivoreTextures(app, count = 30) {
  return Array.from({ length: count }, (_, i) =>
    createSingleHerbivoreTexture(app, i)
  );
}

function createSingleHerbivoreTexture(app, seed) {
  const size = 128;
  const c = new Container();
  const g = new Graphics();
  const center = size / 2;

  const bodyW = 13 + seededRandom(seed + 1) * 12;
  const bodyH = 10 + seededRandom(seed + 2) * 9;
  const dots = 4 + Math.floor(seededRandom(seed + 3) * 10);

  g.ellipse(center, center, bodyW * 1.9, bodyH * 1.7);
  g.fill({ color: 0x5bdcff, alpha: 0.055 });

  g.ellipse(center, center, bodyW, bodyH);
  g.fill({ color: 0x61d7ff, alpha: 0.42 });

  g.ellipse(center, center, bodyW, bodyH);
  g.stroke({ width: 1.5, color: 0xc8f8ff, alpha: 0.45 });

  g.circle(center + bodyW * 0.22, center - bodyH * 0.05, bodyH * 0.42);
  g.fill({ color: 0xeaffff, alpha: 0.35 });

  for (let i = 0; i < dots; i++) {
    const a = seededRandom(seed * 44 + i * 9) * Math.PI * 2;
    const r = seededRandom(seed * 19 + i * 11) * bodyH * 0.8;
    g.circle(
      center + Math.cos(a) * r,
      center + Math.sin(a) * r,
      0.8 + seededRandom(seed + i * 7) * 1.4
    );
    g.fill({ color: 0xeaffff, alpha: 0.18 });
  }

  g.filters = [new BlurFilter({ strength: 0.45 })];
  c.addChild(g);

  const texture = RenderTexture.create({ width: size, height: size, resolution: 1 });
  app.renderer.render({ container: c, target: texture });
  c.destroy({ children: true });
  return texture;
}

function seededRandom(seed) {
  const x = Math.sin(seed * 999.123) * 10000;
  return x - Math.floor(x);
}