const SKILL_CD = 32;
const GRAVITY = 2100;
const JUMP_VELOCITY = 620;
const START_SPEED = 240;
const MAX_SPEED = 500;
// 密度倍率：前 30 秒保持基础密度，之后按下滑块速率线性增长，最高 3 倍
const DENSITY_HOLD = 30;
const DENSITY_STEP = 10;
const DENSITY_CAP = 3;

interface Obstacle {
  kind: 'spike' | 'hang';
  x: number;
  w: number;
  h: number;
}

type Phase = 'ready' | 'run' | 'over';

export interface FrogRunner {
  open: () => void;
  close: () => void;
}

export function initRunner(): FrogRunner {
  const layer = document.querySelector<HTMLElement>('[data-run-layer]');
  const stage = document.querySelector<HTMLElement>('[data-run-stage]');
  const canvas = document.querySelector<HTMLCanvasElement>('[data-run-canvas]');
  const overlay = document.querySelector<HTMLElement>('[data-run-overlay]');
  const tipEl = document.querySelector<HTMLElement>('[data-run-tip]');
  const startButton = document.querySelector<HTMLButtonElement>('[data-run-start]');
  const statusEl = document.querySelector<HTMLElement>('[data-run-status]');
  const scoreEl = document.querySelector<HTMLElement>('[data-run-score]');
  const bestEl = document.querySelector<HTMLElement>('[data-run-best]');
  const skillButton = document.querySelector<HTMLButtonElement>('[data-run-skill]');
  const coolEl = document.querySelector<HTMLElement>('[data-run-cool]');
  const soulLine = document.querySelector<HTMLElement>('[data-run-line]');
  const densityRange = document.querySelector<HTMLInputElement>('[data-run-density]');
  const densityValue = document.querySelector<HTMLElement>('[data-run-density-value]');

  const empty: FrogRunner = { open: () => {}, close: () => {} };
  if (!layer || !stage || !canvas || !overlay) return empty;

  const ctx = canvas.getContext('2d');
  if (!ctx) return empty;

  const frog = new Image();
  frog.src = '/media/frog.png';

  let W = 0;
  let H = 0;
  let groundY = 0;
  let playerX = 90;
  let motes: { x: number; y: number; r: number; s: number; a: number }[] = [];

  let active = false;
  let phase: Phase = 'ready';
  let obstacles: Obstacle[] = [];
  let distance = 0;
  let best = 0;
  let speed = START_SPEED;
  let elapsed = 0;
  let spawnIn = 1;
  let skillLeft = 0;
  let flash = 0;
  let clock = 0;
  let densityRate = densityRange ? Number(densityRange.value) : 12;

  const player = { y: 0, vy: 0, onGround: true, duck: false };

  let raf = 0;
  let lastTs = 0;
  let soulTimer = 0;
  let lastCool = -1;
  let lastMeters = -1;

  const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

  const setDensityFill = (): void => {
    if (!densityRange) return;
    const min = Number(densityRange.min);
    const max = Number(densityRange.max);
    const ratio = max > min ? (Number(densityRange.value) - min) / (max - min) : 0;
    densityRange.style.setProperty('--p', `${ratio * 100}%`);
  };

  const syncDensity = (): void => {
    if (!densityRange) return;
    densityRate = Number(densityRange.value);
    if (densityValue) densityValue.textContent = `+${densityRate}%`;
    setDensityFill();
  };

  // elapsed 为秒；30 秒内恒为 1 倍，之后每 10 秒按滑块百分比线性叠加，封顶 DENSITY_CAP
  const densityFactor = (): number => {
    const rise = Math.max(0, elapsed - DENSITY_HOLD) / DENSITY_STEP;
    return clamp(1 + rise * (densityRate / 100), 1, DENSITY_CAP);
  };

  const setStatus = (text: string): void => {
    if (statusEl) statusEl.textContent = text;
  };

  const resize = (): void => {
    // 以 canvas 自身的内容盒为基准：stage 的上下边框会让两者相差 2px，
    // 直接用 stage 尺寸会让画布被轻微纵向拉伸，移动时看起来发虚。
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = rect.width;
    H = rect.height;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    groundY = H - Math.max(34, H * 0.12);
    playerX = clamp(W * 0.13, 70, 118);

    motes = Array.from({ length: 18 }, () => ({
      x: Math.random() * W,
      y: 20 + Math.random() * Math.max(20, groundY - 40),
      r: 0.5 + Math.random() * 1.2,
      s: 4 + Math.random() * 8,
      a: 0.05 + Math.random() * 0.14,
    }));
  };

  const speak = (): void => {
    if (!soulLine) return;
    soulLine.classList.add('is-saying');
    window.clearTimeout(soulTimer);
    soulTimer = window.setTimeout(() => soulLine.classList.remove('is-saying'), 3000);
  };

  const syncSkill = (): void => {
    if (!skillButton) return;
    const cooling = skillLeft > 0;
    skillButton.classList.toggle('is-cooling', cooling);
    skillButton.classList.toggle('is-locked', phase !== 'run');
    skillButton.setAttribute('aria-disabled', String(phase !== 'run' || cooling));
    if (coolEl) coolEl.textContent = cooling ? String(Math.ceil(skillLeft)) : '';
    lastCool = cooling ? Math.ceil(skillLeft) : 0;
  };

  const resetRun = (): void => {
    phase = 'ready';
    obstacles = [];
    distance = 0;
    speed = START_SPEED;
    elapsed = 0;
    spawnIn = 0.9;
    skillLeft = 0;
    flash = 0;
    player.y = 0;
    player.vy = 0;
    player.onGround = true;
    player.duck = false;

    overlay.classList.remove('is-hidden');
    if (tipEl) tipEl.textContent = '空格起跳 · Shift 下蹲 · 小心尖刺与倒刺';
    if (startButton) {
      startButton.textContent = '开始奔跑';
      startButton.blur();
    }
    if (scoreEl) scoreEl.textContent = '0 m';
    setStatus('阿呆蛙在岸边热身，空格开始。');
    syncSkill();
    lastMeters = 0;
  };

  const start = (): void => {
    phase = 'run';
    obstacles = [];
    distance = 0;
    speed = START_SPEED;
    elapsed = 0;
    spawnIn = 0.85;
    skillLeft = 0;
    flash = 0;
    player.y = 0;
    player.vy = 0;
    player.onGround = true;
    player.duck = false;

    overlay.classList.add('is-hidden');
    startButton?.blur();
    if (scoreEl) scoreEl.textContent = '0 m';
    setStatus('尖刺来了，别眨眼。');
    syncSkill();
    lastMeters = 0;
  };

  const gameOver = (kind: Obstacle['kind']): void => {
    phase = 'over';
    player.duck = false;
    best = Math.max(best, Math.floor(distance));
    if (bestEl) bestEl.textContent = `${best} m`;

    if (overlay) overlay.classList.remove('is-hidden');
    if (tipEl) {
      tipEl.textContent = `${kind === 'hang' ? '被倒刺刮到了' : '被尖刺扎到了'} · 本局 ${Math.floor(distance)} m`;
    }
    if (startButton) startButton.textContent = '再来一次';
    setStatus('水面抖了一下，再来一次。');
    syncSkill();
  };

  const spawn = (): void => {
    if (Math.random() < 0.44) {
      obstacles.push({ kind: 'hang', x: W + 24, w: 30 + Math.random() * 24, h: 0 });
    } else {
      const teeth = 1 + Math.floor(Math.random() * 3);
      obstacles.push({
        kind: 'spike',
        x: W + 24,
        w: teeth * 19 + 2,
        h: 34 + teeth * 2,
      });
    }
  };

  const jump = (): void => {
    if (phase !== 'run' || !player.onGround) return;
    player.vy = JUMP_VELOCITY;
    player.onGround = false;
  };

  const activateSkill = (): void => {
    if (!active || phase !== 'run' || skillLeft > 0) return;
    obstacles = [];
    skillLeft = SKILL_CD;
    flash = 0.55;
    speak();
    setStatus('尖刺与倒刺被一剑扫空。');
    syncSkill();
  };

  const update = (dt: number): void => {
    elapsed += dt;
    flash = Math.max(0, flash - dt);
    speed = Math.min(MAX_SPEED, START_SPEED + elapsed * 6.2);
    distance += (speed * dt) / 10;

    const meters = Math.floor(distance);
    if (meters !== lastMeters) {
      lastMeters = meters;
      if (scoreEl) scoreEl.textContent = `${meters} m`;
    }

    spawnIn -= dt;
    if (spawnIn <= 0) {
      spawn();
      const gap = clamp(1.55 - speed / 1100, 0.86, 1.45) + Math.random() * 0.28;
      spawnIn = gap / densityFactor();
    }

    for (const obstacle of obstacles) obstacle.x -= speed * dt;
    obstacles = obstacles.filter((obstacle) => obstacle.x + obstacle.w > -30);

    if (!player.onGround) {
      player.vy -= GRAVITY * dt;
      player.y += player.vy * dt;
      if (player.y <= 0) {
        player.y = 0;
        player.vy = 0;
        player.onGround = true;
      }
    }

    if (skillLeft > 0) {
      skillLeft = Math.max(0, skillLeft - dt);
      const cool = skillLeft > 0 ? Math.ceil(skillLeft) : 0;
      if (cool !== lastCool) {
        lastCool = cool;
        if (coolEl) coolEl.textContent = coolingText(cool);
        skillButton?.classList.toggle('is-cooling', cool > 0);
        skillButton?.setAttribute('aria-disabled', String(cool > 0));
      }
    }

    const ducking = player.duck && player.onGround;
    const height = ducking ? 34 : 62;
    const left = playerX - 21;
    const right = playerX + 21;
    const top = groundY - player.y - height;

    for (const obstacle of obstacles) {
      if (right < obstacle.x + 2 || left > obstacle.x + obstacle.w - 2) continue;
      if (obstacle.kind === 'spike') {
        if (player.y < obstacle.h - 2) {
          gameOver('spike');
          return;
        }
      } else if (top < groundY - 40 - 2) {
        gameOver('hang');
        return;
      }
    }
  };

  const coolingText = (cool: number): string => (cool > 0 ? String(cool) : '');

  const drawBackground = (): void => {
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, 'rgba(4, 10, 18, 0.93)');
    sky.addColorStop(0.58, 'rgba(6, 17, 28, 0.82)');
    sky.addColorStop(1, 'rgba(3, 8, 14, 0.94)');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    for (const mote of motes) {
      const x = ((mote.x - clock * mote.s) % W + W) % W;
      const y = mote.y + Math.sin(clock * 0.5 + mote.x) * 6;
      ctx.fillStyle = `rgba(198, 226, 240, ${mote.a})`;
      ctx.beginPath();
      ctx.arc(x, y, mote.r, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = 'rgba(4, 10, 18, 0.72)';
    ctx.fillRect(0, 0, W, 13);

    const halo = ctx.createLinearGradient(0, groundY - 64, 0, groundY);
    halo.addColorStop(0, 'rgba(159, 220, 238, 0)');
    halo.addColorStop(1, 'rgba(159, 220, 238, 0.1)');
    ctx.fillStyle = halo;
    ctx.fillRect(0, groundY - 64, W, 64);

    const below = ctx.createLinearGradient(0, groundY, 0, H);
    below.addColorStop(0, 'rgba(3, 8, 14, 0.12)');
    below.addColorStop(1, 'rgba(3, 8, 14, 0.6)');
    ctx.fillStyle = below;
    ctx.fillRect(0, groundY, W, H - groundY);

    ctx.save();
    ctx.shadowColor = 'rgba(159, 220, 238, 0.55)';
    ctx.shadowBlur = 12;
    ctx.strokeStyle = 'rgba(227, 206, 162, 0.55)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, groundY + 0.5);
    ctx.lineTo(W, groundY + 0.5);
    ctx.stroke();
    ctx.restore();

    for (let i = 0; i < 2; i++) {
      ctx.beginPath();
      ctx.strokeStyle = `rgba(159, 220, 238, ${0.16 - i * 0.06})`;
      for (let x = 0; x <= W; x += 10) {
        const y = groundY + 9 + i * 8 + Math.sin(x * 0.018 + clock * (1.1 + i * 0.4)) * 2.4;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  };

  const drawObstacles = (): void => {
    for (const obstacle of obstacles) {
      // 位置取整，避免细长的尖角在每帧亚像素变化时发虚、闪动
      const x = Math.round(obstacle.x);

      if (obstacle.kind === 'spike') {
        const tipY = Math.round(groundY - obstacle.h);
        const teeth = Math.max(1, Math.round(obstacle.w / 20));
        const tw = obstacle.w / teeth;
        const fill = ctx.createLinearGradient(0, tipY, 0, groundY);
        fill.addColorStop(0, '#f8ead0');
        fill.addColorStop(0.6, '#e3cea2');
        fill.addColorStop(1, '#a37f42');

        ctx.beginPath();
        for (let i = 0; i < teeth; i++) {
          const x0 = x + i * tw;
          ctx.moveTo(x0, groundY);
          ctx.lineTo(x0 + tw / 2, tipY);
          ctx.lineTo(x0 + tw, groundY);
        }
        ctx.closePath();
        ctx.fillStyle = fill;
        ctx.fill();

        ctx.fillStyle = 'rgba(52, 38, 18, 0.55)';
        ctx.fillRect(x, groundY - 3, Math.round(obstacle.w), 3);
      } else {
        const top = 13;
        const bottom = Math.round(groundY - 40);
        const teeth = obstacle.w > 42 ? 2 : 1;
        const tw = obstacle.w / teeth;
        const tip = Math.min(34, (bottom - top) * 0.24);
        const fill = ctx.createLinearGradient(0, top, 0, bottom);
        fill.addColorStop(0, '#7b384b');
        fill.addColorStop(0.55, '#c2718a');
        fill.addColorStop(1, '#f2c9d5');

        ctx.beginPath();
        for (let i = 0; i < teeth; i++) {
          const x0 = x + i * tw;
          ctx.rect(x0, top, tw, bottom - tip - top);
          ctx.moveTo(x0, bottom - tip);
          ctx.lineTo(x0 + tw / 2, bottom);
          ctx.lineTo(x0 + tw, bottom - tip);
        }
        ctx.closePath();
        ctx.fillStyle = fill;
        ctx.fill();

        ctx.fillStyle = 'rgba(255, 238, 244, 0.22)';
        for (let i = 0; i < teeth; i++) {
          const x0 = Math.round(x + i * tw + 1);
          ctx.fillRect(x0, top, 1, bottom - tip - top);
        }
      }
    }
  };

  const drawPlayer = (): void => {
    const ducking = player.duck && player.onGround;
    const bob = phase === 'ready' ? Math.sin(clock * 2.4) * 2 : 0;
    const feet = groundY - player.y - bob;

    ctx.fillStyle = `rgba(2, 6, 12, ${0.5 - Math.min(0.32, player.y / 320)})`;
    ctx.beginPath();
    ctx.ellipse(playerX, groundY + 3, 36, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    const aura = ctx.createRadialGradient(playerX, feet - 30, 4, playerX, feet - 30, 76);
    aura.addColorStop(0, 'rgba(159, 220, 238, 0.2)');
    aura.addColorStop(1, 'rgba(159, 220, 238, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(playerX, feet - 30, 76, 0, Math.PI * 2);
    ctx.fill();

    if (frog.complete && frog.naturalWidth > 0) {
      const height = ducking ? 52 : 94;
      const width = ducking ? 96 : 94;
      ctx.save();
      ctx.translate(playerX, feet);
      ctx.drawImage(frog, -width / 2, -height, width, height);
      ctx.restore();
    } else {
      ctx.fillStyle = 'rgba(126, 151, 168, 0.6)';
      ctx.beginPath();
      ctx.ellipse(playerX, feet - 32, 26, 32, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const drawFlash = (): void => {
    if (flash <= 0) return;
    const strength = flash / 0.55;
    const sweepX = (1 - strength) * (W + 240) - 120;
    const sweep = ctx.createLinearGradient(sweepX - 110, 0, sweepX + 110, 0);
    sweep.addColorStop(0, 'rgba(227, 206, 162, 0)');
    sweep.addColorStop(0.5, `rgba(230, 240, 247, ${0.34 * strength})`);
    sweep.addColorStop(1, 'rgba(227, 206, 162, 0)');

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = sweep;
    ctx.fillRect(sweepX - 110, 0, 220, H);
    ctx.restore();
  };

  const render = (): void => {
    if (W === 0 || H === 0) return;
    // 背景是半透明的，必须先清空画布，否则上一帧会残留成拖影
    ctx.clearRect(0, 0, W, H);
    drawBackground();
    drawObstacles();
    drawPlayer();
    drawFlash();
  };

  const frame = (ts: number): void => {
    if (!active) return;
    if (!lastTs) lastTs = ts;
    const dt = Math.min(0.05, (ts - lastTs) / 1000);
    lastTs = ts;
    clock += dt;

    if (phase === 'run') update(dt);
    else flash = Math.max(0, flash - dt);

    render();
    raf = window.requestAnimationFrame(frame);
  };

  const startLoop = (): void => {
    if (raf) return;
    lastTs = 0;
    raf = window.requestAnimationFrame(frame);
  };

  const stopLoop = (): void => {
    if (raf) {
      window.cancelAnimationFrame(raf);
      raf = 0;
    }
  };

  document.addEventListener('keydown', (event) => {
    if (!active) return;

    if (event.code === 'Space') {
      event.preventDefault();
      if (phase === 'run') jump();
      else start();
      return;
    }

    if (event.key === 'Shift') {
      event.preventDefault();
      player.duck = true;
    }
  });

  document.addEventListener('keyup', (event) => {
    if (event.key === 'Shift') player.duck = false;
  });

  densityRange?.addEventListener('input', syncDensity);
  syncDensity();

  skillButton?.addEventListener('click', activateSkill);

  startButton?.addEventListener('click', () => {
    start();
    startButton.blur();
  });

  const resizeObserver = new ResizeObserver(() => {
    if (!active) return;
    resize();
  });
  resizeObserver.observe(stage);

  const open = (): void => {
    if (active) return;
    active = true;
    layer.classList.add('is-open');
    layer.setAttribute('aria-hidden', 'false');
    layer.removeAttribute('inert');
    resize();
    resetRun();
    startLoop();
  };

  const close = (): void => {
    if (!active) return;
    active = false;
    layer.classList.remove('is-open');
    layer.setAttribute('aria-hidden', 'true');
    layer.setAttribute('inert', '');
    stopLoop();
    player.duck = false;
    phase = 'ready';
    window.clearTimeout(soulTimer);
    soulLine?.classList.remove('is-saying');
  };

  return { open, close };
}
