/**
 * Wavex — Visual Engine
 * WebGL Particles · Mouse Parallax · Micro-interactions
 */

(function() {
'use strict';

// ════════════════════════════════════════════════
//  PARTICLES ENGINE (Canvas 2D — max compatibility)
// ════════════════════════════════════════════════

const canvas  = document.getElementById('particles-canvas');
if (!canvas) return;
const ctx     = canvas.getContext('2d');
let W = 0, H = 0;
let mouse     = { x: -9999, y: -9999 };
let raf       = null;
let particles = [];
let connections = [];

// Config
const CFG = {
  count:       80,
  maxDist:     140,
  speed:       0.35,
  minR:        1,
  maxR:        2.8,
  colors:      ['#6ee7f7', '#a78bfa', '#f472b6', '#34d399', '#fb923c'],
  mouseRadius: 120,
  mouseForce:  0.04,
};

function resize() {
  W = canvas.width  = window.innerWidth;
  H = canvas.height = window.innerHeight;
}

function Particle() {
  this.x  = Math.random() * W;
  this.y  = Math.random() * H;
  this.vx = (Math.random() - 0.5) * CFG.speed;
  this.vy = (Math.random() - 0.5) * CFG.speed;
  this.r  = CFG.minR + Math.random() * (CFG.maxR - CFG.minR);
  this.color = CFG.colors[Math.floor(Math.random() * CFG.colors.length)];
  this.alpha = 0.3 + Math.random() * 0.5;
  this.baseAlpha = this.alpha;
  this.pulse = Math.random() * Math.PI * 2;
  this.pulseSpeed = 0.02 + Math.random() * 0.02;
}

Particle.prototype.update = function() {
  // Mouse repulsion
  const dx = this.x - mouse.x;
  const dy = this.y - mouse.y;
  const dist = Math.sqrt(dx*dx + dy*dy);
  if (dist < CFG.mouseRadius) {
    const force = (CFG.mouseRadius - dist) / CFG.mouseRadius * CFG.mouseForce;
    this.vx += (dx / dist) * force;
    this.vy += (dy / dist) * force;
  }

  // Damping
  this.vx *= 0.995;
  this.vy *= 0.995;

  // Speed clamp
  const spd = Math.sqrt(this.vx*this.vx + this.vy*this.vy);
  if (spd > CFG.speed * 3) {
    this.vx = (this.vx/spd) * CFG.speed * 3;
    this.vy = (this.vy/spd) * CFG.speed * 3;
  }

  this.x += this.vx;
  this.y += this.vy;

  // Wrap
  if (this.x < -10) this.x = W + 10;
  if (this.x > W+10) this.x = -10;
  if (this.y < -10) this.y = H + 10;
  if (this.y > H+10) this.y = -10;

  // Pulse alpha
  this.pulse += this.pulseSpeed;
  this.alpha = this.baseAlpha * (0.8 + 0.2 * Math.sin(this.pulse));
};

Particle.prototype.draw = function() {
  ctx.beginPath();
  ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
  ctx.fillStyle = this.color;
  ctx.globalAlpha = this.alpha;
  ctx.fill();
};

function drawConnections() {
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const a = particles[i], b = particles[j];
      const dx = a.x - b.x, dy = a.y - b.y;
      const d = Math.sqrt(dx*dx + dy*dy);
      if (d < CFG.maxDist) {
        const alpha = (1 - d / CFG.maxDist) * 0.18;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        // Gradient line color
        const grad = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
        grad.addColorStop(0, a.color);
        grad.addColorStop(1, b.color);
        ctx.strokeStyle = grad;
        ctx.globalAlpha = alpha;
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }
    }
  }
}

function frame() {
  ctx.clearRect(0, 0, W, H);
  ctx.globalAlpha = 1;

  drawConnections();

  particles.forEach(p => {
    p.update();
    p.draw();
  });

  ctx.globalAlpha = 1;
  raf = requestAnimationFrame(frame);
}

function init() {
  resize();
  particles = Array.from({ length: CFG.count }, () => new Particle());
  if (raf) cancelAnimationFrame(raf);
  frame();
}

window.addEventListener('resize', () => { resize(); });
window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
window.addEventListener('mouseleave', () => { mouse.x = -9999; mouse.y = -9999; });

// Touch support
window.addEventListener('touchmove', e => {
  if (e.touches[0]) { mouse.x = e.touches[0].clientX; mouse.y = e.touches[0].clientY; }
}, { passive: true });

// Lazy start — don't drain battery when hidden
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { cancelAnimationFrame(raf); raf = null; }
  else if (!raf) frame();
});

// Start after DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  // Slight delay so the app loads first
  setTimeout(init, 200);
}


// ════════════════════════════════════════════════
//  MOUSE PARALLAX — orbs follow mouse gently
// ════════════════════════════════════════════════

