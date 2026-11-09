#!/usr/bin/env python3
"""SwiftBar output for the fonoster-ops plugin. Standard library only; run with python3 -I.

  menu.py                                  the menu (title, then the dropdown after `---`)
  menu.py last-json                        the last good snapshot as one JSON line
  menu.py --card                           the dropdown's information lines for card (Save as image)
  menu.py row <far_end> <key>              a row of alerts.json: "<file>\t<label>", or nothing
  menu.py clear <far_end> <case>           clears that evidence, when it is a row of alerts.json
  menu.py clear-failure <far_end> <key>    clears that failure, when it is a row of alerts.json

The menu bar item is the Fonoster pill with the 24h call count and the share of completed calls on
one line, cut out of it (icon.py). A red dot marks an open alert, and a warning sign that the metrics
or the alerts couldn't be read on the last fetch.

Only validated data is shown. Every string that reaches a SwiftBar line goes through safe().
"""
import base64
import struct
import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.realpath(__file__)))  # python3 -I does not add the script dir
import data as D  # noqa: E402
import icon  # noqa: E402

HERE = os.path.dirname(os.path.realpath(__file__))
PLUGIN = os.path.join(HERE, "fonoster-ops.5m.sh")
CHECKLIST = "https://github.com/fonoster/fonoster/blob/main/mods/conformance/catalog/areas/interop.md#"
# Info lines carry no action, so macOS shows them as plain text that never highlights.
# Colors use ansi=true and 256-color codes: SwiftBar makes any line with color= clickable.
DARK = os.environ.get("OS_APPEARANCE", "Dark") != "Light"
# Nearest colors to designs/widget.nib that SwiftBar's 256-color table can produce:
# t1 #FFFFFF / #252525, t3 #C2C2C2 / #6B6B6B, t4 #8D8D8D, accent (SwiftBar has no exact match for #39E19E).
INK = {"main": 231 if DARK else 235, "detail": 251 if DARK else 242, "head": 245, "title": 245,
       "accent": 79 if DARK else 29, "warn": 214 if DARK else 166, "failing": 214 if DARK else 166,
       "error": 203 if DARK else 160}


def paint(text, role):
    return "\x1b[38;5;%dm%s\x1b[0m" % (INK[role], text)


HEAD = "font=HelveticaNeue size=11 ansi=true role=head"  # the "updated" line
TITLE = "font=HelveticaNeue-Bold size=11 ansi=true role=title"  # section titles: CALLS, GROWTH, ...
MONO1 = "font=Menlo size=12 ansi=true role=main"  # the main line of a section
MONO3 = "font=Menlo size=12 ansi=true role=detail"  # the detail lines
ACCENT = "font=Menlo size=12 ansi=true role=accent"  # paying customers
WARN = "size=11 ansi=true role=warn"  # a warning under a title
FAILING = "font=Menlo size=12 ansi=true role=failing"  # a failing far end


CARD_TOOL = os.path.join(HERE, "bin", "card")  # built by install.sh when swiftc is available


def card_lines(lines):
    """The dropdown's information for card.swift: no menu bar title, no submenus, nothing clickable."""
    out = []
    for line in lines[lines.index("---") + 1:] if "---" in lines else []:
        text, sep, params = line.partition(" | ")
        words = params.split(" ")
        if line == "---" or line.startswith("| image="):
            out.append(line)
            continue
        if text.startswith("--") or any(w.startswith(("bash=", "href=")) for w in words):
            continue
        role = next((w[5:] for w in words if w.startswith("role=")), None)
        if sep and role in INK:
            out.append("\x1d%s\t%s" % (role, text))
    return out


def colorize(line):
    """Turns `text | ... role=X` into the ansi-colored text with the role dropped."""
    if CARD:  # card_lines reads the roles
        return line
    text, sep, params = line.partition(" | ")
    words = params.split(" ")
    role = next((w[5:] for w in words if w.startswith("role=")), None)
    if not sep or role not in INK:
        return line
    prefix = "--" if text.startswith("--") else ""
    return "%s%s | %s" % (prefix, paint(text[len(prefix):], role), " ".join(w for w in words if not w.startswith("role=")))


LOGO = os.path.join(HERE, "assets", "logo-menu-%s.png" % ("dark" if DARK else "light"))


def logo_b64():
    """The Fonoster logo for the dropdown header; empty if the file is missing."""
    try:
        with open(LOGO, "rb") as f:
            return base64.b64encode(f.read()).decode("ascii")
    except OSError:
        return ""


def title(text):
    return "%s | %s" % (text, TITLE)


