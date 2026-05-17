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
          <div class="tutorial-icon">✊</div>
          <p>Close your fist to generate a new species.</p>
        </div>

        <div class="tutorial-row">
          <div class="tutorial-icon">👐</div>
          <p>Use two open hands to zoom in and out.</p>
        </div>
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