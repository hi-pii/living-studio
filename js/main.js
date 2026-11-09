/* SHARED NAVIGATION
   Edit this list to change the navigation on all seven pages. */
const pages = [
  ['index.html', 'Home'],
  ['visual-journey.html', 'Visual Journey'],
  ['idea-presentation.html', 'Idea Presentation'],
  ['working-log.html', 'Working Log'],
  ['final-project.html', 'Final Project'],
  ['feedback.html', 'Feedback'],
  ['about.html', 'About']
];
const currentPage = location.pathname.split('/').pop() || 'index.html';
document.documentElement.classList.add('js');

document.querySelector('[data-header]').innerHTML = `
  <div class="wrap header-inner">
    <a class="brand" href="index.html">
      <span class="brand-mark" aria-hidden="true">✳</span> Living Studio
      <span style="color:var(--muted)"> /</span>
    </a>
    <button class="menu-toggle" aria-controls="main-nav" aria-expanded="false">Menu</button>
    <nav class="nav" id="main-nav" aria-label="Main navigation">
      ${pages.map(([url, label]) => `
        <a href="${url}"${currentPage === url ? ' aria-current="page"' : ''}>${label}</a>
      `).join('')}
    </nav>
  </div>`;

/* Edit the student name here to update the footer everywhere. */
document.querySelector('[data-footer]').innerHTML = `
  <div class="wrap footer-inner">
    <span>Living Studio / [Your name] · Generative AI Workflow for Media</span>
    <span>Learning in public. Making with intention. &nbsp;
      <a href="about.html#ai-use">AI use & attribution</a>
    </span>
  </div>`;

const menu = document.querySelector('.menu-toggle');
const nav = document.querySelector('#main-nav');
menu.addEventListener('click', () => {
  const open = menu.getAttribute('aria-expanded') !== 'true';
  menu.setAttribute('aria-expanded', String(open));
  nav.classList.toggle('is-open', open);
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && nav.classList.contains('is-open')) {
    nav.classList.remove('is-open');
    menu.setAttribute('aria-expanded', 'false');
    menu.focus();
  }
});

/* INFORMATION BUBBLE
   A plain Canvas prototype for the proposed p5.js project. No libraries needed.
   Only Home and Working Log have a canvas, so other pages skip this section. */
const canvas = document.querySelector('[data-bubbles]');
if (canvas) {
  const ctx = canvas.getContext('2d');
  const colors = ['#d8f397', '#b8a0e6', '#f0a684', '#8ecbd7'];
  const names = ['Lime', 'Lilac', 'Peach', 'Blue'];
  // Higher values make colours dominate faster. All colours start equally likely.
  const LEARNING_RATE = 0.35;
  let weights = [1, 1, 1, 1];
  let bubbles = [];
  let width = 500;
  let height = 380;
  let last = 0;
  let elapsed = 0;
  let paused = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const interactive = canvas.dataset.bubbles === 'interactive';
  const status = document.querySelector('[data-probabilities]');
  const pause = document.querySelector('[data-pause]');

  // Weighted random selection: each choice increases its colour's share.
  function pickColor() {
    let value = Math.random() * weights.reduce((sum, weight) => sum + weight, 0);
    for (let i = 0; i < colors.length; i++) {
      value -= weights[i];
      if (value <= 0) return i;
    }
    return colors.length - 1;
  }

  function addBubble(randomPosition = false) {
    bubbles.push({
      x: randomPosition ? width * (0.18 + Math.random() * 0.72) : width * 0.18,
      y: randomPosition ? height * (0.1 + Math.random() * 0.8) : height * 0.7,
      radius: 12 + Math.random() * 34,
      color: pickColor(),
      vx: 12 + Math.random() * 20,
      vy: -5 - Math.random() * 14
    });
  }

  // Match the drawing resolution to the available space and screen density.
  function resize() {
    const rect = canvas.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    const density = Math.min(devicePixelRatio || 1, 2);
    canvas.width = width * density;
    canvas.height = height * density;
    ctx.setTransform(density, 0, 0, density, 0, 0);
    bubbles = [];
    for (let i = 0; i < 18; i++) addBubble(true);
    draw();
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    // Wand handle and ring.
    ctx.strokeStyle = '#65715c';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(width * 0.06, height * 0.98);
    ctx.lineTo(width * 0.16, height * 0.77);
    ctx.stroke();
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(width * 0.18, height * 0.7, 24, 32, 0.45, 0, Math.PI * 2);
    ctx.stroke();

    bubbles.forEach(bubble => {
      const { x, y, radius, color } = bubble;
      const tint = colors[color];
      const gradient = ctx.createRadialGradient(
        x - radius * 0.3, y - radius * 0.3, 1, x, y, radius
      );
      gradient.addColorStop(0, tint + '0a');
      gradient.addColorStop(0.7, tint + '16');
      gradient.addColorStop(1, tint + '60');
      ctx.fillStyle = gradient;
      ctx.strokeStyle = tint + 'bb';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = tint + 'a0';
      ctx.beginPath();
      ctx.arc(x, y, radius * 0.8, 3.7, 4.7);
      ctx.stroke();
    });
  }

  function updateStatus() {
    if (status) {
      const total = weights.reduce((sum, weight) => sum + weight, 0);
      status.textContent = names.map((name, i) =>
        `${name} ${Math.round(weights[i] / total * 100)}%`
      ).join(' · ');
    }
    if (pause) pause.textContent = paused ? 'Resume motion' : 'Pause motion';
  }

  function chooseColor(color, clickedBubble = null) {
    weights[color] += LEARNING_RATE;
    // Remove the actual clicked bubble; keyboard controls remove one of that colour.
    const index = clickedBubble
      ? bubbles.indexOf(clickedBubble)
      : bubbles.findIndex(bubble => bubble.color === color);
    if (index >= 0) bubbles.splice(index, 1);
    addBubble();
    updateStatus();
    draw();
  }

  if (interactive) {
    canvas.addEventListener('click', event => {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      // Reverse order chooses the topmost bubble when circles overlap.
      const hit = [...bubbles].reverse().find(bubble =>
        Math.hypot(x - bubble.x, y - bubble.y) <= bubble.radius
      );
      if (hit) chooseColor(hit.color, hit);
    });
    document.querySelectorAll('[data-color]').forEach(button => {
      button.addEventListener('click', () => chooseColor(Number(button.dataset.color)));
    });
    document.querySelector('[data-reset]').addEventListener('click', () => {
      weights = [1, 1, 1, 1];
      resize();
      updateStatus();
    });
  }
  if (pause) pause.addEventListener('click', () => {
    paused = !paused;
    updateStatus();
  });

  // Keep motion time-based and bounded, and stop updating hidden or paused scenes.
  function frame(time) {
    const delta = Math.min((time - last) / 1000, 0.05);
    last = time;
    if (!paused && !document.hidden) {
      elapsed += delta;
      if (elapsed > 0.6) {
        addBubble();
        elapsed = 0;
      }
      bubbles.forEach(bubble => {
        bubble.x += bubble.vx * delta;
        bubble.y += bubble.vy * delta;
      });
      bubbles = bubbles.filter(bubble =>
        bubble.x - bubble.radius < width && bubble.y + bubble.radius > 0
      ).slice(-45);
      draw();
    }
    requestAnimationFrame(frame);
  }
  new ResizeObserver(resize).observe(canvas);
  updateStatus();
  requestAnimationFrame(frame);
}
