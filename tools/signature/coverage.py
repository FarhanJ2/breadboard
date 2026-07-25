"""Coverage check: paint anything the pen stroke never reaches bright red.

Opens as HTML because it needs a browser to resolve the mask.

    python3 tools/signature/coverage.py && open tools/signature/coverage.html
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import pen as P  # noqa: E402
from glyphs import GLYPH_PATH  # noqa: E402

here = os.path.dirname(os.path.abspath(__file__))

x0, y0, x1, y1 = -200, -900, 6200, 500
svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="{x0} {y0} {x1-x0} {y1-y0}" width="2000">
  <mask id="miss" maskUnits="userSpaceOnUse" x="{x0}" y="{y0}" width="{x1-x0}" height="{y1-y0}">
    <rect x="{x0}" y="{y0}" width="{x1-x0}" height="{y1-y0}" fill="#fff"/>
    <path d="{P.PEN}" fill="none" stroke="#000" stroke-width="{P.WIDTH}" stroke-linecap="round" stroke-linejoin="round"/>
  </mask>
  <path d="{GLYPH_PATH}" fill="#2a2d38"/>
  <g mask="url(#miss)"><path d="{GLYPH_PATH}" fill="#ff2d2d"/></g>
  <path d="{P.PEN}" fill="none" stroke="#4d8bff" stroke-width="6" opacity="0.7"/>
</svg>'''
open(os.path.join(here, "coverage.html"), "w").write('<body style="background:#0b0d12;margin:0">' + svg + "</body>")
print("wrote " + os.path.join(here, "coverage.html"))
