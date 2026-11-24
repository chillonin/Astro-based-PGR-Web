# 梦之漪 · Dream Ripple

[English](#english) · [中文](#chinese)

---

<a id="english"></a>

## English

An immersive, Punishing: Gray Raven–inspired interactive webpage. Move your mouse to ripple a WebGL water surface, play three mini-games with the Gray Raven squad, and browse the "Garden of Eden" lore in a liquid-glass wiki.

> **Live demo:** <https://dream-ripple-astro.netlify.app/>
>
> **Desktop browsers recommended** (Chrome / Edge / Firefox): the ripples rely on WebGL and the games need a keyboard and mouse.

### Features

- **Dream gate & water surface** — a loading gate intro, background video processed by a WebGL fragment shader, mouse ripples and click glows.
- **Music player** — play/pause, progress bar and time; track: *Her Dream* by Sawako.
- **Mini-game library** (click "Part the Water"):
  - *Frog Run* — Space to jump, Shift to crouch; spike density stays flat for 30 s, then grows linearly by a slider (max 3×); skill clears all spikes.
  - *Minesweeper* — adjustable mine count, timer and remaining-mine counter; skill scans a 5×5 area and reveals safe cells.
  - *Plane War* — WASD control, auto-fire, permanent pickups (damage / fire rate / speed / bullet count); enemy speed and density scale linearly per wave with separate sliders; skill grants 10 s invincibility plus an 8-direction high-damage barrage.
- **Garden of Eden wiki** — drawer-style lore panel with liquid-glass styling (layered blur, SVG refraction filter, asymmetric highlights), world/politics/military entries, and an embedded Bilibili anthem video.

### Tech Stack

Astro 7 · TypeScript · Canvas 2D · WebGL shaders · CSS `backdrop-filter` + SVG filters · Netlify.

### Project Structure

```text
public/media/        # video, audio, character art, game assets
src/components/      # WikiPanel.astro
src/data/            # wiki entries
src/layouts/         # BaseLayout.astro
src/pages/           # index.astro (layout & styles)
src/scripts/         # dream.ts, minesweeper.ts, runner.ts, plane.ts, wiki.ts
src/styles/          # global.css
```

### Getting Started

Requires Node.js 18+.

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # output to dist/
npm run preview
```

### Credits

Character art, lore and related assets belong to **KURO GAMES / Punishing: Gray Raven**. Music *Her Dream* by **Sawako**. The anthem video is hosted on Bilibili. This is a non-commercial fan project for learning and front-end practice only. Please contact for removal if needed.

[Back to top](#梦之漪--dream-ripple)

---

<a id="chinese"></a>

## 中文

一个以《战双帕弥什》为灵感的沉浸式互动网页：移动鼠标让 WebGL 水面泛起涟漪，与灰鸦小队一起玩三款小游戏，并在液态玻璃档案中翻阅「空中花园」的世界观。

> **在线体验：** <https://dream-ripple-astro.netlify.app/>
>
> **建议使用电脑浏览器**（Chrome / Edge / Firefox）：涟漪依赖 WebGL，小游戏需要键盘与鼠标。

### 功能特性

- **梦境之门与水面** — 加载之门开场，背景视频经 WebGL 片元着色器实时处理，鼠标移动产生涟漪、点击唤醒水下微光。
- **背景音乐播放器** — 播放/暂停、进度条与时间；曲目《她的梦》Sawako 碎花。
- **小游戏库**（点击「拨开水面」）：
  - **阿呆蛙快跑** — 空格跳跃、Shift 下蹲；尖刺密度前 30 秒不变，之后按滑块线性增长（最高 3 倍）；技能清除全部尖刺。
  - **扫雷** — 可调雷数、计时与剩余雷数；技能扫描 5×5 范围并点开其中的安全格。
  - **飞机大战** — WASD 操控、自动射击、四种永久补给（伤害/射速/移速/弹道）；敌人移速与密度随波次线性增长，可分别用滑块调节；技能提供 10 秒无敌与八向高伤弹幕。
- **空中花园 WIKI** — 抽屉式世界观档案，液态玻璃质感（分层模糊、SVG 折射滤镜、非对称高光），含建制与人物条目，并内嵌 B 站校歌视频。

### 技术栈

Astro 7 · TypeScript · Canvas 2D · WebGL 着色器 · CSS `backdrop-filter` + SVG 滤镜 · Netlify

### 目录结构

```text
public/media/        # 视频、音乐、角色立绘、游戏素材
src/components/      # WikiPanel.astro
src/data/            # WIKI 条目
src/layouts/         # BaseLayout.astro
src/pages/           # index.astro（页面结构与样式）
src/scripts/         # dream.ts、minesweeper.ts、runner.ts、plane.ts、wiki.ts
src/styles/          # global.css
```

### 本地运行

需要 Node.js 18 及以上。

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # 输出到 dist/
npm run preview
```

### 素材与致谢

角色影像、世界观与相关设定归 **库洛游戏《战双帕弥什》** 所有；音乐《她的梦》由 **Sawako 碎花** 创作；校歌视频来源于 B 站。本项目为非官方、非商业的学习与前端练习作品，如有侵权请联系删除。

[返回顶部](#梦之漪--dream-ripple)
