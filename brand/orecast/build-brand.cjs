const fs = require('node:fs');
const path = require('node:path');
const {createCanvas, GlobalFonts} = require('@napi-rs/canvas');

const root = __dirname;
const source = path.resolve(root, '../../pitch/assets/fonts');
const fontDir = path.join(root, 'fonts');
fs.mkdirSync(fontDir, {recursive: true});
for (const name of ['dm-sans-300.woff2', 'dm-sans-400.woff2', 'dm-sans-LICENSE.txt']) {
  const target = path.join(fontDir, name);
  if (!fs.existsSync(target)) fs.copyFileSync(path.join(source, name), target);
}
if (!GlobalFonts.registerFromPath(path.join(fontDir, 'dm-sans-400.woff2'), 'Orecast DM Sans')) throw new Error('Regular font could not be registered');
if (!GlobalFonts.registerFromPath(path.join(fontDir, 'dm-sans-300.woff2'), 'Orecast DM Sans Light')) throw new Error('Light font could not be registered');

const tokens = JSON.parse(fs.readFileSync(path.join(root, 'tokens.json'), 'utf8'));
const C = tokens.palette;
const metricsCanvas = createCanvas(10, 10);
const metricsContext = metricsCanvas.getContext('2d');
metricsContext.font = '160px "Orecast DM Sans"';
const measure = metricsContext.measureText('Orecast');
const pad = 48;
const ascent = Math.ceil(measure.actualBoundingBoxAscent);
const descent = Math.ceil(measure.actualBoundingBoxDescent);
const width = Math.ceil(measure.width) + pad * 2;
const height = ascent + descent + pad * 2;
const font = fs.readFileSync(path.join(fontDir, 'dm-sans-400.woff2')).toString('base64');

for (const [variant, colour] of [['ink', C.ink], ['white', C.paper]]) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="Orecast"><title>Orecast</title><defs><style>@font-face{font-family:'Orecast DM Sans';src:url('data:font/woff2;base64,${font}') format('woff2');font-weight:400;font-style:normal}</style></defs><text x="${pad}" y="${pad + ascent}" fill="${colour}" font-family="Orecast DM Sans,DM Sans,Arial,sans-serif" font-size="160" font-weight="400" letter-spacing="0">Orecast</text></svg>\n`;
  fs.writeFileSync(path.join(root, `orecast-wordmark-${variant}.svg`), svg);
  const canvas = createCanvas(width * 3, height * 3);
  const ctx = canvas.getContext('2d');
  ctx.scale(3, 3);
  ctx.font = '160px "Orecast DM Sans"';
  ctx.fillStyle = colour;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('Orecast', pad, pad + ascent);
  fs.writeFileSync(path.join(root, `orecast-wordmark-${variant}.png`), canvas.toBuffer('image/png'));
}

const board = createCanvas(2560, 1440);
const g = board.getContext('2d');
g.scale(2, 2);
g.fillStyle = C.paper;
g.fillRect(0, 0, 1280, 720);
function type(text, x, y, size, colour = C.ink, light = false) {
  g.fillStyle = colour;
  g.font = `${size}px "${light ? 'Orecast DM Sans Light' : 'Orecast DM Sans'}"`;
  g.textBaseline = 'top';
  for (const [i, line] of text.split('\n').entries()) g.fillText(line, x, y + i * size * 1.14);
}
function stroke(x1, y1, x2, y2, colour = C.ink, weight = .7) {
  g.strokeStyle = colour; g.lineWidth = weight; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
}
g.strokeStyle = C.ink; g.lineWidth = .7;
g.beginPath(); g.ellipse(56, 52, 14, 11, 0, 0, Math.PI * 2); g.stroke();
type('01', 49, 45, 10);
stroke(97, 52, 125, 52); stroke(121, 49, 125, 52); stroke(121, 55, 125, 52);
type('Orecast identity', 152, 43, 12);

type('Orecast', 42, 174, 112, C.ink);
type('Mineral intelligence\nover time.', 42, 321, 38);
type('Final algorithm name.\nDraft descriptor.', 42, 445, 21, C.secondary);

const swatches = [['Paper', C.paper], ['Ink', C.ink], ['Signal', C.signal], ['Gold', C.measuredGold]];
swatches.forEach(([name, colour], i) => {
  const x = 42 + i * 137;
  g.fillStyle = colour; g.fillRect(x, 550, 105, 24);
  g.strokeStyle = C.rule; g.lineWidth = .4; g.strokeRect(x, 550, 105, 24);
  type(name, x, 589, 12);
  type(colour, x, 610, 12, C.secondary);
});
type('White editorial pages. Charcoal evidence panels.\nRegular and light typography. Green used with purpose.', 42, 662, 12, C.secondary);

g.fillStyle = C.ink;
g.beginPath(); g.roundRect(648, 16, 616, 688, 25); g.fill();
type('Orecast', 678, 77, 104, C.paper);
type('Mineral intelligence over time', 682, 213, 21, C.quiet);
stroke(680, 277, 1234, 277, C.darkRule, .8);
type('DM Sans', 680, 324, 38, C.paper);
type('300 Light\n400 Regular', 682, 385, 25, C.paper);
function flowLine(words, x, y, leadingArrow = false) {
  const size = 28, mid = y + 17;
  const drawArrow = (left) => {
    stroke(left, mid, left + 26, mid, C.paper, .9);
    stroke(left + 21, mid - 4, left + 26, mid, C.paper, .9);
    stroke(left + 21, mid + 4, left + 26, mid, C.paper, .9);
  };
  if (leadingArrow) { drawArrow(x); x += 42; }
  words.forEach((word, i) => {
    type(word, x, y, size, C.paper);
    g.font = `${size}px "Orecast DM Sans"`;
    x += g.measureText(word).width;
    if (i < words.length - 1) { drawArrow(x + 12); x += 52; }
  });
}
flowLine(['Gold forecast', 'Mineral value'], 680, 485);
flowLine(['Assignment', 'Cash'], 680, 520, true);
g.strokeStyle = C.quiet; g.lineWidth = 1;
g.beginPath(); g.arc(1174, 593, 46, -.9, 5.38); g.stroke();
g.strokeStyle = C.signal; g.lineWidth = 2;
g.beginPath(); g.arc(1174, 593, 46, -.9, -.15); g.stroke();
type('Signal accent', 680, 601, 14, C.quiet);
type('Typography only. No separate icon required.', 680, 663, 12, C.quiet);
fs.writeFileSync(path.join(root, 'brand-board.png'), board.toBuffer('image/png'));
console.log(JSON.stringify({wordmarkViewBox: [width, height], pngScale: 3, visibleTextWidth: measure.width, brandBoard: [2560, 1440], assets: ['orecast-wordmark-ink.svg', 'orecast-wordmark-white.svg', 'orecast-wordmark-ink.png', 'orecast-wordmark-white.png', 'brand-board.png']}, null, 2));
