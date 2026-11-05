#!/usr/bin/env python3
"""Validator for what the ops API answers. Standard library only.

Metrics: exact key sets, integers 0..2^53-1, 14-item series, strict ts, bounded status keys, and
the failure marker form. `valid()` is the parity check (test/good and test/bad, schema 1).
`filter_lines()` adds the reader-only rules: the line must parse, the timestamp must be a real date,
and it may not be more than 5 minutes in the future. Python rejects any float (1.0, 1e3); the server
only ever writes plain integers.

Alerts: exact keys and full matches, field by field; a row that fails is dropped. Alert text is
remote data that reaches SwiftBar lines and parameters.

CLI, stdin at most 2 MiB:
  validate.py                 JSONL in, the valid lines out
  validate.py snapshot        one snapshot in and out; exit 1 otherwise
  validate.py alerts <epoch>  {"alerts":[...]} in, {"checked":<epoch>,"alerts":[valid rows]} out;
                              exit 1 when the body isn't that shape
"""
import calendar
import json
import re
import sys
import time

MAX_NAT = 9007199254740991
MAX_INPUT = 2 * 1024 * 1024
FUTURE_SLACK = 300

TS_RE = re.compile(r"[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z")
STATUS_KEY_RE = re.compile(r"[a-z0-9_]{1,32}")
ERROR_RE = re.compile(r"[a-z_]{1,32}")
FAR_END_RE = re.compile(r"[a-z0-9-]+")
CASE_RE = re.compile(r"IOP-[0-9]{3}")
SIGNATURE_RE = re.compile(r"[0-9]{3} to [A-Z]+|no final response to INVITE|no response to INVITE|no ACK for 2xx")
FILE_RE = re.compile(r"[0-9A-Za-z:.-]+-[A-Za-z0-9._@-]{1,128}\.jsonl")


def nat(v):
    return type(v) is int and 0 <= v <= MAX_NAT  # type() is int: rejects bool and float


def keys_are(o, ks):
    return isinstance(o, dict) and set(o.keys()) == set(ks)


def nats(o, ks):
    return keys_are(o, ks) and all(nat(v) for v in o.values())


def series(v):
    return isinstance(v, list) and len(v) == 14 and all(nat(x) for x in v)


def ts_ok(v):
    return isinstance(v, str) and TS_RE.fullmatch(v) is not None


def statuses(o):
    return (
        isinstance(o, dict)
        and len(o) <= 16
        and all(isinstance(k, str) and STATUS_KEY_RE.fullmatch(k) and nat(v) for k, v in o.items())
    )


def _snapshot(o):
    if not keys_are(o, ["schema", "ts", "users", "workspaces", "apps", "routr", "calls", "billing", "daily"]):
        return False
    if not (type(o["schema"]) is int and o["schema"] == 1 and ts_ok(o["ts"])):
        return False
    if not nats(o["users"], ["total", "verified", "password", "github", "new_24h", "new_7d",
                             "verified_new_24h", "verified_new_7d"]):
        return False
    if not nats(o["workspaces"], ["total", "new_24h", "new_7d", "active_7d", "activated_7d",
                                  "activated_loose_7d"]):
        return False
    if not nats(o["apps"], ["total", "autopilot", "stream", "new_7d"]):
        return False
    r = o["routr"]
    if not (keys_are(r, ["agents", "numbers", "trunks", "domains", "new_7d"])
            and all(nat(r[k]) for k in ("agents", "numbers", "trunks", "domains"))
            and nats(r["new_7d"], ["agents", "numbers", "trunks"])):
        return False
    c = o["calls"]
    if not (keys_are(c, ["total", "h1", "h24", "d7", "minutes_24h", "avg_secs_24h", "under5s_24h",
                         "inbound_24h", "outbound_24h", "by_status_24h", "workspaces_24h"])
            and statuses(c["by_status_24h"])
            and all(nat(v) for k, v in c.items() if k != "by_status_24h")):
        return False
    b = o["billing"]
    if not (nats(b, ["present", "accounts", "trial", "payg", "past_due",
                     "converted", "converted_24h", "converted_7d"]) and b["present"] <= 1):
        return False
    d = o["daily"]
    return (keys_are(d, ["calls", "minutes", "signups", "verified", "converted"])
            and all(series(v) for v in d.values()))


def _failure(o):
    return (
        keys_are(o, ["schema", "ts", "error"])
        and type(o["schema"]) is int and o["schema"] == 1
        and ts_ok(o["ts"])
        and isinstance(o["error"], str) and ERROR_RE.fullmatch(o["error"]) is not None
    )


def _text(v, pattern):
    return isinstance(v, str) and pattern.fullmatch(v) is not None


def alert_valid(a):
    """A row of /api/ops/interop/alerts, exact keys and full matches."""
    if not isinstance(a, dict):
        return False
    if not (_text(a.get("far_end"), FAR_END_RE) and ts_ok(a.get("time")) and ts_epoch(a["time"]) is not None
            and _text(a.get("file"), FILE_RE)):
        return False
    if a.get("kind") == "evidence":
        return keys_are(a, ["kind", "far_end", "case", "time", "file"]) and _text(a.get("case"), CASE_RE)
    if a.get("kind") == "failure":
        return (keys_are(a, ["kind", "far_end", "signature", "count", "time", "file"])
                and _text(a.get("signature"), SIGNATURE_RE)
                and type(a.get("count")) is int and 0 < a["count"] <= MAX_NAT)
    return False


def valid(o):
    try:
        return isinstance(o, dict) and (_snapshot(o) or _failure(o))
    except Exception:
        return False


def is_snapshot(o):
    return "error" not in o


def _reject_constant(name):
    raise ValueError(name)  # NaN, Infinity, -Infinity


def parse_line(line):
    try:
        return json.loads(line, parse_constant=_reject_constant)
    except Exception:  # bad JSON, NaN, too deeply nested
        return None


def ts_epoch(ts):
    """Epoch seconds for a validated ts, or None when it is not a real date."""
    try:
        return calendar.timegm(time.strptime(ts, "%Y-%m-%dT%H:%M:%SZ"))
    except (ValueError, OverflowError):
        return None


def filter_lines(text, now=None):
    """Valid, real-dated, not-from-the-future objects from JSONL text, in input order."""
    now = time.time() if now is None else now
    out = []
    for line in text.splitlines():
        o = parse_line(line)
        if o is None or not valid(o):
            continue
        e = ts_epoch(o["ts"])
        if e is None or e > now + FUTURE_SLACK:
            continue
        out.append(o)
    return out


def main(argv):
    raw = sys.stdin.buffer.read(MAX_INPUT + 1)
    if len(raw) > MAX_INPUT:
        return 1
    text = raw.decode("utf-8", errors="replace")
    mode = argv[1] if len(argv) > 1 else ""
    if mode == "alerts":
        body = parse_line(text)
        if not (keys_are(body, ["alerts"]) and isinstance(body["alerts"], list) and argv[2].isdigit()):
            return 1
        rows = [a for a in body["alerts"] if alert_valid(a)]
        sys.stdout.write(json.dumps({"checked": int(argv[2]), "alerts": rows}, separators=(",", ":")) + "\n")
        return 0
    lines = filter_lines(text)
    if mode == "snapshot":
        lines = [o for o in lines if is_snapshot(o)]
        if len(lines) != 1:
            return 1
    for o in lines:
        sys.stdout.write(json.dumps(o, separators=(",", ":")) + "\n")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
