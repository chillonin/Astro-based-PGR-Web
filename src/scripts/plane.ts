const SKILL_CD = 30;
const SKILL_TIME = 10;
const MAX_HP = 3;
// 敌机移速随波次的倍率上限，避免后期完全无法躲避
const SPEED_CAP = 3;

type Phase = 'ready' | 'run' | 'over';
type EnemyKind = 'scout' | 'dart' | 'tank' | 'gunner';
type SupplyKind = 'damage' | 'rate' | 'speed' | 'multi';

interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  damage: number;
  skill: boolean;
  enemy: boolean;
}

interface Enemy {
  kind: EnemyKind;
  x: number;
  y: number;
  baseX: number;
  hp: number;
  maxHp: number;
  w: number;
  h: number;
  vy: number;
  sway: number;
  phase: number;
  fire: number;
  flash: number;
}

interface Supply {
  kind: SupplyKind;
  x: number;
  y: number;
  baseX: number;
  vy: number;
  phase: number;
  t: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  color: string;
}

interface Ring {
  x: number;
  y: number;
  r: number;
  life: number;
  max: number;
  color: string;
}

interface Star {
  x: number;
  y: number;
  z: number;
  size: number;
}

interface Buffs {
  damage: number;
  rate: number;
  speed: number;
  multi: number;
}

export interface PlaneGame {
  open: () => void;
  close: () => void;
}

const SUPPLY_META: Record<SupplyKind, { label: string; glyph: string; color: string; desc: string }> = {
  damage: { label: '弹头强化', glyph: '伤', color: '#e3cea2', desc: '伤害 +1' },
  rate: { label: '射速强化', glyph: '速', color: '#9fdcee', desc: '射速提升' },
  speed: { label: '引擎强化', glyph: '移', color: '#b9b0e8', desc: '移速提升' },
  multi: { label: '弹道扩展', glyph: '弹', color: '#9ad7c9', desc: '弹道 +1' },
};

const ENEMY_PALETTE: Record<EnemyKind, string> = {
  scout: '#e08d9f',
  dart: '#b9b0e8',
  tank: '#e3cea2',
  gunner: '#e3a1c8',
};

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));
const rand = (min: number, max: number): number => min + Math.random() * (max - min);

