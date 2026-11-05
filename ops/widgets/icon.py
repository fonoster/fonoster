"""Menu bar icon: the Fonoster pill with the 24h call count and the completed share inside. Standard library only.

  compact(n)   42 -> "42", 900 -> "900", 5000 -> "5k", 1200000 -> "1.2M"
  png_b64(a, b)  base64 PNG (144 dpi, so 2x on Retina) of the pill with the text inside
  alert_png_b64(text, dark)  the same pill for one appearance, with the red dot: macOS draws a
                 template image in one color, so the dot can't exist on one

The pill follows assets/logo.svg: a rounded rectangle whose bottom-left corner is square.
Green pill, dark green text. Drawn by hand (no image library) so
the plugin keeps needing only python3.
"""
import base64
import struct
import zlib

H = 36            # pixels; 18 points on a Retina display
MIN_W = 64
RADIUS = 16       # 18.3 / 41 of the height
SCALE = 2         # pixels per font dot
GAP = 3           # pixels between the two lines
PAD = 9
PAD_RIGHT = 13   # a little more on the right: the "%" sat too close to the rounded end
BG = bytes([0x39, 0xE1, 0x9E])  # Fonoster green
FG = bytes([0x05, 0x32, 0x04])  # the logo's dark green
SS = 4            # supersampling per axis, for smooth pill edges
# designs/widget.nib, "Interop dot": 7pt, its top-left 4pt into the pill, aligned to its top.
DOT = 14
DOT_OVERLAP = 8
INK_DARK_BAR = bytes([0xFF, 0xFF, 0xFF])
INK_LIGHT_BAR = bytes([0x25, 0x25, 0x25])
DOT_DARK_BAR = bytes([0xFF, 0x45, 0x3A])
DOT_LIGHT_BAR = bytes([0xFF, 0x3B, 0x30])

# 5x7 dots per glyph, one string per row ('#' = dot).
FONT = {
    "0": "01110 10001 10011 10101 11001 10001 01110",
    "1": "00100 01100 00100 00100 00100 00100 01110",
    "2": "01110 10001 00001 00010 00100 01000 11111",
    "3": "11110 00001 00001 01110 00001 00001 11110",
    "4": "00010 00110 01010 10010 11111 00010 00010",
    "5": "11111 10000 11110 00001 00001 10001 01110",
    "6": "00110 01000 10000 11110 10001 10001 01110",
    "7": "11111 00001 00010 00100 01000 01000 01000",
    "8": "01110 10001 10001 01110 10001 10001 01110",
    "9": "01110 10001 10001 01111 00001 00010 01100",
    "k": "10000 10000 10010 10100 11000 10100 10010",
    "M": "10001 11011 10101 10101 10001 10001 10001",
    "B": "11110 10001 10001 11110 10001 10001 11110",
    ".": "00000 00000 00000 00000 00000 01100 01100",
    "%": "11001 11010 00010 00100 01000 01011 10011",
    " ": "00000 00000 00000 00000 00000 00000 00000",
    "-": "00000 00000 00000 11111 00000 00000 00000",
}


def compact(n):
    """Whole number up to 900, then 1 decimal under 10 and none above: 5k, 1.2M, 950k, 3B."""
    n = int(n)
    if n <= 900:
        return str(max(n, 0))
    value, unit = n, 0
    units = ["", "k", "M", "B", "T"]
    while unit < len(units) - 1:
        value, unit = value / 1000.0, unit + 1
        tenths = int(value * 10 + 0.5)
        if tenths >= 10000 and unit < len(units) - 1:
            continue  # 999,999 rounds up to 1000k: say 1M instead
        if tenths < 100:
            text = "%d.%d" % divmod(tenths, 10)
            if text.endswith(".0"):
                text = text[:-2]
            return text + units[unit]
        if int(value + 0.5) < 1000 or unit == len(units) - 1:
            return "%d%s" % (int(value + 0.5), units[unit])
    return "9999T"


def _text_mask(text):
    """Rows of booleans for `text`, SCALE pixels per dot, 1 dot of space between glyphs."""
    glyphs = [FONT.get(ch, FONT["-"]).split() for ch in text]
    rows = []
    for y in range(7):
        row = []
        for i, g in enumerate(glyphs):
            row += [c == "1" for c in g[y]] + ([False] if i < len(glyphs) - 1 else [])
        rows.append(row)
    return [[v for v in r for _ in range(SCALE)] for r in rows for _ in range(SCALE)]


def _inside(x, y, w):
    """Is the point (x, y) inside the pill? Square bottom-left corner, round on the other three."""
    r = RADIUS
    if x < 0 or y < 0 or x > w or y > H:
        return False
    cx = r if x < r else (w - r if x > w - r else None)
    cy = r if y < r else (H - r if y > H - r else None)
    if cx is None or cy is None:
        return True
    if x < r and y > H - r:  # bottom-left stays square
        return True
    return (x - cx) ** 2 + (y - cy) ** 2 <= r * r


def _chunk(kind, body):
    return struct.pack(">I", len(body)) + kind + body + struct.pack(">I", zlib.crc32(kind + body))


