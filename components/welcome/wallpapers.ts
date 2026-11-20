export const wallpapers = {
  pond: 'lily pond',
  reeds: 'reed bed',
  swallows: 'swallows',
  pines: 'mist in the pines',
  moths: 'moths at dusk'
} as const;

export type Wallpaper = keyof typeof wallpapers;
export const isWallpaper = (value: unknown): value is Wallpaper =>
  typeof value === 'string' && Object.hasOwn(wallpapers, value);

type Brush = CanvasRenderingContext2D;
type Scene = (ctx: Brush, w: number, h: number, turn: number) => void;
const tau = 2 * Math.PI;
const ink = ['#121d19', '#1f3028', '#2b4135', '#3c5443', '#536c54', '#70876a', '#95a383', '#bec2a2'];

function seed(n: number) {
  const t = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return t - Math.floor(t);
}

function dot(ctx: Brush, x: number, y: number, w = 1, h = 1) {
  ctx.fillRect(Math.round(x), Math.round(y), w, h);
}

function oval(ctx: Brush, x: number, y: number, rx: number, ry: number, rim = false) {
  for (let dy = -ry; dy <= ry; dy++) {
    const dx = Math.round(rx * Math.sqrt(1 - (dy / ry) ** 2));
    if (rim && Math.abs(dy) < ry) {
      dot(ctx, x - dx, y + dy, 2);
      dot(ctx, x + dx - 1, y + dy, 2);
    } else {
      dot(ctx, x - dx, y + dy, dx * 2 + 1);
    }
  }
}

const pond: Scene = (ctx, w, h, turn) => {
  ctx.fillStyle = ink[1];
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = ink[2];
  for (let i = 0; i < w; i++) {
    dot(ctx, seed(i) * w + 2 * Math.sin(tau * (turn + seed(i + 75))), seed(i + 42) * h, 2 + Math.floor(seed(i + 9) * 7));
  }
  for (let i = 0; i < 12; i++) {
    const age = (turn * 3 + seed(i + 2)) % 1;
    const rx = Math.round(2 + age * 13);
    ctx.fillStyle = age > .65 ? ink[2] : ink[3];
    oval(ctx, seed(i + 60) * w, seed(i + 76) * h, rx, Math.max(1, Math.round(rx / 3)), true);
  }
  for (let i = 0; i < 27; i++) {
    const bank = i % 4;
    const x = [0.09, .82, .96, .28][bank] * w + (seed(i + 17) - .5) * w * .22;
    const y = [.28, .74, .18, .93][bank] * h + (seed(i + 94) - .5) * h * .2 + Math.sin(tau * turn + i);
    const rx = 4 + Math.round(seed(i + 56) * 7);
    const ry = Math.round(rx * .45);
    ctx.fillStyle = ink[0]; oval(ctx, x + 1, y + 2, rx, ry);
    ctx.fillStyle = ink[i % 3 + 3]; oval(ctx, x, y, rx, ry);
    ctx.fillStyle = ink[1];
    for (let dx = 1; dx <= rx; dx++) dot(ctx, x + dx, y + Math.floor(dx / 5), 1, 1 + Math.floor(dx / 5));
    if (i % 9 === 0) {
      ctx.fillStyle = ink[6]; dot(ctx, x - 3, y - 3, 4, 2); dot(ctx, x - 2, y - 4, 2, 4);
    }
  }
};

const reeds: Scene = (ctx, w, h, turn) => {
  ctx.fillStyle = ink[2]; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = ink[3]; oval(ctx, w * .73, h * .25, 12, 12);
  for (let i = 0; i < w * .62; i++) {
    const x = seed(i) * w;
    const height = Math.round(h * (.16 + .58 * seed(i + 7) + .18 * Math.cos(x / w * tau)));
    const sway = 3 * Math.sin(tau * turn + x / 32) + 5 * Math.sin(i);
    ctx.fillStyle = ink[i % 3 === 0 ? 1 : 3 + i % 2];
    for (let dy = 0; dy < height; dy++) {
      const t = dy / height;
      const stem = x + sway * t * t;
      dot(ctx, stem, h - dy);
      if (i % 4 === 0 && t > .75 && t < .95) dot(ctx, stem - 1, h - dy, 3);
      if (t > .18 && t < .58) dot(ctx, stem + (t - .18) * 17 * (i % 2 ? 1 : -1), h - dy);
    }
  }
  ctx.fillStyle = ink[6];
  for (let i = 0; i < 18; i++) {
    dot(ctx, ((seed(i + 90) + turn) % 1) * (w + 6) - 3, h * seed(i + 42) + 3 * Math.sin(tau * turn + i), 2);
  }
};

