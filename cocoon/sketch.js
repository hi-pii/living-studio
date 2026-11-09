
let bubbles = [];
let burstBubbles = [];
let ripples = [];

const palette = [
  [255, 105, 180],  // Pink
  [95, 180, 255],   // Blue
  [90, 235, 210],   // Cyan
  [255, 170, 75],   // Amber
  [180, 120, 255]   // Violet
];

const colorNames = [
  "PINK",
  "BLUE",
  "CYAN",
  "AMBER",
  "VIOLET"
];

// ====================================
// INFORMATION COCOON ALGORITHM
// ====================================

let clickCounts = [0, 0, 0, 0, 0];
let weights = [1, 1, 1, 1, 1];
let totalSelections = 0;
let spawnCounter = 0;

function calculateWeight(n) {
  if (n <= 0) return 1;
  return 1 + 2.574 * pow(n, 1.622);
}

function chooseColorIndex() {
  let total = weights.reduce((a, b) => a + b, 0);
  let r = random(total);

  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r < 0) return i;
  }

  return 0;
}

function getDominantIndex() {
  let best = 0;

  for (let i = 1; i < weights.length; i++) {
    if (weights[i] > weights[best]) {
      best = i;
    }
  }

  return best;
}

// ====================================
// AI HAND TRACKING
// ====================================

let video;
let handPose;
let hands = [];

let fingerX = null;
let fingerY = null;
let fingerVisible = false;

let lastPopFrame = -100;
function setup() {
  const canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent("art");
  canvas.elt.addEventListener("pointerdown", event => {
    const bounds = canvas.elt.getBoundingClientRect();
    popBubbleAt(event.clientX - bounds.left, event.clientY - bounds.top);
  });
  pixelDensity(1);
  frameRate(30);
  bindControls();
}

function gotHands(results) {
  hands = results;
  lastHandUpdate = performance.now();
}

// ====================================
// MAIN DRAW
// ====================================

function draw() {
  background(10, 12, 23);

  // Layer 1: Camera
  drawCameraBackground();

  // Layer 2: Digital atmosphere
  drawAtmosphere();
  drawAmbientDetails();

  // Generate bubbles
  spawnCounter++;

  if (spawnCounter > 23) {
    createBubble();
    spawnCounter = 0;
  }

  // Update bubbles
  for (let i = bubbles.length - 1; i >= 0; i--) {
    bubbles[i].update();

    if (bubbles[i].isOutside()) {
      bubbles.splice(i, 1);
    }
  }

  bubbles.sort((a, b) => a.depth - b.depth);

  // Layer 3: Bubbles
  for (let bubble of bubbles) {
    bubble.display();
  }

  // AI interaction
  updateFingerInteraction();

  // Layer 4: Burst particles
  for (let i = burstBubbles.length - 1; i >= 0; i--) {
    let p = burstBubbles[i];

    p.update();
    p.display();

    if (p.life <= 0) {
      burstBubbles.splice(i, 1);
    }
  }

  // Layer 5: Multiple expanding rings
  for (let i = ripples.length - 1; i >= 0; i--) {
    let ripple = ripples[i];

    ripple.update();
    ripple.display();

    if (ripple.isDead()) {
      ripples.splice(i, 1);
    }
  }

  // Layer 6: Interface
  drawFingerCursor();
  drawInterface();

  // Performance limits
  if (bubbles.length > 85) {
    bubbles.splice(0, bubbles.length - 85);
  }

  if (burstBubbles.length > 220) {
    burstBubbles.splice(
      0,
      burstBubbles.length - 220
    );
  }
}

// ====================================
// CAMERA BACKGROUND
// ====================================

function drawCameraBackground() {
  if (!video || !video.loadedmetadata) return;

  let sw = video.elt.videoWidth || 640;
  let sh = video.elt.videoHeight || 480;

  let s = max(width / sw, height / sh);

  let dw = sw * s;
  let dh = sh * s;

  let ox = (width - dw) / 2;
  let oy = (height - dh) / 2;

  // Mirrored full-screen camera
  push();

  translate(width, 0);
  scale(-1, 1);

  tint(255, 205);
  image(video, ox, oy, dw, dh);

  pop();
  noTint();

  // Cinematic dark purple overlay
  push();

  noStroke();
  fill(13, 14, 34, 90);
  rect(0, 0, width, height);

  pop();
}

