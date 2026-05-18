import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";

export class HandInputSystem {
  constructor({
    viewport,
    userSpawnSystem,
    minZoom = 0.27,
    maxZoom = 2.2,
    onActivity = null,
  }) {
    this.viewport = viewport;
    this.userSpawnSystem = userSpawnSystem;

    this.minZoom = minZoom;
    this.maxZoom = maxZoom;

    this.video = null;
    this.handLandmarker = null;

    this.isReady = false;
    this.lastVideoTime = -1;

    this.isFistActive = false;
    this.isZoomActive = false;

    this.zoomStartDistance = null;
    this.zoomStartScale = null;

    // Safezone gesture
    this.handVisibleSince = null;
    this.handWarmupTime = 2.0;

    // Area valida
    this.validHandMinY = 0.18;
    this.validHandMaxY = 0.70;

    // Stabilizzazione pugno
    this.fistCandidateSince = null;
    this.fistHoldTime = 0.38;

    // Cooldown spawn
    this.spawnCooldownDuration = 15;
    this.spawnCooldownStartedAt = null;
    this.spawnCooldownProgress = 0;

    // UI
    this.handUI = null;
    this.leftHandIndicator = null;
    this.rightHandIndicator = null;
    this.fistIndicator = null;
    this.fistCooldownBar = null;

    this.validHandsCount = 0;
    this.fistProgress = 0;

    this.onActivity = onActivity;
  }