CONFIG_FILE = "~/.config/fonoster-ops/config"
MESSAGES = {
    "config": "Setup needed: add url and token to %s" % CONFIG_FILE,
    "http_401": "The server refused the token in %s" % CONFIG_FILE,
    "http_404": "No ops API at that url. Check %s" % CONFIG_FILE,
    "unreachable": "Could not reach the server",
    "metrics_failed": "The server could not read its metrics",
    "oversize": "The server sent more data than expected, so it was ignored",
    "no_valid_data": "The server sent no usable data",
    "python": "python3 is not installed",
}


def safe(value):
    """Printable text with no SwiftBar separators: strips '|', backslashes and control characters."""
    return "".join(ch for ch in str(value) if ch.isprintable() and ch not in "|\\")


def action(label, *params, extra="refresh=false", prefix=""):
    """A clickable line that runs this plugin with its fixed word and validated parameters."""
    if any(c in PLUGIN for c in '"|\n\\'):
        return safe(label)
    words = " ".join("param%d=%s" % (i + 1, safe(p)) for i, p in enumerate(params))
    return '%s%s | bash="%s" %s terminal=false %s' % (prefix, safe(label), PLUGIN, words, extra)


def icon_text(s):
    """What goes inside the pill: calls in 24 hours, then the share completed."""
    pct = D.completed_pct(s)
    return icon.compact(s["calls"]["h24"]), "-" if pct is None else "%d%%" % pct


def title_ok(s, warn, dot):
    sign = "⚠ " if warn else ""
    text = " ".join(icon_text(s))
    if dot:
        return "%s| image=%s" % (sign, icon.alert_png_b64(text, DARK))
    return "%s| templateImage=%s" % (sign, icon.png_b64(text))


def alerts_line(data):
    """Why the alerts below may be old, or None when the last check was fine."""
    if data.alerts_status == "ok":
        return None
    msg = "Interop scan failed on the server." if data.alerts_status == "scan_failed" else "Could not check interop alerts."
    if data.checked is not None:
        msg += " Last checked %s." % time.strftime("%H:%M", time.localtime(data.checked))
    return msg


def row_line(a):
    when = D.local_time(a["time"])
    if a["kind"] == "failure":
        calls = "1 call" if a["count"] == 1 else "%s calls" % D.n(a["count"])
        return "Failing %s · %s · %s · %s | %s" % (safe(a["signature"]), safe(a["far_end"]), calls, when, FAILING)
    return "New evidence %s · %s · %s | %s" % (safe(a["case"]), safe(a["far_end"]), when, MONO1)


def row_submenu(a):
    key = D.row_key(a)
    clear = "clear" if a["kind"] == "evidence" else "clear-failure"
    out = ["--%s · %s | %s" % (safe(D.row_label(a)), D.local_time(a["time"]), HEAD),
           "--%s | %s" % (safe(a["file"]), HEAD),
           "-----",
           action("Download recording", "download", a["far_end"], key, extra="refresh=true", prefix="--")]
    if a["kind"] == "evidence":
        out.append("--Open checklist | href=%s%s" % (CHECKLIST, safe(a["case"]).lower()))
    out.append(action("Clear", clear, a["far_end"], key, extra="refresh=true", prefix="--"))
    return out


def interop_section(data, rows):
    why = alerts_line(data)
    if not rows and why is None:
        return []
    if rows and CARD:
        head = "● INTEROP · %d OPEN | role=error" % len(rows)
    elif rows:
        head = "%s%s | font=HelveticaNeue-Bold size=11 ansi=true" % (
            paint("● ", "error"), paint("INTEROP · %d OPEN" % len(rows), "title"))
    else:
        head = title("INTEROP")
    out = ["---", head]
    if why:
        out.append("%s | %s" % (why, WARN))
    if data.notice:
        out.append("%s | %s" % (safe(data.notice), WARN))
    for a in rows:
        out.append(row_line(a))
        out += row_submenu(a)
    return out


CARD = False  # set by --card


