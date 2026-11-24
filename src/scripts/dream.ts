const MAX_RIPPLES = 12;

const MEDIA = {
  video: '/media/bg-dream.mp4',
  audio: '/media/her-dream.mp3',
} as const;

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

/**
 * 单次片元着色器：把背景影像做成水面。
 * 鼠标/点击生成的涟漪会真实地扭曲画面，并伴着一圈圈冷色微光。
 */
const FRAG = `
precision highp float;

varying vec2 vUv;

uniform vec2 uRes;
uniform float uTime;
uniform vec2 uMouse;
uniform vec2 uCover;
uniform float uHasVideo;
uniform sampler2D uVideo;
uniform vec4 uRipples[${MAX_RIPPLES}];

const float RIPPLE_LIFE = 7.0;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

vec3 sceneColor(vec2 uv) {
  vec2 suv = clamp((uv - 0.5) * uCover + 0.5, 0.0, 1.0);
  vec3 videoColor = texture2D(uVideo, suv).rgb;

  float g = smoothstep(0.0, 1.0, uv.y);
  vec3 bg = mix(vec3(0.012, 0.028, 0.055), vec3(0.085, 0.205, 0.29), g);
  float bloom = exp(-length((uv - vec2(0.62, 0.68)) * vec2(1.8, 1.0)) * 3.4);
  bg += vec3(0.15, 0.27, 0.34) * bloom * 0.55;

  return mix(bg, videoColor, uHasVideo);
}

void main() {
  vec2 uv = vUv;
  float aspect = uRes.x / max(uRes.y, 1.0);
  vec2 p = (uv - 0.5) * vec2(aspect, 1.0);

  // 缓慢的呼吸式水波，让静止画面也活着
  float swell =
    sin(p.x * 9.0 + uTime * 0.52) * 0.0019 +
    sin(p.y * 12.0 - uTime * 0.37) * 0.0016 +
    sin((p.x + p.y) * 5.0 + uTime * 0.24) * 0.0012;

  vec2 disp = vec2(swell, -swell * 0.65);
  float glow = 0.0;

  for (int i = 0; i < ${MAX_RIPPLES}; i++) {
    vec4 r = uRipples[i];
    if (r.w <= 0.001) { continue; }

    float age = uTime - r.z;
    if (age < 0.0 || age > RIPPLE_LIFE) { continue; }

    vec2 delta = (uv - r.xy) * vec2(aspect, 1.0);
    float dist = length(delta) + 0.0001;
    float front = age * 0.34;
    float rel = dist - front;

    float ring = sin(rel * 25.0) * exp(-abs(rel) * 7.2);
    float decay = exp(-age * 0.82);
    float fall = 1.0 / (1.0 + dist * 4.6);
    float amp = r.w * 0.0078 * decay * fall;

    disp += (delta / dist) * ring * amp;
    glow += exp(-abs(rel) * 9.0) * decay * fall * r.w * 0.5;
  }

  // 指针周围的一小片光，像水面上的月光
  float aura = exp(-length((uv - uMouse) * vec2(aspect, 1.0)) * 3.1);
  disp += (uv - uMouse) * aura * 0.0038;
  glow += aura * 0.055;

  // 极轻的色散，让涟漪边缘有玻璃般的厚度
  float aberr = length(disp) * 0.28;
  vec3 col;
  col.r = sceneColor(uv + disp + vec2(aberr, 0.0)).r;
  col.g = sceneColor(uv + disp).g;
  col.b = sceneColor(uv + disp - vec2(aberr, 0.0)).b;

  // 冷调分级：压住饱和，把暗部推向夜蓝
  float lum = dot(col, vec3(0.299, 0.587, 0.114));
  col = mix(col, col * vec3(0.9, 0.97, 1.1), 0.45);
  col = mix(vec3(0.012, 0.032, 0.065), col, 0.28 + 0.72 * smoothstep(0.0, 0.4, lum));
  col += vec3(0.52, 0.76, 0.9) * glow;

  // 光尘：三层视差，缓慢上浮
  float motes = 0.0;
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    vec2 grid = uv * (4.0 + fi * 2.4);
    grid.y += uTime * (0.022 + fi * 0.012);
    grid.x += uTime * 0.004 + (uv.y - 0.5) * 0.02;
    vec2 cell = floor(grid);
    vec2 f = fract(grid) - 0.5;
    float h = hash(cell + fi * 17.0);
    if (h > 0.875) {
      vec2 c = (vec2(hash(cell + 3.1), hash(cell + 9.7)) - 0.5) * 0.66;
      float d = length(f - c);
      motes += smoothstep(0.06, 0.0, d) * (0.35 + 0.65 * hash(cell + 5.3));
    }
  }
  motes *= 0.72 + 0.28 * sin(uTime * 1.6);
  col += vec3(0.7, 0.87, 0.96) * motes * 0.2;

  // 暗角与颗粒，收住整幅画面
  float vig = smoothstep(1.42, 0.28, length(p));
  col *= 0.56 + 0.52 * vig;
  col += (hash(uv * uRes + fract(uTime) * 97.0) - 0.5) * 0.017;

  gl_FragColor = vec4(col, 1.0);
}
`;

