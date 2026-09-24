// Renders the ring cursor's states to PNGs in public/cursor/ (1x and @2x).
// The OS draws these as a real hardware cursor, so the ring sits exactly on the
// pointer with no frame of lag — see CursorTrail.astro. Run: node scripts/make-cursors.mjs
import { mkdirSync } from "node:fs";
import sharp from "sharp";

const INK = "rgba(232,230,225,0.76)"; // --ink at 76%, as the DOM ring had it
const AMBER = "#ffb454";
const RIM = "rgba(11,13,18,0.45)"; // dark edge so the ring survives a bright photo

// Each state is the old CSS ring at its scale: 26px ring, 1.4px stroke, 3.4px dot.
const states = {
  ring: { box: 32, r: 13, stroke: 1.4, color: INK, fill: "none", dot: true },
  over: { box: 50, r: 13 * 1.75, stroke: 1.4 * 1.75, color: AMBER, fill: "rgba(255,180,84,0.10)", dot: false },
  down: { box: 32, r: 13 * 0.72, stroke: 1.4 * 0.72, color: INK, fill: "none", dot: true },
  "over-down": { box: 42, r: 13 * 1.4, stroke: 1.4 * 1.4, color: AMBER, fill: "rgba(255,180,84,0.10)", dot: false },
};

mkdirSync("public/cursor", { recursive: true });
for (const [name, s] of Object.entries(states)) {
  const c = s.box / 2;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${s.box}" height="${s.box}" viewBox="0 0 ${s.box} ${s.box}">
    <circle cx="${c}" cy="${c}" r="${s.r}" fill="${s.fill}" stroke="${RIM}" stroke-width="${s.stroke + 2}"/>
    <circle cx="${c}" cy="${c}" r="${s.r}" fill="none" stroke="${s.color}" stroke-width="${s.stroke}"/>
    ${s.dot ? `<circle cx="${c}" cy="${c}" r="2.7" fill="${RIM}"/><circle cx="${c}" cy="${c}" r="1.7" fill="#e8e6e1"/>` : ""}
  </svg>`;
  for (const scale of [1, 2]) {
    await sharp(Buffer.from(svg), { density: 72 * scale })
      .png()
      .toFile(`public/cursor/${name}${scale === 2 ? "@2x" : ""}.png`);
  }
}
console.log("cursors written to public/cursor/");
