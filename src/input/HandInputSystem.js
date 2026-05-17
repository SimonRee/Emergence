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

    // Stabilizzazione pugno
    this.fistCandidateSince = null;
    this.fistHoldTime = 0.25;
    // Callback per attività rilevata (pugno o zoom)
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

    const hands = results.landmarks || [];

    if (hands.length > 0 && this.onActivity) {
  this.onActivity();
}

    this.updateHandWarmup(hands, now);

    if (!this.isHandInputAllowed(now)) {
      this.stopAllGestures();
      return;
    }

    this.handleSpawnGesture(hands, now);
    this.handleZoomGesture(hands);
  }

  updateHandWarmup(hands, now) {
    if (hands.length === 0) {
      this.handVisibleSince = null;
      this.fistCandidateSince = null;
      return;
    }

    if (this.handVisibleSince === null) {
      this.handVisibleSince = now;
      this.fistCandidateSince = null;
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

    this.isZoomActive = false;
    this.zoomStartDistance = null;
    this.zoomStartScale = null;
  }

  handleSpawnGesture(hands, now) {
    // Spawn solo con UNA mano.
    // Se ci sono due mani, priorità allo zoom.
    if (hands.length !== 1) {
      if (this.isFistActive) {
        this.userSpawnSystem.stopSpawn();
        this.isFistActive = false;
      }

      this.fistCandidateSince = null;
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

      if (fistStableEnough && !this.isFistActive) {
        this.userSpawnSystem.startSpawn();
        this.isFistActive = true;
      }
    } else {
      this.fistCandidateSince = null;

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

      const tipBelowPip = tip.y > pip.y + 0.01;
      const tipBelowMcp = tip.y > mcp.y - 0.005;

      if (tipBelowPip && tipBelowMcp) {
        folded++;
      }
    }

    return folded === 4;
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

  clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  lerp(a, b, t) {
    return a + (b - a) * t;
  }
}