export function initPlane(): PlaneGame {
  const layer = document.querySelector<HTMLElement>('[data-plane-layer]');
  const stage = document.querySelector<HTMLElement>('[data-plane-stage]');
  const canvas = document.querySelector<HTMLCanvasElement>('[data-plane-canvas]');
  const overlay = document.querySelector<HTMLElement>('[data-plane-overlay]');
  const tipEl = document.querySelector<HTMLElement>('[data-plane-tip]');
  const startButton = document.querySelector<HTMLButtonElement>('[data-plane-start]');
  const statusEl = document.querySelector<HTMLElement>('[data-plane-status]');
  const scoreEl = document.querySelector<HTMLElement>('[data-plane-score]');
  const waveEl = document.querySelector<HTMLElement>('[data-plane-wave]');
  const hpEl = document.querySelector<HTMLElement>('[data-plane-hp]');
  const skillButton = document.querySelector<HTMLButtonElement>('[data-plane-skill]');
  const coolEl = document.querySelector<HTMLElement>('[data-plane-cool]');
  const ringEl = document.querySelector<HTMLElement>('[data-plane-ring]');
  const soulLine = document.querySelector<HTMLElement>('[data-plane-line]');
  const toastEl = document.querySelector<HTMLElement>('[data-plane-toast]');
  const speedRange = document.querySelector<HTMLInputElement>('[data-plane-speed]');
  const speedValue = document.querySelector<HTMLElement>('[data-plane-speed-value]');
  const densityRange = document.querySelector<HTMLInputElement>('[data-plane-density]');
  const densityValue = document.querySelector<HTMLElement>('[data-plane-density-value]');
  const buffEls = {
    damage: document.querySelector<HTMLElement>('[data-buff-damage]'),
    rate: document.querySelector<HTMLElement>('[data-buff-rate]'),
    speed: document.querySelector<HTMLElement>('[data-buff-speed]'),
    multi: document.querySelector<HTMLElement>('[data-buff-multi]'),
  };

  const empty: PlaneGame = { open: () => {}, close: () => {} };
  if (!layer || !stage || !canvas || !overlay) return empty;

  const ctx = canvas.getContext('2d');
  if (!ctx) return empty;

  const ship = new Image();
  ship.src = '/media/aerial-garden.png';
  const skillIcon = new Image();
  skillIcon.src = '/media/skill-crystal.png';

  let W = 0;
  let H = 0;
  let active = false;
  let phase: Phase = 'ready';
  let over = false;
  let elapsed = 0;
  let clock = 0;
  let score = 0;
  let kills = 0;
  let wave = 1;
  let speedRate = speedRange ? Number(speedRange.value) : 3;
  let densityRate = densityRange ? Number(densityRange.value) : 5;

  let enemies: Enemy[] = [];
  let bullets: Bullet[] = [];
  let supplies: Supply[] = [];
  let particles: Particle[] = [];
  let rings: Ring[] = [];
  let stars: Star[] = [];

  let spawnIn = 1;
  let supplyIn = 5;
  let shake = 0;
  let hitFlash = 0;

  let skillLeft = 0;
  let lastCool = -1;
  let lastScore = -1;
  let lastWave = -1;
  let lastHp = -1;
  let lastBuffs = { damage: -1, rate: -1, speed: -1, multi: -1 };

  const keys = new Set<string>();
  const buffs: Buffs = { damage: 0, rate: 0, speed: 0, multi: 0 };

  const player = {
    x: 0,
    y: 0,
    hp: MAX_HP,
    invuln: 0,
    fire: 0,
    skillFire: 0,
    skill: 0,
    damage: 1,
    interval: 0.24,
    speed: 300,
    spread: 1,
  };

  let raf = 0;
  let lastTs = 0;
  let soulTimer = 0;
  let toastTimer = 0;

  const setSpeedFill = (): void => {
    if (!speedRange) return;
    const min = Number(speedRange.min);
    const max = Number(speedRange.max);
    const ratio = max > min ? (Number(speedRange.value) - min) / (max - min) : 0;
    speedRange.style.setProperty('--p', `${ratio * 100}%`);
  };

  const syncSpeed = (): void => {
    if (!speedRange) return;
    speedRate = Number(speedRange.value);
    if (speedValue) speedValue.textContent = `+${speedRate}%`;
    setSpeedFill();
  };

  // 第 n 波速度 = 基础速度 × (1 + (n - 1) × 滑块百分比)，线性增长并封顶
  const enemySpeedScale = (): number => Math.min(SPEED_CAP, 1 + (wave - 1) * (speedRate / 100));

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

  // 第 n 波密度 = 基础密度 × (1 + (n - 1) × 滑块百分比)，线性增长，不设上限
  const enemyDensityScale = (): number => 1 + (wave - 1) * (densityRate / 100);

  const setStatus = (text: string): void => {
    if (statusEl) statusEl.textContent = text;
  };

  const showToast = (text: string, color: string): void => {
    if (!toastEl) return;
    toastEl.textContent = text;
    toastEl.style.color = color;
    toastEl.classList.add('is-show');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toastEl.classList.remove('is-show'), 1700);
  };

  const speak = (): void => {
    if (!soulLine) return;
    soulLine.classList.add('is-saying');
    window.clearTimeout(soulTimer);
    soulTimer = window.setTimeout(() => soulLine.classList.remove('is-saying'), 3200);
  };

  const updateBuffs = (): void => {
    player.damage = 1 + buffs.damage;
    player.interval = Math.max(0.085, 0.24 * Math.pow(0.88, buffs.rate));
    player.speed = Math.min(560, 300 + 36 * buffs.speed);
    player.spread = Math.min(5, 1 + buffs.multi);
  };

  const syncHud = (): void => {
    if (scoreEl && score !== lastScore) {
      lastScore = score;
      scoreEl.textContent = String(score);
    }
    if (waveEl && wave !== lastWave) {
      lastWave = wave;
      waveEl.textContent = String(wave).padStart(2, '0');
    }
    if (hpEl && player.hp !== lastHp) {
      lastHp = player.hp;
      Array.from(hpEl.children).forEach((pip, index) => {
        pip.classList.toggle('is-lost', index >= player.hp);
      });
    }
    (Object.keys(buffs) as Array<keyof Buffs>).forEach((key) => {
      const el = buffEls[key];
      if (el && buffs[key] !== lastBuffs[key]) {
        lastBuffs[key] = buffs[key];
        el.textContent = key === 'multi' ? String(player.spread) : String(1 + buffs[key]);
      }
    });
  };

  const syncSkill = (): void => {
    if (!skillButton) return;
    const cooling = skillLeft > 0;
    const casting = player.skill > 0;
    skillButton.classList.toggle('is-cooling', cooling);
    skillButton.classList.toggle('is-casting', casting);
    skillButton.setAttribute('aria-disabled', String(phase !== 'run' || cooling));
    skillButton.setAttribute('aria-pressed', String(casting));
    if (coolEl) coolEl.textContent = cooling ? String(Math.ceil(skillLeft)) : '';
    if (ringEl) ringEl.style.setProperty('--cd', `${(skillLeft / SKILL_CD) * 360}deg`);
    lastCool = cooling ? Math.ceil(skillLeft) : 0;
  };

  const resize = (): void => {
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = rect.width;
    H = rect.height;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    player.x = clamp(player.x || W / 2, 32, W - 32);
    player.y = clamp(player.y || H - 62, 32, H - 32);

    stars = Array.from({ length: 84 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      z: 0.35 + Math.random() * 0.9,
      size: 0.5 + Math.random() * 1.4,
    }));
  };

  const reset = (): void => {
    phase = 'ready';
    over = false;
    elapsed = 0;
    score = 0;
    kills = 0;
    wave = 1;
    enemies = [];
    bullets = [];
    supplies = [];
    particles = [];
    rings = [];
    spawnIn = 1;
    supplyIn = 6;
    shake = 0;
    hitFlash = 0;
    skillLeft = 0;
    lastScore = -1;
    lastWave = -1;
    lastHp = -1;
    lastBuffs = { damage: -1, rate: -1, speed: -1, multi: -1 };
    buffs.damage = 0;
    buffs.rate = 0;
    buffs.speed = 0;
    buffs.multi = 0;
    updateBuffs();

    player.x = W / 2;
    player.y = H - 62;
    player.hp = MAX_HP;
    player.invuln = 0;
    player.fire = 0;
    player.skillFire = 0;
    player.skill = 0;

    overlay.classList.remove('is-hidden');
    if (tipEl) tipEl.textContent = 'W / A / S / D 操控战机 · 自动射击 · 拾取补给永久强化';
    if (startButton) {
      startButton.textContent = '出击';
      startButton.blur();
    }
    setStatus('丽芙的护航战机已经待命。');
    syncHud();
    syncSkill();
    window.clearTimeout(soulTimer);
    soulLine?.classList.remove('is-saying');
    window.clearTimeout(toastTimer);
    toastEl?.classList.remove('is-show');
  };

  const start = (): void => {
    phase = 'run';
    over = false;
    elapsed = 0;
    score = 0;
    kills = 0;
    wave = 1;
    enemies = [];
    bullets = [];
    supplies = [];
    particles = [];
    rings = [];
    spawnIn = 0.8;
    supplyIn = 6;
    shake = 0;
    hitFlash = 0;
    skillLeft = 0;
    buffs.damage = 0;
    buffs.rate = 0;
    buffs.speed = 0;
    buffs.multi = 0;
    updateBuffs();
    player.hp = MAX_HP;
    player.invuln = 1.2;
    player.fire = 0;
    player.skillFire = 0;
    player.skill = 0;
    player.x = W / 2;
    player.y = H - 62;

    overlay.classList.add('is-hidden');
    startButton?.blur();
    setStatus('敌机正在逼近，活下去。');
    syncHud();
    syncSkill();
  };

  const gameOver = (): void => {
    phase = 'over';
    over = true;
    player.skill = 0;
    player.invuln = 0;
    shake = 0.5;
    const seconds = Math.floor(elapsed);
    if (overlay) overlay.classList.remove('is-hidden');
    if (tipEl) tipEl.textContent = `战机坠落 · 击破 ${kills} 架 · 坚持 ${seconds} 秒`;
    if (startButton) startButton.textContent = '再次出击';
    setStatus('水面抖了一下，再来一次。');
    syncSkill();
  };

  const burst = (x: number, y: number, color: string, count: number, power: number): void => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = rand(24, 180) * power;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: rand(0.28, 0.72),
        max: 0.72,
        size: rand(1, 2.8),
        color,
      });
    }
  };

  const addRing = (x: number, y: number, color: string, max: number): void => {
    rings.push({ x, y, r: 8, life: max, max, color });
  };

  const enemyStats = (kind: EnemyKind): { w: number; h: number; hp: number; vy: number; score: number; sway: number } => {
    switch (kind) {
      case 'dart':
        return { w: 24, h: 38, hp: 1, vy: 205, score: 16, sway: 0 };
      case 'tank':
        return { w: 60, h: 54, hp: 9, vy: 46, score: 60, sway: 10 };
      case 'gunner':
        return { w: 42, h: 40, hp: 5, vy: 60, score: 32, sway: 16 };
      default:
        return { w: 36, h: 34, hp: 2, vy: 86, score: 10, sway: 12 };
    }
  };

  const pickKind = (): EnemyKind => {
    const roll = Math.random();
    if (elapsed > 32 && roll < 0.14) return 'tank';
    if (elapsed > 16 && roll < 0.34) return 'gunner';
    if (elapsed > 10 && roll < 0.58) return 'dart';
    return 'scout';
  };

  const spawnEnemy = (): void => {
    const kind = pickKind();
    const stats = enemyStats(kind);
    const hpScale = 1 + elapsed * 0.022;
    const x = rand(42, W - 42);
    enemies.push({
      kind,
      x,
      y: -stats.h - 10,
      baseX: x,
      hp: Math.ceil(stats.hp * hpScale),
      maxHp: Math.ceil(stats.hp * hpScale),
      w: stats.w,
      h: stats.h,
      vy: stats.vy * enemySpeedScale(),
      sway: stats.sway,
      phase: Math.random() * Math.PI * 2,
      fire: kind === 'gunner' ? rand(0.9, 1.5) : 0,
      flash: 0,
    });
  };

  const spawnSupply = (kind?: SupplyKind): void => {
    const kinds: SupplyKind[] = ['damage', 'rate', 'speed', 'multi'];
    const picked = kind ?? kinds[Math.floor(Math.random() * kinds.length)];
    const x = rand(50, W - 50);
    supplies.push({ kind: picked, x, y: -30, baseX: x, vy: 62, phase: Math.random() * Math.PI * 2, t: 0 });
  };

  const applySupply = (supply: Supply): void => {
    const meta = SUPPLY_META[supply.kind];
    buffs[supply.kind] += 1;
    updateBuffs();
    showToast(`${meta.label} · ${meta.desc}`, meta.color);
    burst(supply.x, supply.y, meta.color, 22, 1);
    addRing(supply.x, supply.y, meta.color, 0.6);
    setStatus(`${meta.label}永久生效。`);
  };

  const hitPlayer = (): void => {
    if (player.invuln > 0 || player.skill > 0) return;
    player.hp -= 1;
    player.invuln = 1.5;
    hitFlash = 0.32;
    shake = 0.32;
    burst(player.x, player.y, '#d98b9c', 26, 1.2);
    addRing(player.x, player.y, '#d98b9c', 0.5);
    if (player.hp <= 0) {
      player.hp = 0;
      gameOver();
      return;
    }
    setStatus(`受到攻击，剩余装甲 ${player.hp}。`);
    syncHud();
  };

  const damageEnemy = (enemy: Enemy, amount: number): void => {
    enemy.hp -= amount;
    enemy.flash = 0.12;
    if (enemy.hp > 0) {
      burst(enemy.x, enemy.y, ENEMY_PALETTE[enemy.kind], 5, 0.5);
      return;
    }

    enemy.hp = 0;
    kills += 1;
    score += enemyStats(enemy.kind).score;
    burst(enemy.x, enemy.y, ENEMY_PALETTE[enemy.kind], enemy.kind === 'tank' ? 34 : 18, enemy.kind === 'tank' ? 1.4 : 0.9);
    addRing(enemy.x, enemy.y, ENEMY_PALETTE[enemy.kind], 0.45);
    if (enemy.kind === 'tank') shake = Math.max(shake, 0.18);
    if (Math.random() < (enemy.kind === 'tank' ? 0.45 : 0.09)) spawnSupply();
    syncHud();
  };

  const activateSkill = (): void => {
    if (!active || phase !== 'run' || over || skillLeft > 0) return;
    skillLeft = SKILL_CD;
    player.skill = SKILL_TIME;
    player.invuln = 0;
    player.skillFire = 0;
    speak();
    addRing(player.x, player.y, '#e3cea2', 0.9);
    addRing(player.x, player.y, '#9fdcee', 1.2);
    setStatus('八向齐射，十秒无敌。');
    syncSkill();
  };

  const update = (dt: number): void => {
    elapsed += dt;
    wave = 1 + Math.floor(elapsed / 22);

    const dx = (keys.has('KeyD') || keys.has('ArrowRight') ? 1 : 0) - (keys.has('KeyA') || keys.has('ArrowLeft') ? 1 : 0);
    const dy = (keys.has('KeyS') || keys.has('ArrowDown') ? 1 : 0) - (keys.has('KeyW') || keys.has('ArrowUp') ? 1 : 0);
    if (dx !== 0 || dy !== 0) {
      const len = Math.hypot(dx, dy) || 1;
      player.x = clamp(player.x + (dx / len) * player.speed * dt, 28, W - 28);
      player.y = clamp(player.y + (dy / len) * player.speed * dt, 32, H - 28);
    }

    player.invuln = Math.max(0, player.invuln - dt);
    if (player.skill > 0) {
      player.skill = Math.max(0, player.skill - dt);
      if (player.skill === 0) {
        setStatus('镜心归寂，火力恢复常态。');
        syncSkill();
      }
    }
    if (skillLeft > 0) skillLeft = Math.max(0, skillLeft - dt);

    // 自动射击
    player.fire -= dt;
    if (player.skill > 0) {
      player.skillFire -= dt;
      if (player.skillFire <= 0) {
        player.skillFire = 0.3;
        const base = player.damage * 3;
        for (let i = 0; i < 8; i++) {
          const angle = (Math.PI / 4) * i - Math.PI / 8;
          bullets.push({
            x: player.x,
            y: player.y,
            vx: Math.cos(angle) * 420,
            vy: Math.sin(angle) * 420,
            r: 5.5,
            damage: base,
            skill: true,
            enemy: false,
          });
        }
      }
    }
    if (player.fire <= 0) {
      player.fire = player.skill > 0 ? 0.42 : player.interval;
      const count = player.spread;
      const gap = 13;
      for (let i = 0; i < count; i++) {
        const offset = (i - (count - 1) / 2) * gap;
        bullets.push({
          x: player.x + offset,
          y: player.y - 28,
          vx: 0,
          vy: -640,
          r: 3.4,
          damage: player.damage,
          skill: player.skill > 0,
          enemy: false,
        });
      }
    }

    // 生成敌机
    spawnIn -= dt;
    if (spawnIn <= 0) {
      spawnEnemy();
      const gap = Math.max(0.34, 1.12 - elapsed * 0.011) + rand(0, 0.22);
      spawnIn = gap / enemyDensityScale();
    }

    supplyIn -= dt;
    if (supplyIn <= 0) {
      spawnSupply();
      supplyIn = rand(7.5, 11.5);
    }

    // 敌机移动与开火
    for (const enemy of enemies) {
      enemy.flash = Math.max(0, enemy.flash - dt);
      enemy.y += enemy.vy * dt;
      enemy.phase += dt;
      enemy.x = enemy.baseX + Math.sin(enemy.phase * 1.6) * enemy.sway;

      if (enemy.kind === 'gunner' && enemy.y > 20 && enemy.y < H - 120) {
        enemy.fire -= dt;
        if (enemy.fire <= 0) {
          enemy.fire = Math.max(1.15, 2.2 - elapsed * 0.008);
          const aimX = player.x - enemy.x;
          const aimY = player.y - enemy.y;
          const len = Math.hypot(aimX, aimY) || 1;
          const speed = Math.min(320, 200 + elapsed * 1.1);
          bullets.push({
            x: enemy.x,
            y: enemy.y + enemy.h * 0.4,
            vx: (aimX / len) * speed,
            vy: (aimY / len) * speed,
            r: 4.6,
            damage: 1,
            skill: false,
            enemy: true,
          });
        }
      }
    }

    // 补给漂移
    for (const supply of supplies) {
      supply.t += dt;
      supply.y += supply.vy * dt;
      supply.x = supply.baseX + Math.sin(supply.t * 1.8 + supply.phase) * 9;
    }

    // 子弹移动
    for (const bullet of bullets) {
      bullet.x += bullet.vx * dt;
      bullet.y += bullet.vy * dt;
    }

    // 粒子与光环
    for (const particle of particles) {
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vx *= 0.94;
      particle.vy *= 0.94;
      particle.life -= dt;
    }
    particles = particles.filter((particle) => particle.life > 0);

    for (const ring of rings) {
      ring.life -= dt;
      ring.r += 190 * dt;
    }
    rings = rings.filter((ring) => ring.life > 0);

    // 子弹命中敌机
    for (const bullet of bullets) {
      if (bullet.enemy) continue;
      for (const enemy of enemies) {
        if (enemy.hp <= 0) continue;
        const dx2 = bullet.x - enemy.x;
        const dy2 = bullet.y - enemy.y;
        if (Math.abs(dx2) > enemy.w * 0.52 + bullet.r || Math.abs(dy2) > enemy.h * 0.52 + bullet.r) continue;
        damageEnemy(enemy, bullet.damage);
        bullet.damage = 0;
        break;
      }
    }
    bullets = bullets.filter((bullet) => bullet.damage > 0 && bullet.y > -30 && bullet.y < H + 40 && bullet.x > -30 && bullet.x < W + 30);
    enemies = enemies.filter((enemy) => enemy.hp > 0 && enemy.y < H + 80);

    // 玩家与敌机相撞
    for (const enemy of enemies) {
      if (Math.abs(enemy.x - player.x) > enemy.w * 0.45 + 15 || Math.abs(enemy.y - player.y) > enemy.h * 0.45 + 15) continue;
      if (player.skill > 0) {
        damageEnemy(enemy, 999);
        continue;
      }
      damageEnemy(enemy, 999);
      hitPlayer();
      if (over) break;
    }

    // 敌弹命中玩家
    for (const bullet of bullets) {
      if (!bullet.enemy) continue;
      if (Math.hypot(bullet.x - player.x, bullet.y - player.y) > 15 + bullet.r) continue;
      bullet.damage = 0;
      hitPlayer();
      if (over) break;
    }
    bullets = bullets.filter((bullet) => bullet.damage > 0);

    // 玩家射中或碰到补给
    for (const supply of supplies) {
      const collected =
        Math.hypot(supply.x - player.x, supply.y - player.y) < 20 + 16 ||
        bullets.some((bullet) => !bullet.enemy && Math.hypot(bullet.x - supply.x, bullet.y - supply.y) < bullet.r + 15);
      if (!collected) continue;
      supply.t = -999;
      applySupply(supply);
    }
    supplies = supplies.filter((supply) => supply.t > -100 && supply.y < H + 40);

    shake = Math.max(0, shake - dt);
    hitFlash = Math.max(0, hitFlash - dt);

    if (Math.ceil(skillLeft) !== lastCool) syncSkill();
    syncHud();
  };

  const drawBackground = (): void => {
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#040a12');
    sky.addColorStop(0.55, '#06121e');
    sky.addColorStop(1, '#081622');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    const nebula = ctx.createRadialGradient(W * 0.24, H * 0.18, 0, W * 0.24, H * 0.18, Math.max(W, H) * 0.5);
    nebula.addColorStop(0, 'rgba(217, 139, 156, 0.1)');
    nebula.addColorStop(0.5, 'rgba(217, 139, 156, 0.03)');
    nebula.addColorStop(1, 'rgba(217, 139, 156, 0)');
    ctx.fillStyle = nebula;
    ctx.fillRect(0, 0, W, H);

    const nebula2 = ctx.createRadialGradient(W * 0.78, H * 0.62, 0, W * 0.78, H * 0.62, Math.max(W, H) * 0.45);
    nebula2.addColorStop(0, 'rgba(159, 220, 238, 0.09)');
    nebula2.addColorStop(1, 'rgba(159, 220, 238, 0)');
    ctx.fillStyle = nebula2;
    ctx.fillRect(0, 0, W, H);

    for (const star of stars) {
      const y = ((star.y + clock * 26 * star.z) % H + H) % H;
      const twinkle = 0.35 + 0.4 * Math.sin(clock * 2 + star.x);
      ctx.fillStyle = `rgba(214, 236, 246, ${0.16 + twinkle * 0.4 * star.z})`;
      ctx.beginPath();
      ctx.arc(star.x, y, star.size, 0, Math.PI * 2);
      ctx.fill();
    }

    // 底部水光，与页面主题呼应
    const waterY = H - 8;
    const water = ctx.createLinearGradient(0, waterY - 54, 0, waterY);
    water.addColorStop(0, 'rgba(159, 220, 238, 0)');
    water.addColorStop(1, 'rgba(159, 220, 238, 0.1)');
    ctx.fillStyle = water;
    ctx.fillRect(0, waterY - 54, W, 54);

    for (let i = 0; i < 2; i++) {
      ctx.beginPath();
      ctx.strokeStyle = `rgba(159, 220, 238, ${0.2 - i * 0.08})`;
      ctx.lineWidth = 1;
      for (let x = 0; x <= W; x += 10) {
        const y = waterY - 2 - i * 5 + Math.sin(x * 0.022 + clock * (1 + i * 0.4)) * 2.2;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  };

  const drawEnemy = (enemy: Enemy): void => {
    const color = ENEMY_PALETTE[enemy.kind];
    const w = enemy.w;
    const h = enemy.h;

    ctx.save();
    ctx.translate(enemy.x, enemy.y);
    ctx.shadowColor = color;
    ctx.shadowBlur = enemy.kind === 'tank' ? 20 : 13;

    const body = ctx.createLinearGradient(0, -h * 0.5, 0, h * 0.55);
    body.addColorStop(0, 'rgba(8, 16, 26, 0.95)');
    body.addColorStop(0.5, color);
    body.addColorStop(1, '#2a1520');

    ctx.beginPath();
    ctx.moveTo(0, h * 0.55);
    ctx.lineTo(-w * 0.16, h * 0.14);
    ctx.lineTo(-w * 0.5, h * 0.04);
    ctx.lineTo(-w * 0.34, -h * 0.18);
    ctx.lineTo(-w * 0.1, -h * 0.24);
    ctx.lineTo(-w * 0.08, -h * 0.5);
    ctx.lineTo(0, -h * 0.4);
    ctx.lineTo(w * 0.08, -h * 0.5);
    ctx.lineTo(w * 0.1, -h * 0.24);
    ctx.lineTo(w * 0.34, -h * 0.18);
    ctx.lineTo(w * 0.5, h * 0.04);
    ctx.lineTo(w * 0.16, h * 0.14);
    ctx.closePath();
    ctx.fillStyle = body;
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = `rgba(255, 240, 245, ${enemy.flash > 0 ? 0.85 : 0.42})`;
    ctx.stroke();

    // 机腹核心
    ctx.shadowBlur = 10;
    ctx.fillStyle = enemy.flash > 0 ? '#ffffff' : color;
    ctx.beginPath();
    ctx.ellipse(0, h * 0.04, w * 0.1, h * 0.13, 0, 0, Math.PI * 2);
    ctx.fill();

    if (enemy.kind === 'tank') {
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(6, 14, 24, 0.55)';
      ctx.fillRect(-w * 0.3, -h * 0.26, w * 0.6, h * 0.1);
      ctx.fillStyle = 'rgba(227, 206, 162, 0.55)';
      ctx.fillRect(-w * 0.3, -h * 0.26, w * 0.6, 1.5);
    } else if (enemy.kind === 'gunner') {
      ctx.shadowBlur = 8;
      ctx.fillStyle = color;
      ctx.fillRect(-w * 0.3, h * 0.14, w * 0.14, h * 0.24);
      ctx.fillRect(w * 0.16, h * 0.14, w * 0.14, h * 0.24);
    } else if (enemy.kind === 'dart') {
      ctx.shadowBlur = 12;
      ctx.fillStyle = `rgba(185, 176, 232, 0.5)`;
      ctx.fillRect(-w * 0.06, -h * 0.78, w * 0.12, h * 0.3);
    }

    ctx.restore();

    if (enemy.maxHp > 2 && enemy.hp < enemy.maxHp) {
      const barW = Math.max(26, w * 0.8);
      const x = enemy.x - barW / 2;
      const y = enemy.y - h * 0.5 - 9;
      ctx.fillStyle = 'rgba(4, 10, 18, 0.65)';
      ctx.fillRect(x, y, barW, 2.5);
      ctx.fillStyle = color;
      ctx.fillRect(x, y, (barW * enemy.hp) / enemy.maxHp, 2.5);
    }
  };

  const drawSupply = (supply: Supply): void => {
    const meta = SUPPLY_META[supply.kind];
    const bob = Math.sin(supply.t * 3.4) * 2;

    ctx.save();
    ctx.translate(supply.x, supply.y + bob);
    ctx.rotate(Math.sin(supply.t * 1.4) * 0.18);

    const aura = ctx.createRadialGradient(0, 0, 2, 0, 0, 26);
    aura.addColorStop(0, `${meta.color}55`);
    aura.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(0, 0, 26, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowColor = meta.color;
    ctx.shadowBlur = 16;
    ctx.strokeStyle = meta.color;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 2;
      const x = Math.cos(angle) * 14;
      const y = Math.sin(angle) * 14;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(5, 13, 22, 0.86)';
    ctx.fill();
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.fillStyle = meta.color;
    ctx.font = '10px "Noto Sans SC", "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(meta.glyph, 0, 1);

    ctx.restore();
  };

  const jetPath = (w: number, h: number): void => {
    ctx.beginPath();
    ctx.moveTo(0, -h * 0.5);
    ctx.quadraticCurveTo(w * 0.12, -h * 0.26, w * 0.16, -h * 0.06);
    ctx.lineTo(w * 0.5, h * 0.04);
    ctx.lineTo(w * 0.44, h * 0.18);
    ctx.lineTo(w * 0.18, h * 0.13);
    ctx.lineTo(w * 0.2, h * 0.4);
    ctx.lineTo(0, h * 0.3);
    ctx.lineTo(-w * 0.2, h * 0.4);
    ctx.lineTo(-w * 0.18, h * 0.13);
    ctx.lineTo(-w * 0.44, h * 0.18);
    ctx.lineTo(-w * 0.5, h * 0.04);
    ctx.lineTo(-w * 0.16, -h * 0.06);
    ctx.quadraticCurveTo(-w * 0.12, -h * 0.26, 0, -h * 0.5);
    ctx.closePath();
  };

  const drawPlayer = (): void => {
    const blink = player.invuln > 0 && player.skill === 0 && Math.floor(clock * 14) % 2 === 0;
    ctx.save();
    ctx.globalAlpha = blink ? 0.35 : 1;

    // 引擎光
    const engine = ctx.createRadialGradient(player.x, player.y + 26, 1, player.x, player.y + 26, 26);
    engine.addColorStop(0, 'rgba(159, 220, 238, 0.55)');
    engine.addColorStop(1, 'rgba(159, 220, 238, 0)');
    ctx.fillStyle = engine;
    ctx.beginPath();
    ctx.arc(player.x, player.y + 26, 26, 0, Math.PI * 2);
    ctx.fill();

    if (player.skill > 0) {
      // 技能期间：战机化作镜之花
      ctx.save();
      ctx.translate(player.x, player.y);
      ctx.rotate(clock * 1.1);
      ctx.shadowColor = 'rgba(206, 240, 252, 0.95)';
      ctx.shadowBlur = 26;
      const size = 58;
      if (skillIcon.complete && skillIcon.naturalWidth > 0) {
        ctx.drawImage(skillIcon, -size / 2, -size / 2, size, size);
      } else {
        ctx.fillStyle = '#e6f0f7';
        ctx.beginPath();
        ctx.arc(0, 0, 22, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      const halo = ctx.createRadialGradient(player.x, player.y, 2, player.x, player.y, 52);
      halo.addColorStop(0, 'rgba(227, 206, 162, 0.28)');
      halo.addColorStop(1, 'rgba(227, 206, 162, 0)');
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(player.x, player.y, 52, 0, Math.PI * 2);
      ctx.fill();
    } else {
      const w = 64;
      const h = 74;
      ctx.save();
      ctx.translate(player.x, player.y);

      // 用上传的舰船图填充战机剪影，让机体保有原本的金属与星尘质感
      ctx.save();
      jetPath(w, h);
      ctx.clip();
      if (ship.complete && ship.naturalWidth > 0) {
        ctx.drawImage(ship, -w * 0.78, -h * 0.78, w * 1.56, h * 1.56);
      }
      const shade = ctx.createLinearGradient(0, -h * 0.5, 0, h * 0.42);
      shade.addColorStop(0, 'rgba(126, 190, 214, 0.42)');
      shade.addColorStop(0.46, 'rgba(8, 20, 32, 0.18)');
      shade.addColorStop(1, 'rgba(4, 10, 18, 0.62)');
      ctx.fillStyle = shade;
      ctx.fillRect(-w * 0.55, -h * 0.55, w * 1.1, h * 1.1);
      ctx.restore();

      jetPath(w, h);
      ctx.strokeStyle = 'rgba(206, 238, 248, 0.85)';
      ctx.lineWidth = 1.2;
      ctx.shadowColor = 'rgba(159, 220, 238, 0.9)';
      ctx.shadowBlur = 16;
      ctx.stroke();

      // 座舱与机头灯
      ctx.shadowBlur = 10;
      ctx.fillStyle = 'rgba(230, 240, 247, 0.9)';
      ctx.beginPath();
      ctx.ellipse(0, -h * 0.14, 2.6, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // 尾焰
      ctx.shadowColor = 'rgba(159, 220, 238, 0.9)';
      ctx.shadowBlur = 14;
      const flame = 8 + Math.sin(clock * 26) * 4;
      const exhaust = ctx.createLinearGradient(0, h * 0.3, 0, h * 0.3 + flame * 2);
      exhaust.addColorStop(0, 'rgba(230, 248, 255, 0.9)');
      exhaust.addColorStop(1, 'rgba(159, 220, 238, 0)');
      ctx.fillStyle = exhaust;
      ctx.beginPath();
      ctx.moveTo(-7, h * 0.3);
      ctx.lineTo(0, h * 0.3 + flame * 2);
      ctx.lineTo(7, h * 0.3);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // 护盾
    const shieldColor = player.skill > 0 ? '227, 206, 162' : '159, 220, 238';
    if (player.skill > 0 || player.invuln > 0) {
      const radius = 36 + Math.sin(clock * 5) * 2;
      ctx.strokeStyle = `rgba(${shieldColor}, ${player.skill > 0 ? 0.65 : 0.4})`;
      ctx.lineWidth = 1.2;
      ctx.setLineDash([8, 7]);
      ctx.lineDashOffset = -clock * 26;
      ctx.beginPath();
      ctx.arc(player.x, player.y, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.restore();
  };

  const drawBullets = (): void => {
    for (const bullet of bullets) {
      ctx.save();
      if (bullet.enemy) {
        ctx.shadowColor = 'rgba(224, 141, 159, 0.9)';
        ctx.shadowBlur = 12;
        ctx.fillStyle = '#f0aabb';
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, bullet.r, 0, Math.PI * 2);
        ctx.fill();
      } else if (bullet.skill) {
        const speed = Math.hypot(bullet.vx, bullet.vy) || 1;
        const tail = 18;
        ctx.shadowColor = 'rgba(227, 206, 162, 0.95)';
        ctx.shadowBlur = 18;
        ctx.fillStyle = '#f4e4bd';
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, bullet.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(244, 228, 189, 0.5)';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(bullet.x, bullet.y);
        ctx.lineTo(bullet.x - (bullet.vx / speed) * tail, bullet.y - (bullet.vy / speed) * tail);
        ctx.stroke();
      } else {
        const speed = Math.hypot(bullet.vx, bullet.vy) || 1;
        const tail = 16;
        ctx.shadowColor = 'rgba(159, 220, 238, 0.9)';
        ctx.shadowBlur = 12;
        const trail = ctx.createLinearGradient(
          bullet.x,
          bullet.y,
          bullet.x - (bullet.vx / speed) * tail,
          bullet.y - (bullet.vy / speed) * tail,
        );
        trail.addColorStop(0, '#f2fbff');
        trail.addColorStop(1, 'rgba(159, 220, 238, 0)');
        ctx.strokeStyle = trail;
        ctx.lineWidth = bullet.r * 1.7;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(bullet.x, bullet.y);
        ctx.lineTo(bullet.x - (bullet.vx / speed) * tail, bullet.y - (bullet.vy / speed) * tail);
        ctx.stroke();
      }
      ctx.restore();
    }
  };

  const render = (): void => {
    if (W === 0 || H === 0) return;
    ctx.clearRect(0, 0, W, H);
    drawBackground();

    const sx = shake > 0 ? rand(-1, 1) * shake * 9 : 0;
    const sy = shake > 0 ? rand(-1, 1) * shake * 9 : 0;

    ctx.save();
    ctx.translate(sx, sy);

    for (const supply of supplies) drawSupply(supply);
    for (const enemy of enemies) drawEnemy(enemy);
    drawBullets();

    if (phase !== 'over' || player.hp > 0) drawPlayer();

    // 光环
    for (const ring of rings) {
      const alpha = Math.max(0, ring.life / ring.max);
      ctx.strokeStyle = ring.color;
      ctx.globalAlpha = alpha * 0.5;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(ring.x, ring.y, ring.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // 粒子
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const particle of particles) {
      ctx.globalAlpha = Math.max(0, particle.life / particle.max);
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    ctx.restore();

    if (hitFlash > 0) {
      ctx.fillStyle = `rgba(217, 139, 156, ${hitFlash * 0.5})`;
      ctx.fillRect(0, 0, W, H);
    }

    // 准星刻度，装饰性的战术 HUD
    ctx.strokeStyle = 'rgba(198, 226, 240, 0.16)';
    ctx.lineWidth = 1;
    const m = 10;
    const len = 14;
    ctx.beginPath();
    ctx.moveTo(m, m + len);
    ctx.lineTo(m, m);
    ctx.lineTo(m + len, m);
    ctx.moveTo(W - m - len, m);
    ctx.lineTo(W - m, m);
    ctx.lineTo(W - m, m + len);
    ctx.moveTo(m, H - m - len);
    ctx.lineTo(m, H - m);
    ctx.lineTo(m + len, H - m);
    ctx.moveTo(W - m - len, H - m);
    ctx.lineTo(W - m, H - m);
    ctx.lineTo(W - m, H - m - len);
    ctx.stroke();
  };

  const frame = (ts: number): void => {
    if (!active) return;
    if (!lastTs) lastTs = ts;
    const dt = Math.min(0.05, (ts - lastTs) / 1000);
    lastTs = ts;
    clock += dt;

    if (phase === 'run' && !over) update(dt);
    else {
      // 静止时也让粒子衰减，避免结束后残影凝固
      for (const particle of particles) {
        particle.x += particle.vx * dt;
        particle.y += particle.vy * dt;
        particle.vx *= 0.94;
        particle.vy *= 0.94;
        particle.life -= dt;
      }
      particles = particles.filter((particle) => particle.life > 0);
      for (const ring of rings) {
        ring.life -= dt;
        ring.r += 190 * dt;
      }
      rings = rings.filter((ring) => ring.life > 0);
      shake = Math.max(0, shake - dt);
      hitFlash = Math.max(0, hitFlash - dt);
    }

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

  const onKeyDown = (event: KeyboardEvent): void => {
    if (!active) return;
    if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) {
      event.preventDefault();
    }
    if (event.code === 'Space') {
      if (phase !== 'run') start();
      return;
    }
    keys.add(event.code);
  };

  const onKeyUp = (event: KeyboardEvent): void => {
    keys.delete(event.code);
  };

  const onBlur = (): void => {
    keys.clear();
  };

  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', onBlur);

  speedRange?.addEventListener('input', syncSpeed);
  syncSpeed();
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
    reset();
    startLoop();
  };

  const close = (): void => {
    if (!active) return;
    active = false;
    layer.classList.remove('is-open');
    layer.setAttribute('aria-hidden', 'true');
    layer.setAttribute('inert', '');
    stopLoop();
    keys.clear();
    phase = 'ready';
    window.clearTimeout(soulTimer);
    soulLine?.classList.remove('is-saying');
    window.clearTimeout(toastTimer);
    toastEl?.classList.remove('is-show');
  };

  return { open, close };
}
