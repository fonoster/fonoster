"""A fake of DigitalOcean's DNS records API for throwaway.sh (OPS-010), standard library only.

    FAKEDO_TOKEN=<token> FAKEDO_LOG=<file> python3 fake-digitalocean.py [port]

POST /v2/domains/{zone}/records puts the TXT record in pebble-challtestsrv (/set-txt on
CHALLTESTSRV, default http://127.0.0.1:8055) and logs "{zone} {name}" to FAKEDO_LOG; DELETE
/v2/domains/{zone}/records/{id} clears it. A request without the token as its bearer gets 401.
Listens on 127.0.0.1 (default port 8085).
"""

import itertools
import json
import os
import re
import sys
import urllib.request
from http.server import BaseHTTPRequestHandler, HTTPServer

TOKEN = os.environ["FAKEDO_TOKEN"]
LOG = os.environ["FAKEDO_LOG"]
CHALLTESTSRV = os.environ.get("CHALLTESTSRV", "http://127.0.0.1:8055")
records = {}
ids = itertools.count(1)


def challtestsrv(path, body):
    req = urllib.request.Request(CHALLTESTSRV + path, json.dumps(body).encode())
    urllib.request.urlopen(req, timeout=5).read()


class Handler(BaseHTTPRequestHandler):
    def reply(self, code, body=None):
        data = json.dumps(body).encode() if body is not None else b""
        self.send_response(code)
        self.send_header("content-type", "application/json")
        self.send_header("content-length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def authorized(self):
        if self.headers.get("Authorization") == "Bearer " + TOKEN:
            return True
        self.reply(401, {"id": "unauthorized", "message": "Unable to authenticate you"})
        return False

    def do_POST(self):
        m = re.fullmatch(r"/v2/domains/([^/]+)/records", self.path)
        if not m:
            return self.reply(404, {"id": "not_found", "message": "The resource was not found."})
        if not self.authorized():
            return
        record = json.loads(self.rfile.read(int(self.headers.get("content-length", 0))))
        challtestsrv("/set-txt", {"host": record["name"], "value": record["data"]})
        record_id = next(ids)
        records[record_id] = record["name"]
        with open(LOG, "a") as log:
            log.write("%s %s\n" % (m.group(1), record["name"]))
        self.reply(201, {"domain_record": dict(record, id=record_id)})

    def do_DELETE(self):
        m = re.fullmatch(r"/v2/domains/([^/]+)/records/(\d+)", self.path)
        if not m:
            return self.reply(404, {"id": "not_found", "message": "The resource was not found."})
        if not self.authorized():
            return
        name = records.pop(int(m.group(2)), None)
        if name:
            challtestsrv("/clear-txt", {"host": name})
        self.reply(204)

    def log_message(self, *args):
        pass


HTTPServer(("127.0.0.1", int(sys.argv[1]) if len(sys.argv) > 1 else 8085), Handler).serve_forever()
