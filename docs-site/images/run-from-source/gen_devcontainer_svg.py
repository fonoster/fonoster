"""Builds the animated dev container diagrams (dark and light) for the docs.

Each SVG embeds the static PNG export of the Pen frame and draws dots that travel along the
connectors. The dots are hidden when the reader prefers reduced motion, leaving the static diagram.
Usage: python3 gen_devcontainer_svg.py <images/run-from-source dir>
"""
import base64
import math
import sys

OUT = sys.argv[1]
W, H = 1602, 902  # the export includes the frame's 1px stroke on each side
OFF = 1  # frame coordinates -> export coordinates

ACCENT = "#39E19E"
MUTED = {"dark": "#C2C2C2", "light": "#8D8D8D"}

# (path in frame coordinates, color kind). Centers of the 2px connector bars.
FLOWS = [
    ("M296,252 H712", "accent", (0.40, 0.70)),  # your source -> workspace; hidden under its label
    ("M296,458 H400", "muted"),  # browser -> Envoy (http)
    ("M650,458 H712", "muted"),  # Envoy -> workspace (API, UI)
    ("M525,496 V600", "muted"),  # Envoy -> Routr (/sip)
    ("M296,658 H400", "muted"),  # softphone -> Routr (SIP)
    ("M650,638 H736", "muted"),  # Routr -> media node (calls)
    ("M650,768 H850 V666", "muted"),  # RTPEngine -> media node (RTP media)
    ("M850,506 V602", "accent"),  # gateway -> media node
    ("M850,602 V506", "accent"),  # media node -> gateway
    ("M1232,388 H1252 V288 H1272", "muted"),  # workspace -> Postgres
    ("M1232,388 H1272", "muted"),  # workspace -> NATS
    ("M1232,388 H1252 V488 H1272", "muted"),  # workspace -> MinIO
]

SPEED = 60  # px per second


def shift(d):
    out, num = [], ""
    for ch in d + " ":
        if ch.isdigit() or ch == ".":
            num += ch
            continue
        if num:
            out.append(str(float(num) + OFF).rstrip("0").rstrip("."))
            num = ""
        out.append(ch)
    return "".join(out).strip()


def length(d):
    x = y = 0.0
    total = 0.0
    tokens = d.replace(",", " ").split()
    i = 0
    while i < len(tokens):
        t = tokens[i]
        cmd, rest = t[0], t[1:]
        if cmd == "M":
            x, y = float(rest), float(tokens[i + 1])
            i += 2
        elif cmd == "H":
            nx = float(rest)
            total += abs(nx - x)
            x = nx
            i += 1
        elif cmd == "V":
            ny = float(rest)
            total += abs(ny - y)
            y = ny
            i += 1
        else:
            raise ValueError(t)
    return total


def svg(theme):
    png = base64.b64encode(open(f"{OUT}/dev-container-{theme}.png", "rb").read()).decode()
    dots = []
    for i, (d, kind, *gap) in enumerate(FLOWS):
        color = ACCENT if kind == "accent" else MUTED[theme]
        dur = max(2.0, length(d) / SPEED)
        for k in range(1):
            begin = -((i * 0.7) % dur)
            dots.append(
                f'<circle class="dot" r="4" fill="{color}">'
                f'<animateMotion dur="{dur:.2f}s" begin="{begin:.2f}s" repeatCount="indefinite" '
                f'path="{shift(d)}"/>'
                + (
                    f'<animate attributeName="opacity" dur="{dur:.2f}s" begin="{begin:.2f}s" '
                    f'repeatCount="indefinite" calcMode="discrete" values="1;0;1" '
                    f'keyTimes="0;{gap[0][0]};{gap[0][1]}"/>'
                    if gap
                    else ""
                )
                + "</circle>"
            )
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">'
        "<title>The dev container</title>"
        "<style>@media (prefers-reduced-motion: reduce) { .dot { display: none; } }</style>"
        f'<image width="{W}" height="{H}" href="data:image/png;base64,{png}"/>'
        + "".join(dots)
        + "</svg>\n"
    )


for theme in ("dark", "light"):
    with open(f"{OUT}/dev-container-{theme}.svg", "w") as f:
        f.write(svg(theme))
    print(theme, "ok")
