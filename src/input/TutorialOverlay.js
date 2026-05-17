import "../styles/tutorialOverlay.css";

export class TutorialOverlay {
  constructor({ inactivityTime = 60 }) {
    this.inactivityTime = inactivityTime;
    this.inactivityTimer = 0;
    this.visible = false;

    this.el = document.createElement("div");
    this.el.className = "tutorial-overlay";

    this.el.innerHTML = `
      <div class="tutorial-card">
        <h2>Interact with the ecosystem</h2>

        <div class="tutorial-row">
  <div class="tutorial-icon">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
      <path fill="currentColor" d="M200 80h-16V64a32 32 0 0 0-56-21.13a32 32 0 0 0-55.79 17.55A32 32 0 0 0 24 88v40a104 104 0 0 0 208 0v-16a32 32 0 0 0-32-32m-48-32a16 16 0 0 1 16 16v16h-32V64a16 16 0 0 1 16-16M88 64a16 16 0 0 1 32 0v40a16 16 0 0 1-32 0ZM40 88a16 16 0 0 1 32 0v16a16 16 0 0 1-32 0Zm176 40a88 88 0 0 1-175.92 3.75A31.93 31.93 0 0 0 80 125.13a31.93 31.93 0 0 0 44.58 3.35a32.2 32.2 0 0 0 11.8 11.44A47.88 47.88 0 0 0 120 176a8 8 0 0 0 16 0a32 32 0 0 1 32-32a8 8 0 0 0 0-16h-16a16 16 0 0 1-16-16V96h64a16 16 0 0 1 16 16Z"/>
    </svg>
  </div>

  <p>Close your fist to generate a new species.</p>
</div>

<div class="tutorial-row">
  <div class="tutorial-icon">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
      <path fill="currentColor" d="M162.21 24V8a6 6 0 0 1 12 0v16a6 6 0 0 1-12 0m34.93 15.25a6 6 0 0 0 8.26-2l8-13.11a6 6 0 0 0-10.26-6.25l-8 13.11a6 6 0 0 0 2 8.25m44.57 14.91a6 6 0 0 0-7.57-3.87l-15 4.85a6 6 0 0 0 1.84 11.72a5.9 5.9 0 0 0 1.84-.3l15.06-4.84a6 6 0 0 0 3.83-7.56m-26.49 44.42a78.2 78.2 0 0 1-10.35 92c-.36 1.87-.76 3.74-1.26 5.6A78.18 78.18 0 0 1 60.49 215l-35.27-61a24 24 0 0 1 20.85-36l-4.61-8a24 24 0 0 1 20.82-36L60 70a24 24 0 0 1 36.11-30.46A24.05 24.05 0 0 1 138.56 38l13.89 24a24 24 0 0 1 41.62 0ZM107.33 56L134 102a24 24 0 0 1 20.8-12l-26.65-46a12 12 0 1 0-20.82 12m-37 8l8.08 14a24 24 0 0 1 20.82-12l-8.06-14a12 12 0 0 0-22 2.91a11.9 11.9 0 0 0 1.2 9.09Zm115 79l-20.23-35a12 12 0 0 0-21.1 11.27L156.56 141a6 6 0 0 1-10.4 6l-36.51-63a12 12 0 0 0-20.82 12l26 45a6 6 0 0 1-10.4 6L72.68 92a12 12 0 0 0-20.81 12l35.23 61a6 6 0 0 1-10.41 6l-20.25-35a12 12 0 1 0-20.81 12l35.27 61A66.13 66.13 0 0 0 192 193.09a65.53 65.53 0 0 0-6.6-50.09Zm19.41-38.42L183.66 68a12 12 0 0 0-16.42-4.39A12 12 0 0 0 162.82 80l33 57a77.7 77.7 0 0 1 10.14 31.54a66.25 66.25 0 0 0-1.15-63.96Z"/>
    </svg>
  </div>

  <p>Use two open hands to zoom in and out.</p>
</div>
    `;

    document.body.appendChild(this.el);
  }

  update(deltaSeconds) {
    this.inactivityTimer += deltaSeconds;

    if (this.inactivityTimer >= this.inactivityTime) {
      this.show();
    }
  }

  registerActivity() {
    this.inactivityTimer = 0;
    this.hide();
  }

  show() {
    if (this.visible) return;
    this.visible = true;
    this.el.classList.add("is-visible");
  }

  hide() {
    if (!this.visible) return;
    this.visible = false;
    this.el.classList.remove("is-visible");
  }
}