interface GLRenderer {
  draw: () => void;
  resize: () => void;
}

function compile(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.warn('[dream] shader error:', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createGLRenderer(
  canvas: HTMLCanvasElement,
  video: HTMLVideoElement,
  ripples: Ripple[],
  clock: () => number,
): GLRenderer | null {
  const gl = canvas.getContext('webgl', {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: 'high-performance',
  });
  if (!gl) return null;

  const vs = compile(gl, gl.VERTEX_SHADER, VERT);
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return null;

  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.warn('[dream] program error:', gl.getProgramInfoLog(program));
    return null;
  }
  gl.useProgram(program);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(program, 'aPos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const uRes = gl.getUniformLocation(program, 'uRes');
  const uTime = gl.getUniformLocation(program, 'uTime');
  const uMouse = gl.getUniformLocation(program, 'uMouse');
  const uCover = gl.getUniformLocation(program, 'uCover');
  const uHasVideo = gl.getUniformLocation(program, 'uHasVideo');
  const uVideo = gl.getUniformLocation(program, 'uVideo');
  const uRipples = gl.getUniformLocation(program, 'uRipples');

  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    1,
    1,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    new Uint8Array([6, 14, 24, 255]),
  );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.uniform1i(uVideo, 0);

  // 先把画面缩到 1024，再上传纹理，避免每帧传几十 MB
  const texCanvas = document.createElement('canvas');
  const texCtx = texCanvas.getContext('2d');
  const rippleBuffer = new Float32Array(MAX_RIPPLES * 4);
  let textureReady = false;
  let textureDirty = true;
  let lastVideoTime = -1;
  const hasFrameCallback = 'requestVideoFrameCallback' in video;

  // 只在视频真正产出新帧时更新纹理，而不是每个 rAF 都 drawImage + texImage2D
  if (hasFrameCallback) {
    const onFrame = () => {
      textureDirty = true;
      video.requestVideoFrameCallback(onFrame);
    };
    video.requestVideoFrameCallback(onFrame);
  }
  video.addEventListener('loadeddata', () => {
    textureDirty = true;
  });
  video.addEventListener('seeked', () => {
    textureDirty = true;
  });

  const resize = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const compact = Math.min(w, h) < 760;
    let dpr = Math.min(window.devicePixelRatio || 1, compact ? 1.35 : 1.5);
    const maxPixels = compact ? 1_200_000 : 1_900_000;
    if (w * h * dpr * dpr > maxPixels) dpr = Math.sqrt(maxPixels / (w * h));
    canvas.width = Math.max(2, Math.round(w * dpr));
    canvas.height = Math.max(2, Math.round(h * dpr));
    gl.viewport(0, 0, canvas.width, canvas.height);
  };

  const upload = () => {
    if (video.readyState < 2 || !video.videoWidth) return false;
    if (hasFrameCallback) {
      if (!textureDirty) return textureReady;
    } else if (video.currentTime === lastVideoTime) {
      return textureReady;
    }
    textureDirty = false;
    lastVideoTime = video.currentTime;

    const vw = video.videoWidth;
    const vh = video.videoHeight;
    const scale = Math.min(1, 1024 / Math.max(vw, vh));
    const tw = Math.max(2, Math.round(vw * scale));
    const th = Math.max(2, Math.round(vh * scale));
    if (texCanvas.width !== tw || texCanvas.height !== th) {
      texCanvas.width = tw;
      texCanvas.height = th;
    }
    texCtx?.drawImage(video, 0, 0, tw, th);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texCanvas);
    textureReady = true;
    return true;
  };

  const draw = () => {
    const t = clock();
    upload();
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.useProgram(program);
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform1f(uTime, t);
    gl.uniform2f(uMouse, mouseUv.x, mouseUv.y);
    gl.uniform1f(uHasVideo, textureReady ? 1 : 0);

    const vw = video.videoWidth || 16;
    const vh = video.videoHeight || 9;
    const videoAspect = vw / vh;
    const canvasAspect = canvas.width / canvas.height;
    if (canvasAspect > videoAspect) {
      gl.uniform2f(uCover, videoAspect / canvasAspect, 1);
    } else {
      gl.uniform2f(uCover, 1, canvasAspect / videoAspect);
    }

    for (let i = 0; i < MAX_RIPPLES; i++) {
      const r = ripples[i];
      const age = t - r.born;
      const alive = age >= 0 && age <= 7 && r.strength > 0 ? r.strength : 0;
      rippleBuffer[i * 4] = r.x;
      rippleBuffer[i * 4 + 1] = r.y;
      rippleBuffer[i * 4 + 2] = r.born;
      rippleBuffer[i * 4 + 3] = alive;
    }
    gl.uniform4fv(uRipples, rippleBuffer);

    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  return { draw, resize };
}