  async init() {
    this.video = document.createElement("video");
    this.video.setAttribute("playsinline", "true");
    this.video.autoplay = true;
    this.video.muted = true;

    this.video.style.position = "fixed";
    this.video.style.right = "12px";
    this.video.style.bottom = "12px";
    this.video.style.width = "160px";
    this.video.style.height = "120px";
    this.video.style.opacity = "0";
    this.video.style.pointerEvents = "none";
    this.video.style.zIndex = "-1";

    document.body.appendChild(this.video);

    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: 640,
        height: 480,
        facingMode: "user",
      },
      audio: false,
    });

    this.video.srcObject = stream;
    await this.video.play();

    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    );

    this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task",
        delegate: "GPU",
      },
      runningMode: "VIDEO",
      numHands: 2,
      minHandDetectionConfidence: 0.65,
      minHandPresenceConfidence: 0.65,
      minTrackingConfidence: 0.65,
    });

    this.createHandUI();

    this.isReady = true;
    console.log("HandInputSystem ready");
  }

  update() {
    if (!this.isReady) return;
    if (!this.video || this.video.readyState < 2) return;

    if (this.video.currentTime === this.lastVideoTime) return;
    this.lastVideoTime = this.video.currentTime;

    const now = performance.now() / 1000;

    const results = this.handLandmarker.detectForVideo(
      this.video,
      performance.now()
    );

    const rawHands = results.landmarks || [];
    const hands = rawHands.filter((hand) => this.isHandInValidZone(hand));

    this.validHandsCount = hands.length;

    if (hands.length > 0 && this.onActivity) {
      this.onActivity();
    }

    this.updateHandWarmup(hands, now);

    if (!this.isHandInputAllowed(now)) {
      this.stopAllGestures();
      this.updateHandUI();
      return;
    }

    this.handleSpawnGesture(hands, now);
    this.handleZoomGesture(hands);

    this.updateHandUI();
  }

  updateHandWarmup(hands, now) {
    if (hands.length === 0) {
      this.handVisibleSince = null;
      this.fistCandidateSince = null;
      this.fistProgress = 0;
      return;
    }

    if (this.handVisibleSince === null) {
      this.handVisibleSince = now;
      this.fistCandidateSince = null;
      this.fistProgress = 0;
    }
  }

  isHandInputAllowed(now) {
    if (this.handVisibleSince === null) return false;
    return now - this.handVisibleSince >= this.handWarmupTime;
  }

  stopAllGestures() {
    if (this.isFistActive) {
      this.userSpawnSystem.stopSpawn();
      this.isFistActive = false;
    }

    this.fistCandidateSince = null;
    this.fistProgress = 0;
    this.validHandsCount = 0;

    this.isZoomActive = false;
    this.zoomStartDistance = null;
    this.zoomStartScale = null;
  }

  handleSpawnGesture(hands, now) {
    if (hands.length !== 1) {
      if (this.isFistActive) {
        this.userSpawnSystem.stopSpawn();
        this.isFistActive = false;
      }

      this.fistCandidateSince = null;
      this.fistProgress = 0;
      return;
    }

    const hand = hands[0];
    const fist = this.isFist(hand);

    if (fist) {
      if (this.fistCandidateSince === null) {
        this.fistCandidateSince = now;
      }

      const fistStableEnough =
        now - this.fistCandidateSince >= this.fistHoldTime;

      this.fistProgress = this.clamp(
        (now - this.fistCandidateSince) / this.fistHoldTime,
        0,
        1
      );

      if (fistStableEnough && !this.isFistActive) {
        this.userSpawnSystem.startSpawn();
        this.isFistActive = true;

        this.spawnCooldownStartedAt = now;
        this.spawnCooldownProgress = 1;
      }
    } else {
      this.fistCandidateSince = null;
      this.fistProgress = 0;

      if (this.isFistActive) {
        this.userSpawnSystem.stopSpawn();
        this.isFistActive = false;
      }
    }
  }

  handleZoomGesture(hands) {
    if (hands.length !== 2) {
      this.isZoomActive = false;
      this.zoomStartDistance = null;
      this.zoomStartScale = null;
      return;
    }

    const handA = hands[0];
    const handB = hands[1];

    const openA = this.isOpenPalm(handA);
    const openB = this.isOpenPalm(handB);

    if (!openA || !openB) {
      this.isZoomActive = false;
      this.zoomStartDistance = null;
      this.zoomStartScale = null;
      return;
    }

    const centerA = this.getPalmCenter(handA);
    const centerB = this.getPalmCenter(handB);

    const dx = centerA.x - centerB.x;
    const dy = centerA.y - centerB.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (!this.isZoomActive) {
      this.isZoomActive = true;
      this.zoomStartDistance = distance;
      this.zoomStartScale = this.viewport.scale.x;
      return;
    }

    const ratio = distance / this.zoomStartDistance;

    const targetScale = this.clamp(
      this.zoomStartScale * ratio,
      this.minZoom,
      this.maxZoom
    );

    const currentScale = this.viewport.scale.x;
    const smoothedScale = this.lerp(currentScale, targetScale, 0.12);

    this.viewport.setZoom(smoothedScale, true);
  }

  isHandInValidZone(hand) {
    const center = this.getPalmCenter(hand);

    return center.y >= this.validHandMinY &&
      center.y <= this.validHandMaxY;
  }

  isFist(hand) {
    const fingers = [
      { tip: 8, pip: 6, mcp: 5 },
      { tip: 12, pip: 10, mcp: 9 },
      { tip: 16, pip: 14, mcp: 13 },
      { tip: 20, pip: 18, mcp: 17 },
    ];

    let folded = 0;

    for (const finger of fingers) {
      const tip = hand[finger.tip];
      const pip = hand[finger.pip];
      const mcp = hand[finger.mcp];

      const tipBelowPip = tip.y > pip.y + 0.018;
      const tipBelowMcp = tip.y > mcp.y + 0.005;

      const fingerLength = this.distance(mcp, tip);
      const foldedEnough = fingerLength < 0.115;

      if (tipBelowPip && tipBelowMcp && foldedEnough) {
        folded++;
      }
    }

    const palmCenter = this.getPalmCenter(hand);

    const fingertipIds = [8, 12, 16, 20];
    let avgTipDistance = 0;

    for (const id of fingertipIds) {
      avgTipDistance += this.distance(hand[id], palmCenter);
    }

    avgTipDistance /= fingertipIds.length;

    const handCompactEnough = avgTipDistance < 0.14;

    return folded === 4 && handCompactEnough;
  }

  isOpenPalm(hand) {
    const tips = [8, 12, 16, 20];
    const pips = [6, 10, 14, 18];

    let extended = 0;

    for (let i = 0; i < tips.length; i++) {
      const tip = hand[tips[i]];
      const pip = hand[pips[i]];

      if (tip.y < pip.y - 0.025) {
        extended++;
      }
    }

    return extended >= 3;
  }

  getPalmCenter(hand) {
    const ids = [0, 5, 9, 13, 17];

    let x = 0;
    let y = 0;

    for (const id of ids) {
      x += hand[id].x;
      y += hand[id].y;
    }

    return {
      x: x / ids.length,
      y: y / ids.length,
    };
  }

  createHandUI() {
    const handSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 256 256">
	<path d="M0 0h256v256H0z" fill="none" />
	<path fill="currentColor" d="M188 48a27.75 27.75 0 0 0-12 2.71V44a28 28 0 0 0-54.65-8.6A28 28 0 0 0 80 60v64l-3.82-6.13a28 28 0 0 0-48.6 27.82c16 33.77 28.93 57.72 43.72 72.69C86.24 233.54 103.2 240 128 240a88.1 88.1 0 0 0 88-88V76a28 28 0 0 0-28-28m12 104a72.08 72.08 0 0 1-72 72c-20.38 0-33.51-4.88-45.33-16.85C69.44 193.74 57.26 171 41.9 138.58a6 6 0 0 0-.3-.58a12 12 0 0 1 20.79-12a2 2 0 0 0 .14.23l18.67 30A8 8 0 0 0 96 152V60a12 12 0 0 1 24 0v60a8 8 0 0 0 16 0V44a12 12 0 0 1 24 0v76a8 8 0 0 0 16 0V76a12 12 0 0 1 24 0Z" />
</svg>


    `;

    const fistSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
        <path fill="currentColor" d="M200 80h-16V64a32 32 0 0 0-56-21.13a32 32 0 0 0-55.79 17.55A32 32 0 0 0 24 88v40a104 104 0 0 0 208 0v-16a32 32 0 0 0-32-32m-48-32a16 16 0 0 1 16 16v16h-32V64a16 16 0 0 1 16-16M88 64a16 16 0 0 1 32 0v40a16 16 0 0 1-32 0ZM40 88a16 16 0 0 1 32 0v16a16 16 0 0 1-32 0Zm176 40a88 88 0 0 1-175.92 3.75A31.93 31.93 0 0 0 80 125.13a31.93 31.93 0 0 0 44.58 3.35a32.2 32.2 0 0 0 11.8 11.44A47.88 47.88 0 0 0 120 176a8 8 0 0 0 16 0a32 32 0 0 1 32-32a8 8 0 0 0 0-16h-16a16 16 0 0 1-16-16V96h64a16 16 0 0 1 16 16Z"/>
      </svg>
    `;

    this.handUI = document.createElement("div");
    this.handUI.className = "hand-gesture-ui";

    this.handUI.innerHTML = `
      <div class="hand-ui-side hand-ui-left">
        <div class="hand-icon">${handSvg}</div>
        <div class="hand-title">Zoom</div>
        <div class="hand-description">
          Move both hands apart or closer.
        </div>
      </div>

      <div class="hand-ui-side hand-ui-right">
        <div class="hand-icon">${handSvg}</div>
        <div class="hand-title">Zoom</div>
        <div class="hand-description">
          Keep both hands in the active area.
        </div>
      </div>

      <div class="fist-ui">
        <div class="fist-icon">${fistSvg}</div>
        <div class="hand-title">Spawn</div>
        <div class="hand-description">
          Hold one fist to generate a new organism.
        </div>

        <div class="fist-cooldown">
          <div class="fist-cooldown-fill"></div>
        </div>
      </div>
    `;

    document.body.appendChild(this.handUI);

    this.leftHandIndicator =
      this.handUI.querySelector(".hand-ui-left");

    this.rightHandIndicator =
      this.handUI.querySelector(".hand-ui-right");

    this.fistIndicator =
      this.handUI.querySelector(".fist-ui");

    this.fistCooldownBar =
      this.handUI.querySelector(".fist-cooldown-fill");

    const style = document.createElement("style");

    style.innerHTML = `
      .hand-gesture-ui {
        position: fixed;
        inset: 0;
        pointer-events: none;
        z-index: 50;
        font-family: Arial, sans-serif;
        color: rgba(210,255,220,0.9);
      }

      .hand-ui-side {
        position: absolute;
        top: 50%;
        width: 150px;
        transform: translateY(-50%);
        text-align: center;
        opacity: 0.5; //opacità quando è spento

        filter: drop-shadow(0 0 0 rgba(120,255,170,0));

        transition:
          opacity 0.25s ease,
          filter 0.25s ease,
          transform 0.25s ease;
      }

      .hand-ui-left {
        left: 40px;
      }

      .hand-ui-left .hand-icon svg {
  transform: scaleX(-1);
}

      .hand-ui-right {
        right: 40px;
      }

      .hand-ui-side.is-active {
        opacity: 1;

        filter:
          drop-shadow(0 0 14px rgba(120,255,170,0.85));

        transform:
          translateY(-50%) scale(1.04);
      }

      .hand-icon,
      .fist-icon {
        width: 52px;
        height: 52px;
        margin: 0 auto 10px;
      }

      .hand-icon svg,
      .fist-icon svg {
        width: 100%;
        height: 100%;
        display: block;
      }

      .hand-title {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.14em;
        margin-bottom: 6px;
      }

      .hand-description {
        font-size: 14px;
        line-height: 1.3;
        opacity: 0.72;
      }

      .fist-ui {
        position: absolute;
        right: 28px;
        bottom: 34px;
        width: 170px;
        text-align: center;
        opacity: 0.5; //opacità quando è spento

        transition:
          opacity 0.25s ease,
          filter 0.25s ease,
          transform 0.25s ease;
      }

      .fist-ui.is-active {
        opacity: 1;

        filter:
          drop-shadow(0 0 14px rgba(120,255,170,0.85));

        transform: scale(1.04);
      }

      .fist-ui.is-cooling-down {
        opacity: 0.9;
      }

      .fist-cooldown {
        margin-top: 10px;
        width: 100%;
        height: 4px;
        border-radius: 999px;

        background:
          rgba(120,255,170,0.15);

        overflow: hidden;

        opacity: 0;

        transition: opacity 0.25s ease;
      }

      .fist-ui.is-cooling-down .fist-cooldown {
        opacity: 1;
      }

      .fist-cooldown-fill {
        width: 0%;
        height: 100%;
        border-radius: 999px;

        background:
          rgba(120,255,170,0.95);

        box-shadow:
          0 0 12px rgba(120,255,170,0.9);

        transition: width 0.08s linear;
      }
    `;

    document.head.appendChild(style);
  }

  updateHandUI() {
    if (!this.handUI) return;

    const now = performance.now() / 1000;

    const hasOneHand = this.validHandsCount >= 1;
    const hasTwoHands = this.validHandsCount >= 2;

    this.leftHandIndicator?.classList.toggle(
      "is-active",
      hasOneHand
    );

    this.rightHandIndicator?.classList.toggle(
      "is-active",
      hasTwoHands
    );

    const fistActiveOrCharging =
      this.fistProgress > 0 || this.isFistActive;

    this.fistIndicator?.classList.toggle(
      "is-active",
      fistActiveOrCharging
    );

    if (this.spawnCooldownStartedAt !== null) {
      const elapsed = now - this.spawnCooldownStartedAt;

      const remaining = this.clamp(
        1 - elapsed / this.spawnCooldownDuration,
        0,
        1
      );

      this.spawnCooldownProgress = remaining;

      if (remaining <= 0) {
        this.spawnCooldownStartedAt = null;
        this.spawnCooldownProgress = 0;
      }
    }

    const cooldownVisible =
      this.spawnCooldownStartedAt !== null;

    this.fistIndicator?.classList.toggle(
      "is-cooling-down",
      cooldownVisible
    );

    if (this.fistCooldownBar) {
      this.fistCooldownBar.style.width =
        `${this.spawnCooldownProgress * 100}%`;
    }
  }

  distance(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;

    return Math.sqrt(dx * dx + dy * dy);
  }

  clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  lerp(a, b, t) {
    return a + (b - a) * t;
  }
}