def _stack(lines):
    """Masks of each line, centered on one canvas: (rows, width, height)."""
    masks = [_text_mask(t) for t in lines]
    mw = max(len(m[0]) for m in masks)
    rows = []
    for k, m in enumerate(masks):
        if k:
            rows += [[False] * mw for _ in range(GAP)]
        pad = (mw - len(m[0])) // 2
        rows += [[False] * pad + r + [False] * (mw - pad - len(r)) for r in m]
    return rows, mw, len(rows)


def png_b64(*lines, color=False):
    """Pill with one or two centered lines of text (e.g. png_b64("42", "97%")).

    color=False (default): white pill with the text cut out, for use as a template image.
    color=True: Fonoster green pill with dark green text.
    """
    mask, mw, mh = _stack(lines)
    w = max(MIN_W, mw + PAD + PAD_RIGHT)
    ox, oy = PAD + (w - mw - PAD - PAD_RIGHT) // 2, (H - mh) // 2
    raw = bytearray()
    for y in range(H):
        raw.append(0)
        for x in range(w):
            my, mx = y - oy, x - ox
            if 0 <= my < mh and 0 <= mx < mw and mask[my][mx]:
                raw += FG + b"\xff" if color else b"\xff\xff\xff\x00"
                continue
            hits = sum(_inside(x + (i + 0.5) / SS, y + (j + 0.5) / SS, w) for i in range(SS) for j in range(SS))
            raw += (BG if color else b"\xff\xff\xff") + bytes([hits * 255 // (SS * SS)])
    png = (b"\x89PNG\r\n\x1a\n"
           + _chunk(b"IHDR", struct.pack(">IIBBBBB", w, H, 8, 6, 0, 0, 0))
           + _chunk(b"pHYs", struct.pack(">IIB", 5669, 5669, 1))  # 144 dpi
           + _chunk(b"IDAT", zlib.compress(bytes(raw), 9))
           + _chunk(b"IEND", b""))
    return base64.b64encode(png).decode("ascii")


def alert_png_b64(text, dark):
    """The pill drawn for this appearance, text cut out as the template is, plus the red dot."""
    ink, dot = (INK_DARK_BAR, DOT_DARK_BAR) if dark else (INK_LIGHT_BAR, DOT_LIGHT_BAR)
    mask, mw, mh = _stack([text])
    w = max(MIN_W, mw + PAD + PAD_RIGHT)
    ox, oy = PAD + (w - mw - PAD - PAD_RIGHT) // 2, (H - mh) // 2
    total = w + DOT - DOT_OVERLAP
    cx, cy, r = w - DOT_OVERLAP + DOT / 2, DOT / 2, DOT / 2
    raw = bytearray()
    for y in range(H):
        raw.append(0)
        for x in range(total):
            samples = [(x + (i + 0.5) / SS, y + (j + 0.5) / SS) for i in range(SS) for j in range(SS)]
            on_dot = sum((px - cx) ** 2 + (py - cy) ** 2 <= r * r for px, py in samples)
            if on_dot:
                raw += dot + bytes([on_dot * 255 // (SS * SS)])
                continue
            my, mx = y - oy, x - ox
            if 0 <= my < mh and 0 <= mx < mw and mask[my][mx]:
                raw += ink + b"\x00"
                continue
            hits = sum(_inside(px, py, w) for px, py in samples)
            raw += ink + bytes([hits * 255 // (SS * SS)])
    png = (b"\x89PNG\r\n\x1a\n"
           + _chunk(b"IHDR", struct.pack(">IIBBBBB", total, H, 8, 6, 0, 0, 0))
           + _chunk(b"pHYs", struct.pack(">IIB", 5669, 5669, 1))  # 144 dpi
           + _chunk(b"IDAT", zlib.compress(bytes(raw), 9))
           + _chunk(b"IEND", b""))
    return base64.b64encode(png).decode("ascii")


def spark_b64(values, bar=10, gap=6, height=52):  # designs/widget.nib: 5pt bars, 3pt gaps, 26pt tall
    """Small bar chart of the daily series in Fonoster green: (base64 PNG, width pt, height pt)."""
    values = [max(int(v), 0) for v in values][-14:] or [0]
    top = max(values) or 1
    w = len(values) * bar + (len(values) - 1) * gap
    heights = [max(3, height * v // top) for v in values]
    raw = bytearray()
    for y in range(height):
        raw.append(0)
        for i, h in enumerate(heights):
            px = (BG + b"\xff") if y >= height - h else b"\0\0\0\0"
            raw += px * bar
            if i < len(heights) - 1:
                raw += b"\0\0\0\0" * gap
    png = (b"\x89PNG\r\n\x1a\n"
           + _chunk(b"IHDR", struct.pack(">IIBBBBB", w, height, 8, 6, 0, 0, 0))
           + _chunk(b"pHYs", struct.pack(">IIB", 5669, 5669, 1))
           + _chunk(b"IDAT", zlib.compress(bytes(raw), 9))
           + _chunk(b"IEND", b""))
    return base64.b64encode(png).decode("ascii"), w // 2, height // 2
