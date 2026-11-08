#!/usr/bin/env python3
"""Illustrative snapshot generator for the widget's tests. NOT real data.

  sample.py history DAYS AGE_MIN   one snapshot every 3h for DAYS days, newest AGE_MIN minutes old
  sample.py one AGE_MIN            a single snapshot AGE_MIN minutes old (negative = in the future)
  sample.py marker AGE_MIN         a failed-run marker AGE_MIN minutes old

Optional trailing word: billing=0 (a server without billing: present 0, everything zero).
"""
import json
import sys
import time

NEWEST = {
    "users": {"total": 128, "verified": 99, "password": 71, "github": 57, "new_24h": 3, "new_7d": 11,
              "verified_new_24h": 2, "verified_new_7d": 9},
    "workspaces": {"total": 96, "new_24h": 2, "new_7d": 8, "active_7d": 14, "activated_7d": 5,
                   "activated_loose_7d": 7, "activated_total": 31},
    "apps": {"total": 61, "autopilot": 44, "stream": 17, "new_7d": 4},
    "routr": {"agents": 40, "numbers": 22, "trunks": 9, "domains": 12,
              "new_7d": {"agents": 2, "numbers": 1, "trunks": 0}},
    "calls": {"total": 5000, "h1": 3, "h24": 42, "d7": 260, "minutes_24h": 118, "avg_secs_24h": 72,
              "under5s_24h": 3, "inbound_24h": 30, "outbound_24h": 12,
              "by_status_24h": {"completed": 41, "failed": 1}, "workspaces_24h": 7},
    "daily": {"calls": [3, 5, 9, 2, 0, 0, 7, 12, 20, 31, 28, 40, 35, 42],
              "minutes": [4, 9, 20, 3, 0, 0, 15, 30, 55, 70, 66, 98, 90, 118],
              "signups": [0, 1, 0, 0, 2, 1, 0, 3, 1, 2, 0, 4, 2, 3],
              "verified": [0, 1, 0, 0, 1, 1, 0, 2, 1, 1, 0, 3, 2, 2],
              "converted": [0, 1, 0, 0, 1, 0, 2, 0, 1, 0, 0, 1, 0, 1]},
}
BILLING = {"present": 1, "accounts": 40, "trial": 28, "payg": 12, "past_due": 1,
           "converted": 9, "converted_24h": 1, "converted_7d": 3,
           "credits_purchased": 250000, "credits_purchased_used": 61234, "credits_free": 120000,
           "credits_free_used": 45050, "credits_overdraft": 1200, "credits_expired": 8000}


def iso(epoch):
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(epoch))


def snap(epoch, steps_back=0, billing=True):
    s = json.loads(json.dumps(NEWEST))
    s["users"]["verified"] = max(0, NEWEST["users"]["verified"] - int(steps_back / 8 * 0.9))
    s["users"]["total"] = s["users"]["verified"] + 29
    s["users"]["password"] = s["users"]["total"] * 71 // 128
    s["users"]["github"] = s["users"]["total"] - s["users"]["password"]
    s["billing"] = dict(BILLING) if billing else {k: 0 for k in BILLING}
    if not billing:
        s["daily"]["converted"] = [0] * 14
    return dict({"schema": 1, "ts": iso(epoch)}, **s)


def main(a):
    opts = [x for x in a[1:] if "=" in x]
    a = [a[0]] + [x for x in a[1:] if "=" not in x]
    billing = "billing=0" not in opts
    now = time.time()
    if a[1] == "history":
        days, age = int(a[2]), float(a[3])
        total = days * 8
        for j in range(total):
            back = total - 1 - j
            print(json.dumps(snap(now - age * 60 - back * 10800, back, billing), separators=(",", ":")))
    elif a[1] == "one":
        print(json.dumps(snap(now - float(a[2]) * 60, 0, billing), separators=(",", ":")))
    elif a[1] == "marker":
        print(json.dumps({"schema": 1, "ts": iso(now - float(a[2]) * 60), "error": "query_failed"}, separators=(",", ":")))
    else:
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