// ====================================
// DYNAMIC ATMOSPHERE
// ====================================

let atmosphere = [24, 26, 49];

function drawAtmosphere() {
  let dominant = getDominantIndex();
  let c = palette[dominant];

  let strength = constrain(
    totalSelections / 14,
    0,
    1
  );

  let target = [
    lerp(24, c[0] * 0.7, strength),
    lerp(26, c[1] * 0.7, strength),
    lerp(49, c[2] * 0.7, strength)
  ];

  for (let i = 0; i < 3; i++) {
    atmosphere[i] = lerp(
      atmosphere[i],
      target[i],
      0.025
    );
  }

  let ctx = drawingContext;
  ctx.save();

  // Dark vignette
  let vignette = ctx.createRadialGradient(
    width * 0.5,
    height * 0.45,
    min(width, height) * 0.12,
    width * 0.5,
    height * 0.45,
    max(width, height) * 0.8
  );

  vignette.addColorStop(
    0,
    "rgba(0,0,0,0)"
  );

  vignette.addColorStop(
    1,
    "rgba(4,5,17,0.65)"
  );

  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);

  // Colour shifts with user preference
  let glow = ctx.createRadialGradient(
    width * 0.75,
    height * 0.42,
    0,
    width * 0.75,
    height * 0.42,
    max(width, height) * 0.72
  );

  let intensity = 0.12 + strength * 0.23;

  glow.addColorStop(
    0,
    `rgba(${atmosphere[0]},${atmosphere[1]},${atmosphere[2]},${intensity})`
  );

  glow.addColorStop(
    1,
    "rgba(0,0,0,0)"
  );

  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);

  ctx.restore();
}

// ====================================
// SUBTLE DIGITAL DETAILS
// ====================================

function drawAmbientDetails() {
  push();

  stroke(200, 210, 245, 7);
  strokeWeight(1);

  for (let x = 0; x < width; x += 70) {
    line(x, 0, x, height);
  }

  noFill();
  stroke(230, 235, 255, 19);

  rect(
    20,
    20,
    width - 40,
    height - 40,
    8
  );

  pop();
}

// ====================================
// BUBBLE GENERATION
// ====================================

function createBubble() {
  let startX = max(45, width * 0.1);
  let startY = height - 65;

  bubbles.push(
    new Bubble(
      startX + random(-18, 18),
      startY + random(-15, 15),
      chooseColorIndex(),
      feed.choose(random())
    )
  );
}

// ====================================
// USER SELECTION
// ====================================

function popBubbleAt(x, y) {
  let sorted = [...bubbles].sort(
    (a, b) => b.depth - a.depth
  );

  for (let target of sorted) {
    if (!target.contains(x, y)) continue;

    // Burst particles
    createBurst(target);

    // NEW: Concentric ripple explosion
    ripples.push(
      new Ripple(
        target.x,
        target.y,
        target.baseSize,
        target.colorIndex
      )
    );

    if (ripples.length > 32) ripples.shift();

    // Original information cocoon logic
    clickCounts[target.colorIndex]++;

    weights[target.colorIndex] =
      calculateWeight(
        clickCounts[target.colorIndex]
      );

    feed.select(target.item);
    totalSelections++;
    renderFeed();

    let index = bubbles.indexOf(target);

    if (index >= 0) {
      bubbles.splice(index, 1);
    }

    return true;
  }

  return false;
}

// ====================================
// HANDPOSE INTERACTION
// ====================================

