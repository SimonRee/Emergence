export class DebugPanel {
  constructor() {
    this.el = document.createElement("div");

    this.el.style.position = "fixed";
    this.el.style.top = "160px";
    this.el.style.left = "160px";
    this.el.style.zIndex = "9999";
    this.el.style.padding = "10px 12px";
    this.el.style.border = "1px solid rgba(120, 255, 170, 0.25)";
    this.el.style.borderRadius = "10px";
    this.el.style.background = "rgba(0, 0, 0, 0.55)";
    this.el.style.backdropFilter = "blur(8px)";
    this.el.style.color = "#b8ffc8";
    this.el.style.fontFamily = "monospace";
    this.el.style.fontSize = "12px";
    this.el.style.lineHeight = "1.5";
    this.el.style.pointerEvents = "none";
    this.el.style.minWidth = "170px";

    document.body.appendChild(this.el);

    this.frameCount = 0;
    this.fps = 0;
    this.lastTime = performance.now();
    this.updateTimer = 0;
  }

  update(deltaSeconds, stats) {
    this.frameCount++;
    this.updateTimer += deltaSeconds;

    const now = performance.now();

    if (this.updateTimer >= 0.25) {
      this.fps = Math.round(
        (this.frameCount * 1000) / (now - this.lastTime)
      );

      this.frameCount = 0;
      this.lastTime = now;
      this.updateTimer = 0;

      this.render(stats);
    }
  }

  render(stats) {
    const total =
      stats.vegetationAlive +
      stats.vegetationDead +
      stats.herbivores +
      stats.decomposers +
      stats.carnivores;

    this.el.innerHTML = `
      <strong>EMERGENCE DEBUG</strong><br/>
      FPS: ${this.fps}<br/>
      Total: ${total}<br/>
      <br/>
      Vegetation alive: ${stats.vegetationAlive}<br/>
      Vegetation dead: ${stats.vegetationDead}<br/>
      Herbivores: ${stats.herbivores}<br/>
      Decomposers: ${stats.decomposers}<br/>
      Carnivores: ${stats.carnivores}
    `;
  }
}