(function initParallax() {
  const orbs = [
    { el: document.getElementById('orb1'), depth: 0.015 },
    { el: document.getElementById('orb2'), depth: 0.010 },
    { el: document.getElementById('orb3'), depth: 0.020 },
    { el: document.getElementById('orb4'), depth: 0.012 },
    { el: document.getElementById('orb5'), depth: 0.025 },
  ].filter(o => o.el);

  let cx = window.innerWidth  / 2;
  let cy = window.innerHeight / 2;
  let tx = cx, ty = cy;
  let curX = cx, curY = cy;

  window.addEventListener('mousemove', e => { tx = e.clientX; ty = e.clientY; });

  function parallaxFrame() {
    // Smooth lerp
    curX += (tx - curX) * 0.06;
    curY += (ty - curY) * 0.06;

    const offX = curX - cx;
    const offY = curY - cy;

    orbs.forEach(({ el, depth }) => {
      el.style.transform = `translate(${offX * depth * 100}px, ${offY * depth * 100}px)`;
    });

    requestAnimationFrame(parallaxFrame);
  }

  // Only on desktop
  if (window.matchMedia('(hover:hover)').matches) {
    parallaxFrame();
  }
})();


// ════════════════════════════════════════════════
//  MICRO-INTERACTIONS
// ════════════════════════════════════════════════

// Ripple effect on any .ripple-target
document.addEventListener('click', function(e) {
  const btn = e.target.closest('.btn-primary,.btn-post,.action-btn,.nav-item,.btn-follow,.media-btn');
  if (!btn) return;

  const rect   = btn.getBoundingClientRect();
  const ripple = document.createElement('span');
  const size   = Math.max(rect.width, rect.height) * 2;
  const x      = e.clientX - rect.left - size/2;
  const y      = e.clientY - rect.top  - size/2;

  Object.assign(ripple.style, {
    position:     'absolute',
    width:        size + 'px',
    height:       size + 'px',
    left:         x + 'px',
    top:          y + 'px',
    borderRadius: '50%',
    background:   'rgba(255,255,255,0.18)',
    transform:    'scale(0)',
    animation:    'ripple 0.55s cubic-bezier(.16,1,.3,1) forwards',
    pointerEvents:'none',
    zIndex:       '999',
  });

  // Make btn relative if needed
  const pos = getComputedStyle(btn).position;
  if (pos === 'static') btn.style.position = 'relative';
  btn.style.overflow = 'hidden';
  btn.appendChild(ripple);
  setTimeout(() => ripple.remove(), 600);
}, true);


// ════════════════════════════════════════════════
//  SCROLL REVEAL — post cards
// ════════════════════════════════════════════════

if ('IntersectionObserver' in window) {
  const revealObs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.style.animation = 'cardIn 0.5s cubic-bezier(0.16,1,0.3,1) both';
        revealObs.unobserve(e.target);
      }
    });
  }, { threshold: 0.08 });

  // Observe new post cards as they're added
  const feedObs = new MutationObserver(mutations => {
    mutations.forEach(m => {
      m.addedNodes.forEach(node => {
        if (node.classList?.contains('post-card')) {
          node.style.opacity = '0';
          revealObs.observe(node);
        }
      });
    });
  });

  const feedEl = document.getElementById('posts-container');
  if (feedEl) feedObs.observe(feedEl, { childList: true });
}


// ════════════════════════════════════════════════
//  LOADING SKELETON — shimmer while posts load
// ════════════════════════════════════════════════

window.showSkeletons = function(containerId, count = 3) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = Array.from({ length: count }, () => `
    <div class="skeleton-card glass-card">
      <div class="sk-row">
        <div class="skeleton sk-avatar"></div>
        <div style="flex:1">
          <div class="skeleton sk-line" style="width:45%;height:12px"></div>
          <div class="skeleton sk-line" style="width:28%;height:9px;margin-top:5px"></div>
        </div>
      </div>
      <div class="skeleton sk-line" style="width:90%;height:11px;margin-top:14px"></div>
      <div class="skeleton sk-line" style="width:75%;height:11px;margin-top:7px"></div>
      <div class="skeleton sk-line" style="width:55%;height:11px;margin-top:7px"></div>
      <div class="skeleton sk-actions">
        <div class="skeleton sk-btn"></div>
        <div class="skeleton sk-btn"></div>
        <div class="skeleton sk-btn"></div>
      </div>
    </div>
  `).join('');
};


// ════════════════════════════════════════════════
//  ELECTRON INTEGRATION
// ════════════════════════════════════════════════

if (window.electronAPI) {
  // Override web notifications with native Electron ones
  const origFireNotif = window.fireNotif;
  if (origFireNotif) {
    window.fireNotif = function(title, body, icon) {
      origFireNotif(title, body, icon);
      window.electronAPI.showNotification(title, body, icon);
    };
  }
}

})();
