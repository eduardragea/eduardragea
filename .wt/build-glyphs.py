"""Turns the font into .wt/glyphs.json, so the SVGs can draw text as paths.

Run this only when the font set changes:

    uv run --with fonttools --with brotli python .wt/build-glyphs.py <fonts dir>
"""
import json
import pathlib
import sys

from fontTools.pens.basePen import BasePen
from fontTools.ttLib import TTFont

CHARS = [chr(c) for c in range(0x20, 0x7f)] + ["·"]
FONTS = {"sans": "inter-400.woff2", "bold": "inter-600.woff2"}


class Ops(BasePen):
    def __init__(self, glyph_set):
        super().__init__(glyph_set)
        self.ops = []

    def _moveTo(self, p):
        self.ops.append(["M", *p])

    def _lineTo(self, p):
        self.ops.append(["L", *p])

    def _curveToOne(self, a, b, c):
        self.ops.append(["C", *a, *b, *c])

    def _qCurveToOne(self, a, b):
        self.ops.append(["Q", *a, *b])

    def _closePath(self):
        self.ops.append(["Z"])


def table(path):
    font = TTFont(path)
    glyph_set = font.getGlyphSet()
    cmap = font.getBestCmap()
    glyphs = {}
    for ch in CHARS:
        name = cmap.get(ord(ch))
        if name is None:
            raise SystemExit(f"{path} has no glyph for {ch!r}")
        pen = Ops(glyph_set)
        glyph_set[name].draw(pen)
        glyphs[ch] = {"adv": glyph_set[name].width, "ops": pen.ops}
    return {"upm": font["head"].unitsPerEm, "glyphs": glyphs}


fonts_dir = pathlib.Path(sys.argv[1])
out = pathlib.Path(__file__).with_name("glyphs.json")
data = {key: table(fonts_dir / name) for key, name in FONTS.items()}
out.write_text(json.dumps(data, separators=(",", ":")))
print(f"{out}: {out.stat().st_size // 1024} KB")
