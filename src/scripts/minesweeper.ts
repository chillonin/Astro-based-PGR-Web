import type { FrogRunner } from './runner';
import type { PlaneGame } from './plane';

const COLS = 30;
const ROWS = 16;
const TOTAL = COLS * ROWS;

interface CellState {
  mine: boolean;
  open: boolean;
  flag: boolean;
  count: number;
}

type Status = 'idle' | 'win' | 'lose';

export function initMinesweeper(runner?: FrogRunner, plane?: PlaneGame): void {
  const stage = document.querySelector<HTMLElement>('[data-stage]');
  const layer = document.querySelector<HTMLElement>('[data-game-layer]');
  const toggleButton = document.querySelector<HTMLButtonElement>('[data-game-toggle]');
  const boardEl = document.querySelector<HTMLElement>('[data-board]');
  const range = document.querySelector<HTMLInputElement>('[data-mine-range]');
  const countLabel = document.querySelector<HTMLElement>('[data-mine-count]');
  const leftEl = document.querySelector<HTMLElement>('[data-mines-left]');
  const timeEl = document.querySelector<HTMLElement>('[data-timer]');
  const statusEl = document.querySelector<HTMLElement>('[data-status]');
  const restartButton = document.querySelector<HTMLButtonElement>('[data-restart]');
  const modeButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-mode]'));
  const library = document.querySelector<HTMLElement>('[data-library]');
  const libraryNote = document.querySelector<HTMLElement>('[data-library-note]');
  const libraryButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-library-game]'));
  const skillButton = document.querySelector<HTMLButtonElement>('[data-skill]');
  const soulLine = document.querySelector<HTMLElement>('[data-soul-line]');

  if (!layer || !toggleButton || !boardEl || !range) return;

  let mineCount = Number(range.value) || 40;
  let cells: CellState[] = [];
  let flagMode = false;
  let started = false;
  let over = false;
  let flagCount = 0;
  let revealedCount = 0;
  let seconds = 0;
  let timerId = 0;
  let skillReady = true;
  let skillArmed = false;
  let soulTimer = 0;
  let view: 'closed' | 'menu' | 'game' | 'frog' | 'plane' = 'closed';

  const cellEls: HTMLButtonElement[] = [];
  const fragment = document.createDocumentFragment();

  for (let i = 0; i < TOTAL; i++) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'cell';
    button.dataset.index = String(i);
    button.setAttribute('aria-label', `第 ${Math.floor(i / COLS) + 1} 行，第 ${(i % COLS) + 1} 列`);
    fragment.appendChild(button);
    cellEls.push(button);
  }
  boardEl.appendChild(fragment);

  const neighborsOf = (index: number): number[] => {
    const row = Math.floor(index / COLS);
    const col = index % COLS;
    const list: number[] = [];
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const r = row + dr;
        const c = col + dc;
        if (r >= 0 && r < ROWS && c >= 0 && c < COLS) list.push(r * COLS + c);
      }
    }
    return list;
  };

  const cellLabel = (index: number, cell: CellState): string => {
    const row = Math.floor(index / COLS) + 1;
    const col = (index % COLS) + 1;
    let state = '';
    if (cell.open) {
      state = cell.mine ? '，是暗流' : cell.count > 0 ? `，周围 ${cell.count} 处暗流` : '，空白';
    } else if (cell.flag) {
      state = '，已标记';
    }
    return `第 ${row} 行，第 ${col} 列${state}`;
  };

  const paint = (index: number): void => {
    const cell = cells[index];
    const el = cellEls[index];
    el.className = 'cell';
    el.textContent = '';
    el.removeAttribute('data-n');

    if (cell.open) {
      el.classList.add('is-open');
      if (cell.mine) {
        el.classList.add('is-mine');
      } else if (cell.count > 0) {
        el.textContent = String(cell.count);
        el.dataset.n = String(cell.count);
      }
    } else if (cell.flag) {
      el.classList.add('is-flagged');
    }

    el.setAttribute('aria-label', cellLabel(index, cell));
  };

  const setStatus = (text: string, state: Status = 'idle'): void => {
    if (!statusEl) return;
    statusEl.textContent = text;
    statusEl.dataset.state = state;
  };

  const formatTime = (value: number): string => {
    const m = String(Math.floor(value / 60)).padStart(2, '0');
    const s = String(value % 60).padStart(2, '0');
    return `${m}:${s}`;
  };

  const syncCounters = (): void => {
    if (leftEl) leftEl.textContent = String(Math.max(0, mineCount - flagCount));
    if (timeEl) timeEl.textContent = formatTime(seconds);
  };

  const setRangeFill = (): void => {
    const min = Number(range.min);
    const max = Number(range.max);
    const ratio = (Number(range.value) - min) / (max - min);
    range.style.setProperty('--p', `${ratio * 100}%`);
  };

  const syncSkill = (): void => {
    if (!skillButton) return;
    const spent = !skillReady;
    skillButton.classList.toggle('is-armed', skillArmed);
    skillButton.classList.toggle('is-spent', spent);
    skillButton.setAttribute('aria-pressed', String(skillArmed));
    skillButton.setAttribute('aria-disabled', String(spent || over));
  };

  const speak = (): void => {
    if (!soulLine) return;
    soulLine.classList.add('is-saying');
    window.clearTimeout(soulTimer);
    soulTimer = window.setTimeout(() => soulLine.classList.remove('is-saying'), 3000);
  };

  const stopClock = (): void => {
    if (timerId) {
      window.clearInterval(timerId);
      timerId = 0;
    }
  };

  const startClock = (): void => {
    if (timerId) return;
    timerId = window.setInterval(() => {
      seconds += 1;
      syncCounters();
    }, 1000);
  };

  const reset = (): void => {
    stopClock();
    started = false;
    over = false;
    flagCount = 0;
    revealedCount = 0;
    seconds = 0;
    cells = Array.from({ length: TOTAL }, () => ({ mine: false, open: false, flag: false, count: 0 }));

    cellEls.forEach((el, index) => {
      el.className = 'cell';
      el.textContent = '';
      el.removeAttribute('data-n');
      el.disabled = false;
      el.setAttribute('aria-label', `第 ${Math.floor(index / COLS) + 1} 行，第 ${(index % COLS) + 1} 列`);
    });

    setStatus('水很静，先从任意一格开始。');
    syncCounters();
    setRangeFill();

    skillReady = true;
    skillArmed = false;
    syncSkill();

    window.clearTimeout(soulTimer);
    soulLine?.classList.remove('is-saying');
  };

  const generate = (safeIndex: number): void => {
    const forbidden = new Set<number>([safeIndex, ...neighborsOf(safeIndex)]);
    const pool: number[] = [];
    for (let i = 0; i < TOTAL; i++) {
      if (!forbidden.has(i)) pool.push(i);
    }

    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = pool[i];
      pool[i] = pool[j];
      pool[j] = temp;
    }

    const placed = Math.min(mineCount, pool.length);
    for (let i = 0; i < placed; i++) cells[pool[i]].mine = true;

    for (let i = 0; i < TOTAL; i++) {
      if (cells[i].mine) continue;
      cells[i].count = neighborsOf(i).filter((n) => cells[n].mine).length;
    }
  };

  const finishWithLoss = (): void => {
    over = true;
    stopClock();
    cells.forEach((cell, index) => {
      if (cell.mine && !cell.flag) {
        cellEls[index].classList.add('is-open', 'is-mine');
      } else if (!cell.mine && cell.flag) {
        cellEls[index].classList.add('is-wrong');
      }
    });
    setStatus('暗流翻涌，再来一次。', 'lose');
    syncSkill();
  };

  const finishWithWin = (): void => {
    over = true;
    stopClock();
    cells.forEach((cell, index) => {
      if (cell.mine && !cell.flag) {
        cell.flag = true;
        flagCount += 1;
        paint(index);
      }
    });
    syncCounters();
    setStatus('水面重归平静。', 'win');
    syncSkill();
  };

  const revealFrom = (start: number): void => {
    const stack = [start];
    while (stack.length > 0) {
      const index = stack.pop() as number;
      const cell = cells[index];
      if (cell.open || cell.flag) continue;

      cell.open = true;
      revealedCount += 1;
      paint(index);

      if (cell.mine) {
        finishWithLoss();
        return;
      }

      if (cell.count === 0) {
        for (const next of neighborsOf(index)) {
          const neighbor = cells[next];
          if (!neighbor.open && !neighbor.flag) stack.push(next);
        }
      }
    }

    if (revealedCount === TOTAL - mineCount) finishWithWin();
  };

  const useSkill = (index: number): void => {
    if (!skillReady || over) return;

    skillArmed = false;
    skillReady = false;
    syncSkill();

    if (!started) {
      started = true;
      generate(index);
      startClock();
    }

    const row = Math.floor(index / COLS);
    const col = index % COLS;
    let opened = 0;

    for (let r = row - 2; r <= row + 2; r++) {
      for (let c = col - 2; c <= col + 2; c++) {
        if (r < 0 || r >= ROWS || c < 0 || c >= COLS) continue;
        const target = cells[r * COLS + c];
        if (target.open || target.mine) continue;
        if (target.flag) {
          target.flag = false;
          flagCount -= 1;
        }
        target.open = true;
        revealedCount += 1;
        opened += 1;
        paint(r * COLS + c);
      }
    }

    syncCounters();
    speak();
    setStatus(opened > 0 ? '五乘五之内，暗流已被湮灭。' : '这一片水面早已平静。');
    if (revealedCount === TOTAL - mineCount) finishWithWin();
  };

  const toggleFlag = (index: number): void => {
    const cell = cells[index];
    if (!cell || cell.open || over) return;
    cell.flag = !cell.flag;
    flagCount += cell.flag ? 1 : -1;
    paint(index);
    syncCounters();
  };

  boardEl.addEventListener('click', (event) => {
    const target = (event.target as HTMLElement).closest<HTMLButtonElement>('button[data-index]');
    if (!target || over) return;

    const index = Number(target.dataset.index);
    const cell = cells[index];
    if (!cell || cell.open) return;

    if (skillArmed) {
      useSkill(index);
      return;
    }

    if (flagMode) {
      toggleFlag(index);
      return;
    }
    if (cell.flag) return;

    if (!started) {
      started = true;
      generate(index);
      setStatus('水面动了，慢慢来。');
      startClock();
    }

    revealFrom(index);
  });

  boardEl.addEventListener('contextmenu', (event) => {
    event.preventDefault();
    if (over) return;
    const target = (event.target as HTMLElement).closest<HTMLButtonElement>('button[data-index]');
    if (target) toggleFlag(Number(target.dataset.index));
  });

  for (const button of modeButtons) {
    button.addEventListener('click', () => {
      flagMode = button.dataset.mode === 'flag';
      for (const other of modeButtons) {
        const active = other === button;
        other.classList.toggle('is-active', active);
        other.setAttribute('aria-pressed', String(active));
      }
    });
  }

  range.addEventListener('input', () => {
    mineCount = Number(range.value);
    if (countLabel) countLabel.textContent = String(mineCount);
    setRangeFill();
  });

  range.addEventListener('change', () => {
    mineCount = Number(range.value);
    if (countLabel) countLabel.textContent = String(mineCount);
    reset();
  });

  restartButton?.addEventListener('click', reset);

  const renderView = (): void => {
    const open = view !== 'closed';
    stage?.classList.toggle('is-game', open);
    toggleButton.textContent = open ? '合上水面' : '拨开水面';
    toggleButton.setAttribute('aria-expanded', String(open));

    const menuOpen = view === 'menu';
    if (library) {
      library.classList.toggle('is-open', menuOpen);
      library.setAttribute('aria-hidden', String(!menuOpen));
      library.toggleAttribute('inert', !menuOpen);
    }

    const gameOpen = view === 'game';
    layer.classList.toggle('is-open', gameOpen);
    layer.setAttribute('aria-hidden', String(!gameOpen));
    layer.toggleAttribute('inert', !gameOpen);

    if (view === 'frog') runner?.open();
    else runner?.close();

    if (view === 'plane') plane?.open();
    else plane?.close();
  };

  const openMenu = (): void => {
    view = 'menu';
    if (libraryNote) libraryNote.textContent = '';
    reset();
    renderView();
  };

  const closeAll = (): void => {
    view = 'closed';
    renderView();
  };

  toggleButton.addEventListener('click', () => {
    if (view === 'closed') openMenu();
    else closeAll();
  });

  for (const button of libraryButtons) {
    button.addEventListener('click', () => {
      const choice = button.dataset.libraryGame;
      if (choice === 'lee') {
        view = 'game';
        reset();
        renderView();
        return;
      }
      if (choice === 'lucia') {
        view = 'frog';
        reset();
        renderView();
        return;
      }
      if (choice === 'liv') {
        view = 'plane';
        reset();
        renderView();
        return;
      }
      if (libraryNote) libraryNote.textContent = '这片水面还没铺好，先陪火子哥扫一局吧。';
    });
  }

  skillButton?.addEventListener('click', () => {
    if (!skillReady || over) return;
    skillArmed = !skillArmed;
    syncSkill();
    setStatus(skillArmed ? '扫描已就绪，点击任意格子释放。' : '水很静，先从任意一格开始。');
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && view !== 'closed') closeAll();
  });

  setRangeFill();
  reset();
}
