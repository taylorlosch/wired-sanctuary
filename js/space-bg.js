(function initSpaceBackground() {
  const container = document.getElementById('spaceBg');
  const canvas = document.getElementById('spaceCanvas');
  if (!container || !canvas) return;

  const ctx = canvas.getContext('2d');
  let width = 0;
  let height = 0;
  let dpr = 1;
  let stars = [];
  let shootingStars = [];
  let nebulae = [];
  let constellation = [];
  let frame = 0;
  let nextShooting = 180;

  const LAYER_SPEED = [0.08, 0.18, 0.32];
  const LAYER_COUNT = [220, 120, 55];
  const GOLD = 'rgba(200, 168, 74,';
  const WHITE = 'rgba(220, 215, 205,';

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    buildScene();
  }

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function buildStars(layer, count) {
    const list = [];
    for (let i = 0; i < count; i += 1) {
      const gold = Math.random() < (layer === 2 ? 0.35 : 0.08);
      list.push({
        x: Math.random() * width,
        y: Math.random() * height,
        layer,
        size: layer === 0 ? rand(0.4, 1.1) : layer === 1 ? rand(0.8, 1.8) : rand(1.2, 2.6),
        pixel: Math.random() < 0.22,
        gold,
        twinkleSpeed: rand(0.008, 0.03),
        twinklePhase: rand(0, Math.PI * 2),
        baseAlpha: rand(0.35, 0.95),
      });
    }
    return list;
  }

  function buildNebulae() {
    return [
      { x: width * 0.18, y: height * 0.72, r: width * 0.42, hue: [30, 18, 8], drift: 0.04 },
      { x: width * 0.82, y: height * 0.28, r: width * 0.35, hue: [280, 22, 10], drift: -0.03 },
      { x: width * 0.55, y: height * 0.55, r: width * 0.28, hue: [45, 14, 6], drift: 0.02 },
    ];
  }

  function buildConstellation() {
    const points = [];
    const cx = width * 0.14;
    const cy = height * 0.38;
    const angles = [0.2, 1.1, 2.0, 2.9, 3.8, 4.6];
    angles.forEach((angle, i) => {
      points.push({
        x: cx + Math.cos(angle) * rand(40, 110),
        y: cy + Math.sin(angle) * rand(30, 90),
        size: rand(1.4, 2.2),
        twinklePhase: i * 0.9,
      });
    });
    return points;
  }

  function buildScene() {
    stars = [];
    LAYER_COUNT.forEach((count, layer) => {
      stars.push(...buildStars(layer, count));
    });
    nebulae = buildNebulae();
    constellation = buildConstellation();
  }

  function spawnShootingStar() {
    const fromLeft = Math.random() < 0.6;
    shootingStars.push({
      x: fromLeft ? rand(-40, width * 0.4) : rand(width * 0.6, width + 40),
      y: rand(0, height * 0.45),
      vx: fromLeft ? rand(6, 11) : rand(-11, -6),
      vy: rand(2.5, 5.5),
      life: 0,
      maxLife: rand(38, 62),
      len: rand(48, 90),
    });
  }

  function drawNebulae(time) {
    nebulae.forEach((neb) => {
      const ox = Math.sin(time * neb.drift) * 18;
      const oy = Math.cos(time * neb.drift * 0.7) * 12;
      const [h, s, l] = neb.hue;
      const grad = ctx.createRadialGradient(
        neb.x + ox,
        neb.y + oy,
        0,
        neb.x + ox,
        neb.y + oy,
        neb.r
      );
      grad.addColorStop(0, `hsla(${h}, ${s}%, ${l + 4}%, 0.07)`);
      grad.addColorStop(0.45, `hsla(${h}, ${s}%, ${l}%, 0.035)`);
      grad.addColorStop(1, 'hsla(0, 0%, 0%, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
    });
  }

  function drawStar(star, time) {
    const twinkle = 0.55 + 0.45 * Math.sin(time * star.twinkleSpeed + star.twinklePhase);
    const alpha = star.baseAlpha * twinkle;
    const prefix = star.gold ? GOLD : WHITE;

    const driftX = (time * LAYER_SPEED[star.layer] * 12) % (width + 20);
    let x = (star.x + driftX) % (width + 20);
    if (x < -2) x += width + 20;

    ctx.fillStyle = `${prefix}${alpha})`;

    if (star.pixel) {
      const s = Math.max(2, Math.round(star.size));
      ctx.fillRect(Math.floor(x), Math.floor(star.y), s, s);
      if (star.layer > 0) {
        ctx.fillRect(Math.floor(x - s), Math.floor(star.y), s, s);
      }
    } else {
      ctx.beginPath();
      ctx.arc(x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
    }

    if (star.gold && star.layer > 0 && twinkle > 0.82) {
      ctx.fillStyle = `${GOLD}${alpha * 0.25})`;
      ctx.beginPath();
      ctx.arc(x, star.y, star.size * 3.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawConstellation(time) {
    if (constellation.length < 2) return;

    ctx.strokeStyle = `rgba(200, 168, 74, ${0.08 + 0.04 * Math.sin(time * 0.01)})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < constellation.length - 1; i += 1) {
      const a = constellation[i];
      const b = constellation[i + 1];
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
    }
    ctx.stroke();

    constellation.forEach((point) => {
      const pulse = 0.6 + 0.4 * Math.sin(time * 0.02 + point.twinklePhase);
      ctx.fillStyle = `rgba(232, 200, 120, ${0.5 * pulse})`;
      ctx.beginPath();
      ctx.arc(point.x, point.y, point.size, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawShootingStars() {
    shootingStars = shootingStars.filter((s) => {
      s.life += 1;
      s.x += s.vx;
      s.y += s.vy;

      const t = 1 - s.life / s.maxLife;
      if (t <= 0) return false;

      const tailX = s.x - s.vx * (s.len / 10);
      const tailY = s.y - s.vy * (s.len / 10);
      const grad = ctx.createLinearGradient(tailX, tailY, s.x, s.y);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0)');
      grad.addColorStop(0.6, `rgba(220, 210, 190, ${0.35 * t})`);
      grad.addColorStop(1, `rgba(255, 248, 220, ${0.9 * t})`);

      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(s.x, s.y);
      ctx.stroke();

      ctx.fillStyle = `rgba(255, 250, 230, ${t})`;
      ctx.fillRect(Math.floor(s.x), Math.floor(s.y), 2, 2);
      return true;
    });
  }

  function draw() {
    frame += 1;
    ctx.fillStyle = '#020108';
    ctx.fillRect(0, 0, width, height);

    drawNebulae(frame);

    for (let layer = 0; layer < LAYER_COUNT.length; layer += 1) {
      stars.filter((s) => s.layer === layer).forEach((star) => drawStar(star, frame));
    }

    drawConstellation(frame);
    drawShootingStars();

    if (frame >= nextShooting) {
      spawnShootingStar();
      nextShooting = frame + rand(220, 480);
      if (Math.random() < 0.25) spawnShootingStar();
    }

    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', resize);
  resize();
  requestAnimationFrame(draw);
})();
