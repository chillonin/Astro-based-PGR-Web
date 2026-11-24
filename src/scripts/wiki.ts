/**
 * 空中花园 WIKI 抽屉：切换玻璃面板、进入机构子档案，并在开始播放校歌前暂停背景音乐。
 */
export function initWiki(): void {
  const root = document.querySelector<HTMLElement>('[data-wiki]');
  const stage = document.querySelector<HTMLElement>('[data-stage]');
  const toggle = document.querySelector<HTMLButtonElement>('[data-wiki-toggle]');
  const panel = document.querySelector<HTMLElement>('[data-wiki-panel]');
  const scroll = document.querySelector<HTMLElement>('[data-wiki-scroll]');
  const sub = document.querySelector<HTMLElement>('[data-wiki-sub]');
  const subScroll = document.querySelector<HTMLElement>('[data-sub-scroll]');
  const subCrumb = document.querySelector<HTMLElement>('[data-sub-crumb]');
  const back = document.querySelector<HTMLButtonElement>('[data-wiki-back]');
  const articles = Array.from(document.querySelectorAll<HTMLElement>('[data-entry-id]'));
  const cover = document.querySelector<HTMLButtonElement>('[data-video-cover]');
  const iframe = panel?.querySelector<HTMLIFrameElement>('.video-frame iframe') ?? null;
  const audio = document.querySelector<HTMLAudioElement>('[data-audio]');
  const gameToggle = document.querySelector<HTMLButtonElement>('[data-game-toggle]');

  if (!root || !stage || !toggle || !panel) return;

  const iframeSrc = iframe?.getAttribute('src') ?? '';
  let stack: string[] = [];
  let current = '';
  let lastTrigger: HTMLElement | null = null;

  const isOpen = (): boolean => root.classList.contains('is-open');
  const isSub = (): boolean => root.classList.contains('is-sub');

  const stopVideo = (): void => {
    if (!iframe || !root.classList.contains('is-video')) return;
    root.classList.remove('is-video');
    iframe.src = 'about:blank';
    cover?.removeAttribute('aria-hidden');
    if (cover) cover.tabIndex = 0;
  };

  const restoreVideo = (): void => {
    if (iframe && iframe.getAttribute('src') === 'about:blank') iframe.src = iframeSrc;
  };

  const showEntry = (id: string, push: boolean): void => {
    const target = articles.find((article) => article.dataset.entryId === id);
    if (!target) return;

    if (push && current && current !== id) stack.push(current);
    current = id;

    for (const article of articles) {
      const active = article === target;
      article.classList.toggle('is-active', active);
      article.setAttribute('aria-hidden', String(!active));
      article.toggleAttribute('inert', !active);
    }

    const name = target.querySelector<HTMLElement>('.entry-titles h3')?.textContent?.trim() ?? '档案';
    if (subCrumb) subCrumb.textContent = name;
    sub?.setAttribute('aria-label', `${name}档案`);

    root.classList.add('is-sub');
    sub?.removeAttribute('inert');
    sub?.setAttribute('aria-hidden', 'false');
    scroll?.setAttribute('aria-hidden', 'true');
    scroll?.setAttribute('inert', '');
    stopVideo();

    subScroll?.scrollTo({ top: 0, behavior: 'auto' });
    requestAnimationFrame(() => back?.focus({ preventScroll: true }));
  };

  const hideEntry = (returnFocus = true): void => {
    root.classList.remove('is-sub');
    sub?.setAttribute('aria-hidden', 'true');
    sub?.setAttribute('inert', '');
    scroll?.removeAttribute('aria-hidden');
    scroll?.removeAttribute('inert');

    for (const article of articles) {
      article.classList.remove('is-active');
      article.setAttribute('aria-hidden', 'true');
      article.setAttribute('inert', '');
    }

    current = '';
    stack = [];
    restoreVideo();

    if (returnFocus) lastTrigger?.focus({ preventScroll: true });
  };

  const setOpen = (open: boolean): void => {
    root.classList.toggle('is-open', open);
    stage.classList.toggle('is-wiki', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? '收起 WIKI 世界观' : '打开 WIKI 世界观');
    panel.setAttribute('aria-hidden', String(!open));
    panel.toggleAttribute('inert', !open);

    if (open) {
      // 与水下棋局互斥，让档案层独占画面
      if (gameToggle?.getAttribute('aria-expanded') === 'true') gameToggle.click();
      hideEntry(false);
      scroll?.scrollTo({ top: 0, behavior: 'auto' });
    } else {
      hideEntry(false);
      stopVideo();
      restoreVideo();
      cover?.removeAttribute('aria-hidden');
      if (cover) cover.tabIndex = 0;
      root.classList.remove('is-video');
    }
  };

  root.addEventListener('click', (event) => {
    const trigger = (event.target as HTMLElement | null)?.closest<HTMLElement>('[data-wiki-entry]');
    if (!trigger) return;
    const id = trigger.dataset.wikiEntry;
    if (!id) return;
    event.preventDefault();
    if (!trigger.closest('[data-wiki-sub]')) lastTrigger = trigger;
    showEntry(id, true);
  });

  back?.addEventListener('click', () => {
    const previous = stack.pop();
    if (previous) showEntry(previous, false);
    else hideEntry();
  });

  toggle.addEventListener('click', () => setOpen(!isOpen()));

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    if (isSub()) {
      const previous = stack.pop();
      if (previous) showEntry(previous, false);
      else hideEntry();
      return;
    }
    if (isOpen()) {
      setOpen(false);
      toggle.focus({ preventScroll: true });
    }
  });

  cover?.addEventListener('click', () => {
    if (audio && !audio.paused) audio.pause();
    if (iframe && iframe.getAttribute('src') === 'about:blank') iframe.src = iframeSrc;
    root.classList.add('is-video');
    cover.setAttribute('aria-hidden', 'true');
    cover.tabIndex = -1;
  });
}