function ridge(ctx: Brush, w: number, h: number, base: number, layer: number) {
  for (let x = 0; x < w; x++) {
    const y = Math.round(h * base + Math.sin(x / w * 8 + layer) * h * .05 + Math.sin(x / w * 19 + layer) * h * .014);
    ctx.fillRect(x, y, 1, h - y);
  }
}

const swallows: Scene = (ctx, w, h, turn) => {
  ctx.fillStyle = ink[3]; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = ink[4]; oval(ctx, w * .17, h * .29, 13, 13);
  ctx.fillStyle = ink[2]; ridge(ctx, w, h, .73, 3);
  ctx.fillStyle = ink[1]; ridge(ctx, w, h, .84, 5);
  ctx.fillStyle = ink[0]; ridge(ctx, w, h, .95, 7);
  for (let i = 0; i < 24; i++) {
    const t = tau * turn;
    const trail = i * .22;
    const x = w * (.5 + .43 * Math.sin(t - trail)) + 8 * (seed(i) - .5);
    const y = h * (.32 + .16 * Math.sin(2*t - trail) + .12 * (seed(i + 3) - .5));
    const wing = Math.round(2 * Math.sin(8*t + i));
    ctx.fillStyle = ink[0];
    dot(ctx, x, y, 2); dot(ctx, x - 2, y + Math.sign(wing), 2); dot(ctx, x + 2, y + Math.sign(wing), 2);
    dot(ctx, x - 3, y + wing); dot(ctx, x + 4, y + wing);
  }
};

const pines: Scene = (ctx, w, h, turn) => {
  ctx.fillStyle = ink[4]; ctx.fillRect(0, 0, w, h);
  for (let layer = 0; layer < 3; layer++) {
    ctx.fillStyle = ink[3 - layer];
    const step = 5 + layer * 4;
    for (let i = -1; i < w / step + 1; i++) {
      const x = i * step;
      const y = Math.round(h * (.32 + layer * .27) + Math.sin(x / w * 9 + layer * 2) * h * .09);
      const size = Math.round((.06 + .13 * seed(i + layer * 91)) * h);
      for (let dy = 0; dy < size; dy++) {
        const spread = Math.floor((dy + 1) / size * step * .95) - (dy % 5 === 0 ? 1 : 0);
        dot(ctx, x - Math.max(0, spread), y - size + dy, Math.max(1, 2 * spread + 1));
      }
      dot(ctx, x - step / 2, y - 1, step + 1, h - y + 1);
    }
    if (layer < 2) {
      ctx.fillStyle = ink[4 - layer];
      for (let i = 0; i < 100; i++) {
        const x = ((seed(i + 33 * layer) + turn) % 1) * (w + 26) - 26;
        dot(ctx, x, h * (.31 + layer * .25 + .09 * seed(i + 12)) + 2 * Math.sin(tau * turn + i), 9 + i % 17);
      }
    }
  }
};

const moths: Scene = (ctx, w, h, turn) => {
  ctx.fillStyle = ink[0]; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = ink[2];
  for (let i = 0; i < 70; i++) dot(ctx, seed(i) * w, seed(i + 9) * h);
  const moonX = w * .77, moonY = h * .23;
  ctx.fillStyle = ink[5]; oval(ctx, moonX, moonY, 9, 9);
  ctx.fillStyle = ink[0]; oval(ctx, moonX - 4, moonY - 2, 8, 8);
  for (let i = 0; i < 32; i++) {
    const base = seed(i + 13) * w;
    const size = h * (.04 + .18 * seed(i));
    ctx.fillStyle = ink[1 + i % 2];
    for (let dy = 0; dy < size; dy++) {
      const x = base + dy * .22;
      dot(ctx, x, h - dy);
      if (dy % 4 === 1) {
        for (let leaf = 1; leaf < (1 - dy / size) * 7 + 1; leaf++) {
          dot(ctx, x + leaf, h - dy - leaf); dot(ctx, x - leaf, h - dy - leaf);
        }
      }
    }
  }
  for (let i = 0; i < 10; i++) {
    const beat = tau * turn;
    const x = seed(i + 2) * w + 14 * Math.sin(beat + i) + 5 * Math.sin(3 * beat - i);
    const y = (.14 + seed(i + 41) * .65) * h + 9 * Math.cos(2 * beat + i);
    const wing = Math.sin(beat * 12 + i) > 0 ? 2 : 1;
    ctx.fillStyle = ink[i % 2 + 4];
    dot(ctx, x - wing, y - 1, wing, 2); dot(ctx, x + 1, y - 1, wing, 2);
    ctx.fillStyle = ink[6]; dot(ctx, x, y, 1, 2);
  }
};

export const paintWallpaper: Record<Wallpaper, Scene> = { pond, reeds, swallows, pines, moths };