let mouseUv = { x: 0.5, y: 0.5 };

interface Ripple {
  x: number;
  y: number;
  born: number;
  strength: number;
}

function createFallbackRenderer(
  canvas: HTMLCanvasElement,
  ripples: Ripple[],
  clock: () => number,
): GLRenderer | null {
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(2, Math.round(window.innerWidth * dpr));
    canvas.height = Math.max(2, Math.round(window.innerHeight * dpr));
  };

  const draw = () => {
    const w = canvas.width;
    const h = canvas.height;
    const t = clock();
    const unit = Math.min(w, h);
    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'lighter';

    for (const r of ripples) {
      const age = t - r.born;
      if (age < 0 || age > 6 || r.strength <= 0) continue;
      const life = 1 - age / 6;
      const radius = age * unit * 0.34;
      ctx.beginPath();
      ctx.arc(r.x * w, (1 - r.y) * h, radius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(170, 225, 242, ${life * r.strength * 0.38})`;
      ctx.lineWidth = 0.6 + life * unit * 0.0025;
      ctx.stroke();
    }

    const aura = ctx.createRadialGradient(
      mouseUv.x * w,
      (1 - mouseUv.y) * h,
      0,
      mouseUv.x * w,
      (1 - mouseUv.y) * h,
      unit * 0.34,
    );
    aura.addColorStop(0, 'rgba(150, 215, 238, 0.1)');
    aura.addColorStop(1, 'rgba(150, 215, 238, 0)');
    ctx.fillStyle = aura;
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'source-over';
  };

  return { draw, resize };
}

export function initDream(): void {
  const stage = document.querySelector<HTMLElement>('[data-stage]');
  const video = document.querySelector<HTMLVideoElement>('[data-sky]');
  const canvas = document.querySelector<HTMLCanvasElement>('[data-ripples]');
  const gate = document.querySelector<HTMLElement>('[data-gate]');
  const audio = document.querySelector<HTMLAudioElement>('[data-audio]');
  const frame = document.querySelector<HTMLElement>('[data-frame]');
  const enterButton = document.querySelector<HTMLButtonElement>('[data-enter]');
  const toggles = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-audio-toggle]'));
  const progressEl = document.querySelector<HTMLElement>('[data-progress]');
  const currentEl = document.querySelector<HTMLElement>('[data-current]');
  const durationEl = document.querySelector<HTMLElement>('[data-duration]');
  const loadEl = document.querySelector<HTMLElement>('[data-gate-load]');
  const loadBar = document.querySelector<HTMLElement>('[data-load-bar]');
  const loadFill = document.querySelector<HTMLElement>('[data-load-fill]');
  const loadPct = document.querySelector<HTMLElement>('[data-load-pct]');
  const loadLabel = document.querySelector<HTMLElement>('[data-load-label]');
  const gateNote = document.querySelector<HTMLElement>('[data-gate-note]');

  if (!stage || !video || !canvas || !gate || !audio) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const startedAt = performance.now();
  const clock = () => (performance.now() - startedAt) / 1000;

  const ripples: Ripple[] = Array.from({ length: MAX_RIPPLES }, () => ({
    x: 0,
    y: 0,
    born: -100,
    strength: 0,
  }));
  let cursor = 0;

  const spawn = (x: number, y: number, strength: number, delay = 0) => {
    const ripple = ripples[cursor];
    cursor = (cursor + 1) % MAX_RIPPLES;
    ripple.x = x;
    ripple.y = y;
    ripple.born = clock() - delay;
    ripple.strength = strength;
  };

  const burst = (x: number, y: number, strength: number) => {
    spawn(x, y, strength);
    spawn(x, y, strength * 0.6, 0.18);
    spawn(x, y, strength * 0.36, 0.34);
  };

  // ---------- 指针 ----------
  const pointer = { x: 0.5, y: 0.5 };
  let lastSpawnAt = 0;
  let lastPoint = { x: -10, y: -10 };

  const toUv = (clientX: number, clientY: number) => ({
    x: clientX / window.innerWidth,
    y: 1 - clientY / window.innerHeight,
  });

  const onMove = (event: PointerEvent) => {
    const uv = toUv(event.clientX, event.clientY);
    pointer.x = uv.x;
    pointer.y = uv.y;

    if (frame) {
      frame.style.setProperty('--px', ((uv.x - 0.5) * 2 * 0.6).toFixed(3));
      frame.style.setProperty('--py', ((uv.y - 0.5) * 2 * -0.6).toFixed(3));
    }

    if (reduced) return;
    const t = clock();
    const moved = Math.hypot(uv.x - lastPoint.x, uv.y - lastPoint.y);
    if (t - lastSpawnAt > 0.11 && moved > 0.014) {
      spawn(uv.x, uv.y, 0.24);
      lastSpawnAt = t;
      lastPoint = uv;
    }
  };

  const onDown = (event: PointerEvent) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    const uv = toUv(event.clientX, event.clientY);
    if (!reduced) burst(uv.x, uv.y, 0.95);
  };

  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('pointerdown', onDown, { passive: true });

  // ---------- 渲染 ----------
  const glRenderer = reduced ? null : createGLRenderer(canvas, video, ripples, clock);
  const renderer = glRenderer ?? createFallbackRenderer(canvas, ripples, clock);

  if (glRenderer) {
    stage.classList.add('is-shader');
  }

  let rafId = 0;
  const loop = () => {
    rafId = requestAnimationFrame(loop);
    mouseUv.x += (pointer.x - mouseUv.x) * 0.07;
    mouseUv.y += (pointer.y - mouseUv.y) * 0.07;
    renderer?.draw();
  };

  const onResize = () => {
    renderer?.resize();
    if (reduced) renderer?.draw();
  };

  window.addEventListener('resize', onResize);
  onResize();

  if (reduced) {
    mouseUv = { ...pointer };
    const drawOnce = () => renderer?.draw();
    video.addEventListener('loadeddata', drawOnce, { once: true });
    setTimeout(drawOnce, 400);
    // 尊重「减少动态效果」：画面停在第一帧
    video.addEventListener('loadeddata', () => video.pause(), { once: true });
    if (video.readyState >= 2) video.pause();
  } else {
    loop();
  }

  if (!reduced) {
    setInterval(() => {
      if (document.hidden || !stage.classList.contains('is-entered')) return;
      spawn(0.16 + Math.random() * 0.68, 0.34 + Math.random() * 0.36, 0.26);
    }, 6400);
  }

  // ---------- 声音 ----------
  const formatTime = (value: number) => {
    if (!Number.isFinite(value)) return '00:00';
    const total = Math.floor(value);
    const m = String(Math.floor(total / 60)).padStart(2, '0');
    const s = String(total % 60).padStart(2, '0');
    return `${m}:${s}`;
  };

  const syncPlaying = () => {
    const playing = !audio.paused && !audio.ended;
    stage.classList.toggle('is-playing', playing);
    for (const button of toggles) {
      button.setAttribute('aria-pressed', String(playing));
      button.setAttribute('aria-label', playing ? '暂停背景音乐' : '播放背景音乐');
    }
  };

  const fadeIn = () => {
    const startedAtVolume = performance.now();
    const step = () => {
      if (audio.paused) return;
      const k = Math.min(1, (performance.now() - startedAtVolume) / 1800);
      audio.volume = 0.55 * (0.25 + 0.75 * k);
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  const startAudio = () => {
    audio.volume = 0.12;
    const promise = audio.play();
    if (promise) {
      promise.then(fadeIn).catch(() => syncPlaying());
    }
  };

  audio.addEventListener('play', syncPlaying);
  audio.addEventListener('pause', syncPlaying);
  audio.addEventListener('ended', syncPlaying);
  audio.addEventListener('loadedmetadata', () => {
    if (durationEl) durationEl.textContent = formatTime(audio.duration);
  });
  audio.addEventListener('timeupdate', () => {
    const ratio = audio.duration ? audio.currentTime / audio.duration : 0;
    if (progressEl) progressEl.style.width = `${Math.min(100, ratio * 100)}%`;
    if (currentEl) currentEl.textContent = formatTime(audio.currentTime);
  });

  for (const button of toggles) {
    button.addEventListener('click', () => {
      if (audio.paused) startAudio();
      else audio.pause();
    });
  }

  // ---------- 媒体预载与入场进度 ----------
  interface LoadTrack {
    loaded: number;
    total: number;
  }

  const videoTrack: LoadTrack = { loaded: 0, total: 0 };
  const audioTrack: LoadTrack = { loaded: 0, total: 0 };
  let ready = false;

  const paintProgress = () => {
    if (!loadEl) return;
    if (!videoTrack.total || !audioTrack.total) {
      loadEl.classList.add('is-indeterminate');
      return;
    }
    loadEl.classList.remove('is-indeterminate');
    const loaded =
      Math.min(videoTrack.loaded, videoTrack.total) +
      Math.min(audioTrack.loaded, audioTrack.total);
    const total = videoTrack.total + audioTrack.total;
    const pct = Math.max(0, Math.min(100, Math.round((loaded / total) * 100)));
    if (loadFill) loadFill.style.width = `${pct}%`;
    if (loadPct) loadPct.textContent = `${pct}%`;
    if (loadBar) loadBar.setAttribute('aria-valuenow', String(pct));
  };

  // 流式读取媒体并汇报字节进度，读完后再交给 video/audio，播放时不必再等网络
  const readMedia = async (url: string, track: LoadTrack): Promise<Blob> => {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const declared = Number(response.headers.get('content-length'));
    if (Number.isFinite(declared) && declared > 0) track.total = declared;
    paintProgress();

    if (!response.body) {
      const blob = await response.blob();
      track.total = track.total || blob.size;
      track.loaded = blob.size;
      paintProgress();
      return blob;
    }

    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let received = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      chunks.push(value);
      received += value.byteLength;
      track.loaded = received;
      paintProgress();
    }

    const blob = new Blob(chunks as BlobPart[], {
      type: response.headers.get('content-type') ?? '',
    });
    track.total = track.total || blob.size;
    track.loaded = blob.size;
    paintProgress();
    return blob;
  };

  const waitForVideo = (event: string, timeout: number) =>
    new Promise<void>((resolve) => {
      const done = () => {
        video.removeEventListener(event, done);
        clearTimeout(timer);
        resolve();
      };
      const timer = setTimeout(done, timeout);
      video.addEventListener(event, done, { once: true });
    });

  const revealEnter = () => {
    if (ready) return;
    ready = true;
    gate.classList.add('is-ready');
    if (enterButton) enterButton.disabled = false;
    if (loadLabel) loadLabel.textContent = '梦境已经就绪';
    if (gateNote) gateNote.textContent = '打开声音，梦境更完整';
    if (!reduced) video.play().catch(() => undefined);
  };

  const boot = async () => {
    try {
      const [videoBlob, audioBlob] = await Promise.all([
        readMedia(MEDIA.video, videoTrack),
        readMedia(MEDIA.audio, audioTrack),
      ]);
      video.src = URL.createObjectURL(videoBlob);
      audio.src = URL.createObjectURL(audioBlob);
      video.load();
      audio.load();
      await waitForVideo('loadeddata', 4000);
      revealEnter();
    } catch (error) {
      // 网络或服务器不支持流式读取时，退回按需加载，避免卡在进度界面
      console.warn('[dream] 媒体预载失败，回退到流式播放', error);
      loadEl?.classList.add('is-indeterminate');
      if (loadLabel) loadLabel.textContent = '正在直接载入梦境';
      video.preload = 'auto';
      audio.preload = 'auto';
      video.src = MEDIA.video;
      audio.src = MEDIA.audio;
      video.load();
      audio.load();
      await waitForVideo('canplay', 6000);
      revealEnter();
    }
  };

  // ---------- 入场 ----------
  const enter = () => {
    if (!ready || stage.classList.contains('is-entered')) return;
    stage.classList.add('is-entered');
    gate.setAttribute('aria-hidden', 'true');
    burst(0.5, 0.54, 1);
    startAudio();
    if (!reduced) video.play().catch(() => undefined);
  };

  gate.addEventListener('click', enter);
  enterButton?.addEventListener('click', (event) => {
    event.stopPropagation();
    enter();
  });

  // 页面隐藏时停下背景影像与渲染循环，回来后再继续
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      video.pause();
      if (!reduced) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
      return;
    }
    if (!reduced) {
      video.play().catch(() => undefined);
      if (!rafId) loop();
    }
  });

  boot();
}
