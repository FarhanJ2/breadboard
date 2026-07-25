#!/usr/bin/env python3
"""Build the animated "Farhan Jamil" signature SVGs.

Two things are combined here:

  1. the letterforms — Snell Roundhand Bold outlines, laid out with the font's
     kerning and flattened into one filled path (`glyphs.py` regenerates this);
  2. the pen path (`pen.py`) — a hand-authored route through those letterforms
     in the order a hand would write them.

The pen path, stroked thick, is used as a mask over the letters. Animating its
`stroke-dashoffset` sweeps the mask along the route, so the ink appears the way
it was written, then wipes off the same way.

No JS, no external fonts, no filters: everything is inline so the file works as
a plain <img> — which is the only thing a GitHub README can embed.

    python3 tools/signature/build.py     # writes public/signature-*.svg
"""

import os
import re
import subprocess
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from glyphs import GLYPH_PATH, GLYPH_BOUNDS  # noqa: E402
from pen import PEN, WIDTH  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "..", "public")

# --- timeline (seconds) -------------------------------------------------
DRAW, HOLD, ERASE, REST = 2.7, 4.4, 1.5, 0.9
TOTAL = DRAW + HOLD + ERASE + REST
p_draw = DRAW / TOTAL * 100
p_hold = (DRAW + HOLD) / TOTAL * 100
p_erase = (DRAW + HOLD + ERASE) / TOTAL * 100

# --- themes: (filename, ink start, ink end, nib core, nib halo) ----------
THEMES = [
    ("signature-dark.svg", "#f4f1ea", "#ffb454", "#fff6e2", "#ffb454"),
    ("signature-light.svg", "#16181f", "#b8690a", "#3a2a10", "#d98b1c"),
]

RENDER_WIDTH = 760  # default px width when embedded without an explicit size


def measure_length() -> float:
    """Ask headless Chrome for getTotalLength() of the pen path."""
    html = f"""<svg xmlns="http://www.w3.org/2000/svg"><path id="p" d="{PEN}"/></svg>
<script>document.title = document.getElementById('p').getTotalLength().toFixed(2);</script>"""
    tmp = os.path.join(HERE, ".measure.html")
    open(tmp, "w").write(html)
    chrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
    out = subprocess.run(
        [chrome, "--headless", "--disable-gpu", "--dump-dom", f"file://{tmp}"],
        capture_output=True, text=True,
    ).stdout
    os.remove(tmp)
    m = re.search(r"<title>([\d.]+)</title>", out)
    if not m:
        raise SystemExit("could not measure pen path length")
    return float(m.group(1))


def build(length: float, name: str, ink_a: str, ink_b: str, nib: str, halo: str) -> str:
    gx0, gy0, gx1, gy1 = GLYPH_BOUNDS
    pad = 90  # room for the nib's halo where the pen path runs outside the letters
    vb_x, vb_y = gx0 - pad, gy0 - pad
    vb_w, vb_h = (gx1 - gx0) + 2 * pad, (gy1 - gy0) + 2 * pad
    height = round(RENDER_WIDTH * vb_h / vb_w)
    L = round(length + 2)  # round up: a hair of slack so the stroke fully clears

    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb_x} {vb_y} {vb_w} {vb_h}"
     width="{RENDER_WIDTH}" height="{height}" role="img" aria-labelledby="t">
  <title id="t">Farhan Jamil</title>
  <defs>
    <linearGradient id="ink" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="{ink_a}"/>
      <stop offset="0.6" stop-color="{ink_a}"/>
      <stop offset="1" stop-color="{ink_b}"/>
    </linearGradient>
    <mask id="reveal" maskUnits="userSpaceOnUse"
          x="{vb_x}" y="{vb_y}" width="{vb_w}" height="{vb_h}">
      <path class="pen" d="{PEN}" fill="none" stroke="#fff" stroke-width="{WIDTH}"
            stroke-linecap="round" stroke-linejoin="round"/>
    </mask>
  </defs>
  <style>
    .pen {{
      stroke-dasharray: {L};
      stroke-dashoffset: {L};
      animation: write {TOTAL:.2f}s infinite;
    }}
    /* the nib rides the same path: a 1-unit dash pinned to the writing front */
    .nib {{
      stroke-dasharray: 1 {L * 2};
      stroke-dashoffset: 0;
      animation: nib {TOTAL:.2f}s infinite;
    }}
    .nib-flash {{ animation: spark {TOTAL:.2f}s infinite; }}
    @keyframes write {{
      0%            {{ stroke-dashoffset: {L}; animation-timing-function: cubic-bezier(.32,.06,.45,.96); }}
      {p_draw:.2f}% {{ stroke-dashoffset: 0; }}
      {p_hold:.2f}% {{ stroke-dashoffset: 0; animation-timing-function: cubic-bezier(.6,.02,.5,1); }}
      {p_erase:.2f}%, 100% {{ stroke-dashoffset: -{L}; }}
    }}
    @keyframes nib {{
      0%            {{ stroke-dashoffset: 0; animation-timing-function: cubic-bezier(.32,.06,.45,.96); }}
      {p_draw:.2f}%, 100% {{ stroke-dashoffset: -{L}; }}
    }}
    @keyframes spark {{
      0%, {p_draw:.2f}%, 100% {{ opacity: 0; }}
      2%, {p_draw - 2:.2f}%   {{ opacity: 1; }}
    }}
    @media (prefers-reduced-motion: reduce) {{
      .pen {{ stroke-dashoffset: 0; animation: none; }}
      .nib-flash {{ display: none; }}
    }}
  </style>
  <g mask="url(#reveal)">
    <path d="{GLYPH_PATH}" fill="url(#ink)"/>
  </g>
  <g class="nib-flash" fill="none" stroke-linecap="round">
    <path class="nib" d="{PEN}" stroke="{halo}" stroke-width="130" opacity="0.12"/>
    <path class="nib" d="{PEN}" stroke="{halo}" stroke-width="72" opacity="0.26"/>
    <path class="nib" d="{PEN}" stroke="{nib}" stroke-width="38"/>
  </g>
</svg>
"""


if __name__ == "__main__":
    length = measure_length()
    print(f"pen path length: {length:.1f} units, cycle {TOTAL:.1f}s")
    for name, *colors in THEMES:
        svg = build(length, name, *colors)
        path = os.path.abspath(os.path.join(OUT, name))
        open(path, "w").write(svg)
        print(f"  wrote {path}  ({len(svg) / 1024:.1f} KB)")
