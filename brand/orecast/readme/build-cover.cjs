/**
 * Regenerate the README cover with Node.js and @napi-rs/canvas available.
 * Run from the repository root: node brand/orecast/readme/build-cover.cjs
 * The renderer is an authoring tool, not an application dependency.
 * All type and colours come from the committed Orecast kit. No network access.
 */
const fs = require('node:fs');
const path = require('node:path');
const { createCanvas, GlobalFonts } = require('@napi-rs/canvas');

const kit = path.resolve(__dirname, '..');
const tokens = JSON.parse(fs.readFileSync(path.join(kit, 'tokens.json'), 'utf8'));
const C = tokens.palette;
const regular = path.join(kit, tokens.typography.fontFiles.regular);
const light = path.join(kit, tokens.typography.fontFiles.light);
if (!GlobalFonts.registerFromPath(regular, 'Orecast Regular')) throw new Error('DM Sans Regular is unavailable');
if (!GlobalFonts.registerFromPath(light, 'Orecast Light')) throw new Error('DM Sans Light is unavailable');

const W = 1280, H = 512, scale = 2;
const canvas = createCanvas(W * scale, H * scale);
const g = canvas.getContext('2d');
g.scale(scale, scale);
g.fillStyle = C.ink;
g.fillRect(0, 0, W, H);

function type(text, x, y, size, colour = C.paper, face = 'Orecast Regular') {
  g.font = `${size}px "${face}"`;
  g.fillStyle = colour;
  g.textBaseline = 'alphabetic';
  g.fillText(text, x, y);
}
function line(x1, y1, x2, y2, colour = C.darkRule, width = 1) {
  g.strokeStyle = colour; g.lineWidth = width;
  g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
}
function arc(radius, start, end, colour, width) {
  g.strokeStyle = colour; g.lineWidth = width;
  g.beginPath(); g.arc(994, 241, radius, start, end); g.stroke();
}

// Quiet editorial furniture, with clear space around the typographic wordmark.
type('OXHack 2026', 64, 54, 17);
line(217, 48, 249, 48, C.quiet);
line(244, 44, 249, 48, C.quiet);
line(244, 52, 249, 48, C.quiet);
type('TIME', 268, 54, 17, C.quiet);

type(tokens.name, 60, 210, 128);
type('Mineral intelligence', 65, 292, 38);
type('over time.', 65, 340, 38);

// A temporal ring, not a confidence, accuracy or return chart.
arc(174, 0, Math.PI * 2, C.rule, 1);
arc(142, 0, Math.PI * 2, C.darkRule, 1);
arc(174, -Math.PI / 2, -0.48, C.signal, 3);
for (let i = 0; i < 60; i++) {
  const a = i * Math.PI / 30 - Math.PI / 2;
  const r1 = i % 5 ? 182 : 181;
  const r2 = i % 5 ? 186 : 191;
  line(994 + Math.cos(a) * r1, 241 + Math.sin(a) * r1,
    994 + Math.cos(a) * r2, 241 + Math.sin(a) * r2,
    i % 5 ? C.darkRule : C.secondary, 1);
}
g.textAlign = 'center';
type('90', 994, 264, 116, C.paper, 'Orecast Light');
type('DAY HORIZON', 994, 306, 16, C.quiet);
g.textAlign = 'left';

line(64, 424, 1216, 424);
type('Tok River, Alaska', 64, 466, 18, C.quiet);
g.textAlign = 'right';
type('30 / 90 / 180 days', 1216, 466, 18, C.quiet);

const output = path.join(__dirname, 'cover.png');
fs.writeFileSync(output, canvas.toBuffer('image/png'));
console.log(`Created ${path.relative(process.cwd(), output)} (${W * scale} × ${H * scale})`);
