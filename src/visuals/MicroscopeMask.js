import { Graphics } from "pixi.js";

export function createMicroscopeMask(app) {
  const overlay = new Graphics();

  function draw() {
    const w = app.screen.width;
    const h = app.screen.height;

    const cx = w * 0.5;
    const cy = h * 0.5;

    // più piccolo di prima
    const radius = Math.min(w, h) * 0.42;

    overlay.clear();

    // sfondo nero
    overlay.rect(0, 0, w, h);
    overlay.fill({
      color: 0x000000,
      alpha: 1,
    });

    // foro centrale
    overlay.circle(cx, cy, radius);
    overlay.cut();

    // bordo esterno microscopio
    overlay.circle(cx, cy, radius);
    overlay.stroke({
      width: 4,
      color: 0x173327,
      alpha: 0.9,
    });

    // alone esterno
    overlay.circle(cx, cy, radius + 6);
    overlay.stroke({
      width: 10,
      color: 0x4cff88,
      alpha: 0.04,
    });
  }

  draw();

  window.addEventListener("resize", draw);

  return overlay;
}