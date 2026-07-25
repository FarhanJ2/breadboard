# The animated signature

`public/signature-dark.svg` / `public/signature-light.svg` — "Farhan Jamil" in
Snell Roundhand Bold, written on by a masked pen stroke, held, then wiped off,
on a ~9.5s loop. Pure SVG + CSS: no JS, no webfont, no filters, so it animates
anywhere an `<img>` renders — including a GitHub README, which strips
everything else.

- `-dark` = light ink, for dark backgrounds (this is the one the site hero uses).
- `-light` = dark ink, for light backgrounds.

Both honour `prefers-reduced-motion` by showing the finished signature, static.

## Embedding in a GitHub profile README

Paste this into `FarhanJ2/FarhanJ2/README.md`. The `<picture>` gives GitHub's
light and dark themes the right ink:

```html
<picture>
  <source media="(prefers-color-scheme: dark)"
          srcset="https://farhanj2.github.io/breadboard/signature-dark.svg">
  <img alt="Farhan Jamil" width="620"
       src="https://farhanj2.github.io/breadboard/signature-light.svg">
</picture>
```

One-liner, if you only care about GitHub's dark theme:

```md
![Farhan Jamil](https://farhanj2.github.io/breadboard/signature-dark.svg)
```

Notes:

- The URL only goes live once this repo has deployed to Pages — push to `main`
  first, then check <https://farhanj2.github.io/breadboard/signature-dark.svg>.
- GitHub proxies images through camo, which caches them. After changing the
  SVG, bump a query string (`...signature-dark.svg?v=2`) to force a refetch.
- `width` on the `<img>` is the only sizing GitHub respects; the SVG's own
  aspect ratio (about 5.2:1) does the rest.

## Regenerating

```sh
python3 tools/signature/extract.py   # only if the wording or face changes
python3 tools/signature/build.py     # timing, colours, nib -> public/signature-*.svg
```

- `extract.py` needs macOS' Snell Roundhand and `fonttools`. It flattens the
  kerned string into one filled path (`glyphs.py`, generated — don't hand-edit).
- `pen.py` is the hand-authored bit: the route a hand takes through those
  letterforms, stroked 420 units wide as a mask. It is tuned so that every part
  of every letter is eventually covered — if you edit it, re-check coverage
  with `coverage.py`, which paints anything the pen never reaches bright red.
- `build.py` measures the pen path with headless Chrome (`getTotalLength`) to
  set `stroke-dasharray`, then writes both themes.
