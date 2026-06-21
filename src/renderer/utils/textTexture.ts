import * as THREE from "three";

/** Extra options for the glass-etch text rendering */
export interface TextTextureOptions {
  fontSize?: number;
  font?: string;
  /** Width of the canvas texture */
  width?: number;
  /** Height of the canvas texture */
  height?: number;
  /** Text color (default: white) */
  color?: string;
  /** Shadow opacity for etch depth (default: 0.5) */
  shadowAlpha?: number;
  /** Highlight opacity for raised edge (default: 0.3) */
  highlightAlpha?: number;
  /** Outer glow color */
  glowColor?: string;
  /** Outer glow blur radius (default: 8) */
  glowBlur?: number;
}

const DEFAULTS: Required<TextTextureOptions> = {
  fontSize: 64,
  font: 'bold 64px "Inter", "Segoe UI", system-ui, sans-serif',
  width: 1024,
  height: 256,
  color: "#ffffff",
  shadowAlpha: 0.5,
  highlightAlpha: 0.3,
  glowColor: "rgba(180, 210, 255, 0.6)",
  glowBlur: 8,
};

/**
 * Render text to a CanvasTexture with a glass-etch emboss effect.
 * The text appears to be burned/etched into glass:
 *   - Dark shadow offset for depth (deboss)
 *   - Light highlight offset for raised edge
 *   - Semi-transparent main text
 *   - Outer blue glow for glass refraction
 */
export function createTextTexture(
  text: string,
  options: TextTextureOptions = {},
): THREE.CanvasTexture {
  const opts = { ...DEFAULTS, ...options };
  const canvas = document.createElement("canvas");
  canvas.width = opts.width;
  canvas.height = opts.height;
  const ctx = canvas.getContext("2d")!;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const cx = canvas.width / 2;
  const cy = canvas.height / 2;

  ctx.font = opts.font;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // 1. Shadow — deboss depth (dark, offset down-right)
  if (opts.shadowAlpha > 0) {
    ctx.fillStyle = `rgba(0, 0, 0, ${opts.shadowAlpha})`;
    ctx.fillText(text, cx + 2, cy + 2);
  }

  // 2. Highlight — raised edge (light, offset up-left)
  if (opts.highlightAlpha > 0) {
    ctx.fillStyle = `rgba(255, 255, 255, ${opts.highlightAlpha})`;
    ctx.fillText(text, cx - 1, cy - 1);
  }

  // 3. Main text — semi-transparent (glass body)
  ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
  ctx.fillText(text, cx, cy);

  // 4. Outer glow — glass refraction halo
  if (opts.glowBlur > 0) {
    ctx.shadowColor = opts.glowColor;
    ctx.shadowBlur = opts.glowBlur;
    ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
    ctx.fillText(text, cx, cy);
    ctx.shadowBlur = 0; // reset
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.premultiplyAlpha = true;
  return tex;
}
