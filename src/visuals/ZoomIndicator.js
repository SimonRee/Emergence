export class ZoomIndicator {
  constructor({ viewport, minZoom = 0.4, maxZoom = 1.0 }) {
    this.viewport = viewport;
    this.minZoom = minZoom;
    this.maxZoom = maxZoom;

    this.el = document.createElement("div");
    this.el.style.position = "fixed";
    this.el.style.left = "50%";
    this.el.style.bottom = "48px";
    this.el.style.transform = "translateX(-50%)";
    this.el.style.width = "220px";
    this.el.style.height = "6px";
    this.el.style.borderRadius = "999px";
    this.el.style.background = "rgba(255,255,255,0.12)";
    this.el.style.overflow = "hidden";
    this.el.style.zIndex = "9999";
    this.el.style.pointerEvents = "none";

    this.fill = document.createElement("div");
    this.fill.style.height = "100%";
    this.fill.style.width = "0%";
    this.fill.style.borderRadius = "999px";
    this.fill.style.background = "rgba(180,255,210,0.85)";
    this.fill.style.transition = "width 0.08s linear";

    this.el.appendChild(this.fill);
    document.body.appendChild(this.el);
  }

  update() {
    const zoom = this.viewport.scale.x;

    const t = (zoom - this.minZoom) / (this.maxZoom - this.minZoom);
    const clamped = Math.max(0, Math.min(1, t));

    this.fill.style.width = `${clamped * 100}%`;
  }
}