function updateFingerInteraction() {
  fingerVisible = false;

  if (
    !video ||
    !video.loadedmetadata ||
    hands.length === 0 ||
    performance.now() - lastHandUpdate > 500
  ) {
    fingerX = null;
    fingerY = null;
    return;
  }

  let tip = hands[0].index_finger_tip;

  if (!tip) return;

  let sw = video.elt.videoWidth || 640;
  let sh = video.elt.videoHeight || 480;

  let s = max(width / sw, height / sh);

  let ox = (width - sw * s) / 2;
  let oy = (height - sh * s) / 2;

  let x = width - (ox + tip.x * s);
  let y = oy + tip.y * s;

  if (
    x < 0 || x > width ||
    y < 0 || y > height
  ) {
    return;
  }

  // Smooth finger tracking
  if (
    fingerX === null ||
    dist(x, y, fingerX, fingerY) > 110
  ) {
    fingerX = x;
    fingerY = y;
  } else {
    fingerX = lerp(fingerX, x, 0.78);
    fingerY = lerp(fingerY, y, 0.78);
  }

  fingerVisible = true;

  // Pop with a short cooldown
  if (frameCount - lastPopFrame >= 12) {
    if (popBubbleAt(fingerX, fingerY)) {
      lastPopFrame = frameCount;
    }
  }
}

// ====================================
// ELEGANT FINGER CURSOR
// ====================================

function drawFingerCursor() {
  if (!fingerVisible) return;

  push();

  noFill();

  // Outer soft glow
  stroke(255, 236, 208, 35);
  strokeWeight(8);
  circle(fingerX, fingerY, 27);

  // Delicate ring
  stroke(255, 245, 225, 165);
  strokeWeight(1.2);
  circle(fingerX, fingerY, 16);

  // Centre
  noStroke();
  fill(255, 250, 240);
  circle(fingerX, fingerY, 5);

  pop();
}

// ====================================
// NORMAL BUBBLE
// ====================================

class Bubble {
  constructor(x, y, colorIndex, item) {
    this.x = x;
    this.y = y;

    this.startX = x;
    this.startY = y;

    this.colorIndex = colorIndex;
    this.item = item;
    this.depth = random(0, 1);

    // Multiple size levels
    let t = random();

    if (t < 0.24) {
      this.baseSize = random(24, 47);
    } else if (t < 0.79) {
      this.baseSize = random(52, 95);
    } else {
      this.baseSize = random(104, 153);
    }

    this.angle =
      -PI / 4 +
      random(-PI / 5, PI / 5);

    this.startSpeed =
      lerp(1.0, 1.85, this.depth);

    this.minSpeed =
      lerp(0.16, 0.32, this.depth);

    this.phase = random(TWO_PI);
    this.rotation = random(TWO_PI);
    this.shapePhase = random(TWO_PI);
  }

  update() {
    let travelled = dist(
      this.x,
      this.y,
      this.startX,
      this.startY
    );

    let slowdown = constrain(
      travelled / 900,
      0,
      1
    );

    let speed = lerp(
      this.startSpeed,
      this.minSpeed,
      slowdown
    );

    if (
      this.x > width * 0.9 ||
      this.y < height * 0.1
    ) {
      speed += 0.3;
    }

    let wave = sin(
      frameCount * 0.014 + this.phase
    ) * 0.25;

    this.x +=
      cos(this.angle) * speed +
      cos(this.angle + HALF_PI) * wave;

    this.y +=
      sin(this.angle) * speed +
      sin(this.angle + HALF_PI) * wave;
  }

  display() {
    let c = palette[this.colorIndex];

    let deform = sin(
      frameCount * 0.013 +
      this.shapePhase
    );

    let w =
      this.baseSize *
      (1 + deform * 0.017);

    let h =
      this.baseSize *
      (1 - deform * 0.017);

    push();

    translate(this.x, this.y);
    rotate(this.rotation * 0.08);

    let ctx = drawingContext;
    ctx.save();

    // Soft glass glow
    ctx.shadowBlur = 11;

    ctx.shadowColor =
      `rgba(${c[0]},${c[1]},${c[2]},0.28)`;

    noStroke();

    fill(c[0], c[1], c[2], 12);
    ellipse(0, 0, w * 1.22, h * 1.22);

    // Main translucent body
    fill(
      c[0],
      c[1],
      c[2],
      lerp(17, 38, this.depth)
    );

    ellipse(0, 0, w, h);

    ctx.shadowBlur = 0;

    // Glass edge
    noFill();
    stroke(c[0], c[1], c[2], 62);
    strokeWeight(1.2);

    ellipse(0, 0, w * 0.97, h * 0.97);

    // Curved reflection
    stroke(255, 255, 255, 95);
    strokeWeight(max(1, w * 0.018));

    arc(
      0,
      0,
      w * 0.82,
      h * 0.82,
      PI * 1.14,
      PI * 1.68
    );

    if (this.item && w >= 45) {
      drawItem(this.item, w * 0.34);
    }

    // Highlight
    noStroke();
    fill(255, 255, 255, 34);

    ellipse(
      -w * 0.16,
      -h * 0.20,
      w * 0.16,
      h * 0.08
    );

    ctx.restore();
    pop();
  }

