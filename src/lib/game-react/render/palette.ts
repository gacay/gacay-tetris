export const PIECE_VARS = [
  "--piece-i",
  "--piece-o",
  "--piece-t",
  "--piece-s",
  "--piece-z",
  "--piece-j",
  "--piece-l",
];

export interface Palette {
  board: string;
  grid: string;
  ghost: string;
  stroke: string;
  pieces: string[];
}

export function readPalette(): Palette {
  if (typeof document === "undefined") {
    return {
      board: "#fff",
      grid: "#eee",
      ghost: "rgba(0,0,0,.12)",
      stroke: "rgba(255,255,255,.4)",
      pieces: ["#67e0d8", "#f7d774", "#c8a2f0", "#9be6a8", "#f79ca8", "#8fb8f6", "#f7b58c"],
    };
  }
  const cs = getComputedStyle(document.documentElement);
  const get = (v: string, fb: string) => cs.getPropertyValue(v).trim() || fb;
  return {
    board: get("--board-bg", "#fff"),
    grid: get("--board-grid", "#eee"),
    ghost: get("--ghost", "rgba(0,0,0,.12)"),
    stroke: get("--cell-stroke", "rgba(255,255,255,.4)"),
    pieces: PIECE_VARS.map((v, i) =>
      get(v, ["#67e0d8", "#f7d774", "#c8a2f0", "#9be6a8", "#f79ca8", "#8fb8f6", "#f7b58c"][i]),
    ),
  };
}

export function pieceColor(colorId: number, pal: Palette): string {
  return pal.pieces[colorId - 1] ?? "#ccc";
}

export function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

/** Draw a single filled cell with a soft highlight/shadow for a pastel-gloss look. */
export function drawCell(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  size: number,
  color: string,
  pal: Palette,
  ghost = false,
) {
  const pad = Math.max(1, size * 0.06);
  const x = px + pad / 2;
  const y = py + pad / 2;
  const s = size - pad;
  const radius = size * 0.2;

  if (ghost) {
    ctx.globalAlpha = 1;
    roundRect(ctx, x, y, s, s, radius);
    ctx.fillStyle = pal.ghost;
    ctx.fill();
    ctx.lineWidth = Math.max(1, size * 0.05);
    ctx.strokeStyle = color;
    ctx.globalAlpha = 0.5;
    ctx.stroke();
    ctx.globalAlpha = 1;
    return;
  }

  roundRect(ctx, x, y, s, s, radius);
  ctx.fillStyle = color;
  ctx.fill();

  // top-left gloss
  ctx.save();
  roundRect(ctx, x, y, s, s, radius);
  ctx.clip();
  ctx.fillStyle = "rgba(255,255,255,0.28)";
  ctx.fillRect(x, y, s, s * 0.4);
  ctx.fillStyle = "rgba(0,0,0,0.12)";
  ctx.fillRect(x, y + s * 0.68, s, s * 0.32);
  ctx.restore();

  ctx.lineWidth = 1;
  ctx.strokeStyle = pal.stroke;
  roundRect(ctx, x, y, s, s, radius);
  ctx.stroke();
}