def menu(data, now):
    s = data.snapshot
    show = s is not None and data.status in ("ok", "metrics_failed")
    if not show:
        if data.status is None:
            msg = "No data yet"
        else:
            msg = MESSAGES.get(data.status, "Could not update")
        lines = ["☎ ✕", "---", safe(msg) + " | ansi=true role=error",
                 action("Try again", "refresh", extra="refresh=true"), "---", action("Quit", "quit")]
        return [colorize(line) for line in lines]
    rows = D.open_alerts(data)
    warn = data.status != "ok" or data.alerts_status != "ok"
    pct = D.completed_pct(s)
    c, u, w, a, r = s["calls"], s["users"], s["workspaces"], s["apps"], s["routr"]
    act, new, act_pct = D.activation(s)
    age = D.age_seconds(s, now)
    when = time.strftime("%H:%M", time.localtime(now - age))
    out = [title_ok(s, warn, bool(rows)), "---"]
    logo = logo_b64()
    if logo:
        lw, lh = struct.unpack(">II", base64.b64decode(logo)[16:24])
        out.append("| image=%s width=66 height=%d" % (logo, round(66 * lh / lw)))
    out.append("updated %s (%s) | %s" % (when, D.fmt_age(age), HEAD))
    if data.status == "metrics_failed":
        out.append("%s | %s" % (MESSAGES["metrics_failed"], WARN))
    out += interop_section(data, rows)
    out += ["---", title("CALLS · LAST 24 HOURS")]
    out.append("%s calls | %s" % (D.n(c["h24"]), MONO1))
    spark, sw, sh = icon.spark_b64(s["daily"]["calls"])
    out.append("| image=%s width=%d height=%d" % (spark, sw, sh))
    done = "no calls yet" if pct is None else "%d%% completed" % pct
    out.append("%s · avg %s · %s under 5s | %s" % (done, D.fmt_duration(c["avg_secs_24h"]), D.n(c["under5s_24h"]), MONO3))
    out.append("%s in · %s out · %s min · %s workspaces | %s" % (
        D.n(c["inbound_24h"]), D.n(c["outbound_24h"]), D.n(c["minutes_24h"]), D.n(c["workspaces_24h"]), MONO3))
    out += ["---", title("GROWTH")]
    out.append("%s verified users   +%s today · +%s in 7 days | %s" % (
        D.n(u["verified"]), D.n(u["verified_new_24h"]), D.n(u["verified_new_7d"]), MONO1))
    if D.billing_on(s):
        b = s["billing"]
        out.append("%s converted (paying)   +%s today · +%s in 7 days | %s" % (
            D.n(b["converted"]), D.n(b["converted_24h"]), D.n(b["converted_7d"]), ACCENT))
    out.append("%s users · %s password · %s GitHub | %s" % (D.n(u["total"]), D.n(u["password"]), D.n(u["github"]), MONO3))
    out.append("%s workspaces   +%s today · +%s in 7 days | %s" % (
        D.n(w["total"]), D.n(w["new_24h"]), D.n(w["new_7d"]), MONO3))
    if act_pct is None:
        out.append("%s activated   no new workspaces in 7 days | %s" % (D.n(act), MONO3))
    else:
        out.append("%s activated   %d%% of %s new in 7 days | %s" % (D.n(act), act_pct, D.n(new), MONO3))
    ever, ws, ever_pct = D.activation_total(s)
    if ever_pct is not None:
        out.append("%s activated ever   %d%% of %s workspaces | %s" % (D.n(ever), ever_pct, D.n(ws), MONO3))
    if D.billing_on(s):
        b = s["billing"]
        out += ["---", title("BILLING")]
        bought, spent = b["credits_purchased"], b["credits_purchased_used"]
        pct = D.used_pct(spent, bought)
        out.append("%s bought · %s used%s | %s" % (
            D.money(bought), D.money(spent), "" if pct is None else " (%d%%)" % pct, MONO1))
        out.append("free %s used of %s · %s unpaid · %s expired | %s" % (
            D.money(b["credits_free_used"]), D.money(b["credits_free"]), D.money(b["credits_overdraft"]),
            D.money(b["credits_expired"]), MONO3))
        out.append("%s on plan · %s on trial · %s past due | %s" % (
            D.n(b["payg"]), D.n(b["trial"]), D.n(b["past_due"]), MONO3))
    out += ["---", title("BUILT")]
    out.append("%s apps · %s Autopilot · %s Stream | %s" % (D.n(a["total"]), D.n(a["autopilot"]), D.n(a["stream"]), MONO3))
    out.append("%s SIP agents · %s numbers · %s trunks | %s" % (D.n(r["agents"]), D.n(r["numbers"]), D.n(r["trunks"]), MONO3))
    out.append("---")
    if os.access(CARD_TOOL, os.X_OK):
        out.append(action("Save as image", "image"))
    out += [action("Refresh now", "refresh", extra="refresh=true"),
            action("Copy last snapshot (JSON)", "copy"), "---", action("Quit", "quit")]
    return [colorize(line) for line in out]


def main(argv):
    now = time.time()
    data = D.load(now)
    args = argv[1:]
    if args == ["last-json"]:
        if data.snapshot is None:
            return 1
        print(D.snapshot_json(data.snapshot))
        return 0
    if len(args) == 3 and args[0] == "row":
        a = D.find_row(data.alerts, args[1], args[2])
        if a:
            print("%s\t%s" % (a["file"], D.row_label(a)))
        return 0
    if len(args) == 3 and args[0] in ("clear", "clear-failure"):
        kind = "evidence" if args[0] == "clear" else "failure"
        a = D.find_row(data.alerts, args[1], args[2], kind)
        if a:
            D.write_clear(a)
        return 0
    global CARD
    CARD = args == ["--card"]
    lines = menu(data, now)
    for line in card_lines(lines) if CARD else lines:
        print(line)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