  contains(x, y) {
    return (
      dist(x, y, this.x, this.y) <
      this.baseSize * 0.5
    );
  }

  isOutside() {
    return (
      this.x > width + 170 ||
      this.y < -170 ||
      this.x < -170
    );
  }
}

// ====================================
// BURST PARTICLES
// ====================================

function createBurst(target) {
  let amount = floor(random(12, 19));

  for (let i = 0; i < amount; i++) {
    burstBubbles.push(
      new BurstBubble(
        target.x,
        target.y,
        target.colorIndex,
        target.baseSize
      )
    );
  }
}

class BurstBubble {
  constructor(x, y, colorIndex, parentSize) {
    this.x = x;
    this.y = y;

    this.px = x;
    this.py = y;

    this.colorIndex = colorIndex;

    let a = random(TWO_PI);
    let speed = random(1.0, 3.8);

    this.vx = cos(a) * speed;
    this.vy = sin(a) * speed;

    this.size =
      random(2, 5) *
      constrain(parentSize / 90, 0.6, 1.5);

    this.life = 255;
  }

  update() {
    this.px = this.x;
    this.py = this.y;

    this.x += this.vx;
    this.y += this.vy;

    this.vx *= 0.974;
    this.vy *= 0.974;
    this.vy += 0.012;

    this.life -= 6.5;
  }

  display() {
    let c = palette[this.colorIndex];
    let fade = max(0, this.life);

    push();

    stroke(
      c[0],
      c[1],
      c[2],
      fade * 0.65
    );

    strokeWeight(1.2);

    line(
      this.px,
      this.py,
      this.x,
      this.y
    );

    noStroke();

    fill(
      c[0],
      c[1],
      c[2],
      fade * 0.2
    );

    circle(this.x, this.y, this.size * 3);

    fill(255, 250, 245, fade);
    circle(this.x, this.y, this.size);

    pop();
  }
}

// ====================================
// MULTI-RING EXPANDING RIPPLE
// ====================================
//
// NEW EFFECT:
//
// One bubble pop creates six rings.
//
// The rings appear one after another,
// expand outward from the same centre,
// overlap, and slowly fade.
//
// This creates a flowing ripple instead
// of a single expanding circle.
// ====================================

class Ripple {
  constructor(x, y, size, colorIndex) {
    this.x = x;
    this.y = y;

    this.colorIndex = colorIndex;
    this.baseSize = size;

    this.age = 0;

    // Six concentric rings
    this.ringCount = 6;

    // Frames between ring appearances
    this.delay = 5;

    // Duration of each individual ring
    this.ringDuration = 43;

    // Maximum radius of each wave
    this.maxRadius = size * 0.45 + 35;

    this.lifeSpan =
      this.delay * (this.ringCount - 1) +
      this.ringDuration;
  }

  update() {
    this.age++;
  }

