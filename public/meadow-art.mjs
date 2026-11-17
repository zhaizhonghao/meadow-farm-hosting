// Paint in map coordinates once per lighting change. The camera projects the
// finished board, so orbiting never regenerates grass, pebbles or riverbanks.
const PIXELS_PER_TILE = 36;
const PALETTES = {
  day: {
    meadow: ['#aecb8b', '#b3cf90', '#b9d294', '#bfd799', '#c4d99d'],
    grass: '#86ac71', glint: '#dfebb7', grid: '#477b5526', flower: '#fff2c8',
    shore: '#c7bd91', bank: '#9fbd83', shallow: '#9bd4c2', channel: '#63adae', current: '#c6ecdc'
  },
  night: {
    meadow: ['#759783', '#7c9d87', '#83a48e', '#8aaa94', '#90ae97'],
    grass: '#638778', glint: '#b6c9a9', grid: '#34574e26', flower: '#dadbbd',
    shore: '#a4aa91', bank: '#789a85', shallow: '#87bcb1', channel: '#5c979f', current: '#b3d4cb'
  }
};

function creekEdge(y) {
  return .09 + Math.sin(y * 1.17) * .043 + Math.sin(y * 2.41) * .021;
}

function paintMeadow(context, size, river, daylight) {
  const palette = PALETTES[daylight ? 'day' : 'night'];
  context.scale(PIXELS_PER_TILE, PIXELS_PER_TILE);
  let seed = 73419;
  const random = () => {
    seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const dot = (x, y, radius, color) => {
    context.fillStyle = color;
    context.beginPath();
    context.arc(x, y, radius, 0, 2 * Math.PI);
    context.fill();
  };
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const hummock = Math.sin(x * .57 + y * .38) + Math.cos(y * .48 - x * .3);
    const tone = Math.round(Math.max(0, Math.min(4, 2 + hummock * .67 + random() - .5)));
    context.fillStyle = palette.meadow[tone];
    context.fillRect(x, y, 1, 1);
    if (x === river) continue;
    const edge = x === 0 || y === 0 || x === size - 1 || y === size - 1;
    if (random() < (edge ? .86 : .34)) {
      const px = x + .18 + random() * .64, py = y + .18 + random() * .64;
      context.strokeStyle = palette.grass;
      context.lineWidth = .026;
      context.beginPath();
      context.moveTo(px - .09, py - .03);
      context.lineTo(px, py + .04);
      context.lineTo(px + .04, py - .08);
      context.stroke();
      if (edge || random() < .20) {
        dot(px - .1, py - .04, .034, palette.flower);
        dot(px + .055, py - .095, .029, palette.glint);
      }
    }
  }
  context.strokeStyle = palette.grid;
  context.lineWidth = .018;
  context.beginPath();
  for (let i = 1; i < size; i++) {
    context.moveTo(i, 0); context.lineTo(i, size);
    context.moveTo(0, i); context.lineTo(size, i);
  }
  context.stroke();

  // Keep both banks in the one reserved river column, including at bends.
  // Leading and trailing banks use the same sample points to keep bridges
  // aligned with the single-tile road that crosses the water.
  const ribbon = (start, end, color) => {
    context.fillStyle = color;
    context.beginPath();
    for (let i = 0; i <= size * 4; i++) {
      const y = i / 4, x = river + start(y);
      if (i === 0) context.moveTo(x, y); else context.lineTo(x, y);
    }
    for (let i = size * 4; i >= 0; i--) context.lineTo(river + end(i / 4), i / 4);
    context.closePath(); context.fill();
  };
  const right = y => 1 - creekEdge(y + 4.3);
  ribbon(y => creekEdge(y) - .045, y => right(y) + .045, palette.bank);
  ribbon(creekEdge, right, palette.shore);
  ribbon(y => creekEdge(y) + .047, y => right(y) - .043, palette.shallow);
  ribbon(y => creekEdge(y) + .12, y => right(y) - .13 - .025 * Math.sin(y * 2), palette.channel);
  for (let y = .38; y < size - .25; y += .81 + random() * .54) {
    const x = river + .35 + random() * .28;
    context.strokeStyle = palette.current;
    context.lineWidth = .027;
    context.beginPath();
    context.moveTo(x, y);
    context.quadraticCurveTo(x + .045, y + .14, x + .012, y + .27);
    context.stroke();
    const bank = river + creekEdge(y) + .024;
    dot(bank, y, .044, palette.shore);
    dot(bank - .013, y - .015, .021, palette.glint);
  }
}

export function createMeadowArtwork(size, river, createCanvas = () => document.createElement('canvas')) {
  let texture, previousLight;
  return (context, iso, daylight) => {
    if (!texture || previousLight !== daylight) {
      texture ??= createCanvas();
      texture.width = texture.height = size * PIXELS_PER_TILE;
      paintMeadow(texture.getContext('2d'), size, river, daylight);
      previousLight = daylight;
    }
    const origin = iso(0, 0), east = iso(1, 0), south = iso(0, 1);
    context.save();
    context.transform(east.x - origin.x, east.y - origin.y, south.x - origin.x, south.y - origin.y, origin.x, origin.y);
    context.drawImage(texture, 0, 0, size, size);
    context.restore();
  };
}
