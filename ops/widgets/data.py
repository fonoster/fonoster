"""Loads the validated cache and derives what the menu shows. Standard library only."""
import json
import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.realpath(__file__)))  # python3 -I does not add the script dir
import validate  # noqa: E402

MAX_BYTES = validate.MAX_INPUT
SPARK = "▁▂▃▄▅▆▇█"
ALERT_STATES = ("ok", "scan_failed", "check_failed")


def home():
    return os.environ.get("HOME") or os.path.expanduser("~")


def cache_dir():
    return os.path.join(home(), ".cache", "fonoster-ops")


def cleared_path():
    return os.path.join(home(), ".config", "fonoster-ops", "interop-cleared")


def _read(path):
    try:
        with open(path, "rb") as f:
            raw = f.read(MAX_BYTES + 1)
    except OSError:
        return ""
    if len(raw) > MAX_BYTES:
        return ""
    return raw.decode("utf-8", errors="replace")


class Data:
    def __init__(self, snapshot, status, alerts_status, alerts, checked, notice, cleared):
        self.snapshot = snapshot  # the last good one, or None
        self.status = status  # the metrics' result on the last fetch: ok, a code, or None (never fetched)
        self.alerts_status = alerts_status  # the alerts' result on the last fetch
        self.alerts = alerts  # the last good ones
        self.checked = checked  # epoch of the last good check, or None
        self.notice = notice
        self.cleared = cleared  # (evidence set, failure -> UTC day)


def _load_alerts(cdir):
    o = validate.parse_line(_read(os.path.join(cdir, "alerts.json")))
    if not (validate.keys_are(o, ["checked", "alerts"]) and validate.nat(o["checked"])
            and isinstance(o["alerts"], list)):
        return [], None
    return [a for a in o["alerts"] if validate.alert_valid(a)], o["checked"]


def load_cleared():
    """(set of (far_end, case), {(far_end, signature_with_underscores): latest UTC day})."""
    evidence, failures = set(), {}
    for line in _read(cleared_path()).splitlines():
        parts = line.split()
        if len(parts) == 3 and parts[0] == "e":
            evidence.add((parts[1], parts[2]))
        elif len(parts) == 4 and parts[0] == "f":
            k = (parts[1], parts[2])
            failures[k] = max(failures.get(k, ""), parts[3])
    return evidence, failures


def load(now=None, cdir=None):
    """Re-validates everything read from the cache: the cache is not trusted either."""
    now = time.time() if now is None else now
    cdir = cdir or cache_dir()
    objs = [o for o in validate.filter_lines(_read(os.path.join(cdir, "snapshot.json")), now) if validate.is_snapshot(o)]
    snapshot = objs[-1] if objs else None
    status, alerts_status = None, "check_failed"
    parts = _read(os.path.join(cdir, "status")).split()
    if len(parts) == 3 and validate.STATUS_KEY_RE.fullmatch(parts[0]) and parts[1].isdigit() and parts[2] in ALERT_STATES:
        status, alerts_status = parts[0], parts[2]
    alerts, checked = _load_alerts(cdir)
    return Data(snapshot, status, alerts_status, alerts, checked, _read(os.path.join(cdir, "notice")).strip(),
                load_cleared())


def row_key(a):
    return a["case"] if a["kind"] == "evidence" else a["signature"].replace(" ", "_")


def row_name(a):
    return a["case"] if a["kind"] == "evidence" else a["signature"]


def row_label(a):
    return "%s · %s" % (row_name(a), a["far_end"])


def find_row(alerts, far_end, key, kind=None):
    for a in alerts:
        if a["far_end"] == far_end and row_key(a) == key and kind in (None, a["kind"]):
            return a
    return None


def utc_day(a):
    return a["time"][:10]


def is_open(a, cleared):
    evidence, failures = cleared
    if a["kind"] == "evidence":
        return (a["far_end"], a["case"]) not in evidence
    day = failures.get((a["far_end"], row_key(a)))
    return day is None or utc_day(a) > day


def open_alerts(data):
    """Failures first, then evidence, each newest first."""
    rows = [a for a in data.alerts if is_open(a, data.cleared)]
    rows.sort(key=lambda a: a["time"], reverse=True)
    rows.sort(key=lambda a: a["kind"] != "failure")
    return rows


def clear_line(a):
    if a["kind"] == "evidence":
        return "e %s %s\n" % (a["far_end"], a["case"])
    return "f %s %s %s\n" % (a["far_end"], row_key(a), utc_day(a))


def write_clear(a, cdir=None):
    path = cleared_path()
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "a") as f:
        f.write(clear_line(a))
    try:
        os.remove(os.path.join(cdir or cache_dir(), "notice"))
    except OSError:
        pass


def local_time(ts, fmt="%Y-%m-%d %H:%M"):
    return time.strftime(fmt, time.localtime(validate.ts_epoch(ts)))


def age_seconds(snapshot, now):
    return max(0, int(now - validate.ts_epoch(snapshot["ts"])))


def completed_pct(s):
    h = s["calls"]["h24"]
    if h == 0:
        return None
    return min(100, s["calls"]["by_status_24h"].get("completed", 0) * 100 // h)  # rounds down: never overstate


def activation(s):
    """(activated, new, pct or None)."""
    n = s["workspaces"]["new_7d"]
    a = min(s["workspaces"]["activated_7d"], n)
    return a, n, (a * 100 // n if n else None)


def activation_total(s):
    """(activated any time, workspaces, pct or None). Calls of deleted workspaces still count, so it
    is capped at the workspaces there are."""
    t = s["workspaces"]["total"]
    a = min(s["workspaces"]["activated_total"], t)
    return a, t, (a * 100 // t if t else None)


def money(credits):
    """Credits as dollars (1 credit = $0.01): $1,234.56."""
    return "$%s.%02d" % ("{:,}".format(credits // 100), credits % 100)


def used_pct(used, of):
    return None if of == 0 else min(100, used * 100 // of)  # rounds down: never overstate


def billing_on(s):
    """True only when the server has billing; otherwise billing shows nothing (zeros would look real)."""
    return s["billing"]["present"] == 1


def fmt_duration(secs):
    if secs < 60:
        return "%ds" % secs
    if secs < 3600:
        return "%dm%02ds" % (secs // 60, secs % 60)
    return "%dh%02dm" % (secs // 3600, secs % 3600 // 60)


def fmt_age(secs):
    if secs < 90:
        return "just now"
    if secs < 5400:
        return "%dm ago" % round(secs / 60)
    if secs < 172800:
        return "%dh ago" % round(secs / 3600)
    return "%dd ago" % round(secs / 86400)


def sparkline(values):
    top = max(values) if values else 0
    if top <= 0:
        return SPARK[0] * len(values)
    out = []
    for v in values:
        if v <= 0:
            out.append(SPARK[0])
        else:
            out.append(SPARK[max(1, min(7, int(v * 7 / top + 0.5)))])
    return "".join(out)


def n(v):
    return "{:,}".format(v)


def snapshot_json(s):
    return json.dumps(s, separators=(",", ":"))