  display() {
    let c = palette[this.colorIndex];

    push();
    noFill();

    // Draw each expanding ring
    for (let i = 0; i < this.ringCount; i++) {

      // Staggered beginning
      let ringAge = this.age - i * this.delay;

      if (
        ringAge < 0 ||
        ringAge > this.ringDuration
      ) {
        continue;
      }

      let t = ringAge / this.ringDuration;

      // Smooth outward movement
      let ease =
        1 - pow(1 - t, 2.2);

      let radius =
        this.baseSize * 0.18 +
        ease * this.maxRadius;

      // Fade in, then slowly disappear
      let fadeIn = constrain(t * 7, 0, 1);
      let fadeOut = pow(1 - t, 1.25);

      let opacity = fadeIn * fadeOut;

      // Each ring has slightly different brightness
      let brightness =
        1 - i * 0.065;

      // Soft colourful halo
      stroke(
        c[0],
        c[1],
        c[2],
        30 * opacity * brightness
      );

      strokeWeight(7 * opacity + 1);

      circle(
        this.x,
        this.y,
        radius * 2
      );

      // Fine coloured main ring
      stroke(
        c[0],
        c[1],
        c[2],
        175 * opacity * brightness
      );

      strokeWeight(1.5);

      circle(
        this.x,
        this.y,
        radius * 2
      );

      // Delicate white highlight
      stroke(
        255,
        250,
        245,
        75 * opacity
      );

      strokeWeight(0.65);

      circle(
        this.x,
        this.y,
        radius * 2
      );
    }

    pop();
  }

  isDead() {
    return this.age > this.lifeSpan;
  }
}

// ====================================
// ART INTERFACE
// ====================================

function drawInterface() {
  let dominant = getDominantIndex();

  let total =
    weights.reduce((a, b) => a + b, 0);

  let share = weights[dominant] / total;

  let compact = width < 650;
  let left = compact ? 26 : 42;

  push();
  noStroke();

  // Project title
  fill(255, 245, 250, 225);

  textSize(compact ? 20 : 27);
  textStyle(NORMAL);

  text(
    "DIGITAL COCOON",
    left,
    64
  );

  // Subtitle
  fill(220, 220, 240, 165);
  textSize(10);

  text(
    "AN EXPERIMENT IN ALGORITHMIC PREFERENCE",
    left,
    86
  );

  // Instructions
  fill(235, 226, 245, 170);
  textSize(12);

  text(
    "Move your finger to select information",
    left,
    115
  );

  text(
    "Every selection shapes what appears next",
    left,
    134
  );

  // Information panel
  let panelX = left;
  let panelY = height - 153;

  let panelW = min(
    275,
    width - left * 2
  );

  fill(10, 13, 28, 155);

  rect(
    panelX - 12,
    panelY - 22,
    panelW + 24,
    86,
    9
  );

  fill(220, 225, 245, 185);
  textSize(10);

  text(
    "YOUR INFORMATION FEED",
    panelX,
    panelY
  );

  // Five colour preference bars
  let barY = panelY + 18;
  let gap = 5;

  let barW =
    (panelW - gap * 4) / 5;

  for (let i = 0; i < 5; i++) {
    let c = palette[i];

    let proportion = weights[i] / total;

    let bx =
      panelX + i * (barW + gap);

    fill(
      c[0],
      c[1],
      c[2],
      35
    );

    rect(
      bx,
      barY,
      barW,
      7,
      3
    );

    fill(
      c[0],
      c[1],
      c[2],
      215
    );

    rect(
      bx,
      barY,
      barW * proportion,
      7,
      3
    );
  }

  fill(240, 235, 245, 190);
  textSize(10);

  let info =
    totalSelections === 0
      ? "No preference established yet"
      : colorNames[dominant] +
        "  ·  " +
        round(share * 100) +
        "% of the feed";

  text(
    info,
    panelX,
    barY + 27
  );

  // Bottom-right caption
  if (!compact) {
    textAlign(RIGHT);

    fill(230, 225, 245, 125);
    textSize(10);

    text(
      "INTERACTIVE MACHINE LEARNING ART",
      width - 42,
      height - 23
    );
  }

  pop();
}

// ====================================
// RESET
// ====================================

function keyPressed() {
  if (key === "r" || key === "R") resetArtwork();
}

function resetArtwork() {
  bubbles = [];
  burstBubbles = [];
  ripples = [];

  clickCounts = [0, 0, 0, 0, 0];
  weights = [1, 1, 1, 1, 1];

  totalSelections = 0;

  atmosphere = [24, 26, 49];
  spawnCounter = 0;
  feed.reset();
  renderFeed();
}

// ====================================
// RESIZE
// ====================================

function windowResized() {
  resizeCanvas(
    windowWidth,
    windowHeight
  );

  fingerX = null;
  fingerY = null;
}

