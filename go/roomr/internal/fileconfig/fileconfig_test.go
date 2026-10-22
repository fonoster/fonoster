package fileconfig

import (
	"strings"
	"testing"
	"time"
)

func env(m map[string]string) func(string) (string, bool) {
	return func(k string) (string, bool) { v, ok := m[k]; return v, ok }
}

func TestExpandRules(t *testing.T) {
	lookup := env(map[string]string{"A": "x", "EMPTY": ""})
	cases := map[string]string{
		"${A}":          "x",
		"p-${A}-s":      "p-x-s",
		"${B:-def}":     "def",
		"${EMPTY:-def}": "def",
		"${B:-}":        "",
		"$5.00 ${A}":    "$5.00 x",
		"plain":         "plain",
	}
	for in, want := range cases {
		got, err := Expand(in, lookup)
		if err != nil || got != want {
			t.Errorf("Expand(%q) = %q, %v; want %q", in, got, err, want)
		}
	}
	for _, in := range []string{"${B}", "${EMPTY}"} {
		if _, err := Expand(in, lookup); err == nil {
			t.Errorf("Expand(%q): want an error", in)
		}
	}
}

func TestParseTypesAndPlaceholders(t *testing.T) {
	f, err := Parse([]byte(`
nodeId: "${ID:-node-a}"
nats: { url: "nats://nats:4222", user: roomr, password: "${NATS_PW}" }
rtp: { portMin: "${MIN}", portMax: 11999 }
sip:
  registrations: [ { registrar: routr, expires: 30s, auth: { password: "${SIP_PW}" } } ]
  outboundProxy: "sip:${NET}.40:5060;transport=tcp"
  roomHeader: X-Room-Ref
sessionEndpoint: "appbridge:50071"
readyTimeout: 3s
heartbeatInterval: 1s
emptyRoomTimeout: -1s
telemetry: { otlpEndpoint: "${OTEL:-}" }
`), env(map[string]string{"NATS_PW": "n1", "MIN": "11000", "SIP_PW": "123456", "NET": "10.0.0"}))
	if err != nil {
		t.Fatal(err)
	}
	if f.NodeID != "node-a" || f.NATS.Password != "n1" || f.RTP.PortMin != 11000 || f.RTP.PortMax != 11999 {
		t.Fatalf("unexpected %+v", f)
	}
	// A numeric secret stays a string.
	if f.SIP.Registrations[0].Auth.Password != "123456" || f.SIP.OutboundProxy != "sip:10.0.0.40:5060;transport=tcp" ||
		f.SIP.RoomHeader != "X-Room-Ref" || f.SessionEndpoint != "appbridge:50071" || f.ReadyTimeout != Duration(3*time.Second) {
		t.Fatalf("unexpected %+v", f)
	}
	if f.HeartbeatInterval != Duration(time.Second) || f.EmptyRoomTimeout != Duration(-time.Second) || f.Telemetry.OTLPEndpoint != "" {
		t.Fatalf("unexpected %+v", f)
	}
}

func TestParseSpecialCharactersSurvive(t *testing.T) {
	f, err := Parse([]byte(`nats: { password: "${PW}" }`), env(map[string]string{"PW": "a: b # c, {d}"}))
	if err != nil || f.NATS.Password != "a: b # c, {d}" {
		t.Fatalf("got %q, %v", f.NATS.Password, err)
	}
}

func TestParseErrorsNameKeyAndVariable(t *testing.T) {
	_, err := Parse([]byte("sip:\n  registrations:\n    - registrar: r\n      auth:\n        password: ${SIP_PW}\n"), env(nil))
	if err == nil || !strings.Contains(err.Error(), "sip.registrations[0].auth.password") || !strings.Contains(err.Error(), "SIP_PW") {
		t.Fatalf("got %v", err)
	}
	_, err = Parse([]byte("nodeID: x\n"), env(nil))
	if err == nil || !strings.Contains(err.Error(), "nodeID") {
		t.Fatalf("unknown key: got %v", err)
	}
	_, err = Parse([]byte("drainWait: soon\n"), env(nil))
	if err == nil || !strings.Contains(err.Error(), "soon") {
		t.Fatalf("bad duration: got %v", err)
	}
}

func TestLoadMissingDefaultIsNotAnError(t *testing.T) {
	f, err := Load("/nonexistent/roomr.yaml", false)
	if f != nil || err != nil {
		t.Fatalf("got %v, %v", f, err)
	}
	if _, err := Load("/nonexistent/roomr.yaml", true); err == nil {
		t.Fatal("explicit missing file: want an error")
	}
}

// The config file is the only configuration: keys that moved elsewhere or went away are errors,
// not silently ignored.
func TestRemovedKeysAreRejected(t *testing.T) {
	for _, key := range []string{"trustedSources: [a]", "sessionRegistry: false", "requireEncryption: true",
		"allowedDestinations: [a]", "debugAddr: ':9000'", "outboundTransport: tcp", "callDedupeWindow: 1m",
		"tls: { clientCa: /ca.pem }", "outboundProxy: routr:5060", "ownerTimeout: 20s", "onMissingRoom: create",
		"cpuIdle: 10"} {
		if _, err := Parse([]byte(key), env(nil)); err == nil {
			t.Errorf("%q: want an error", key)
		}
	}
}

func TestDefaults(t *testing.T) {
	f, err := Parse([]byte(""), env(nil))
	if err != nil {
		t.Fatal(err)
	}
	if f.SIP.Listen != "0.0.0.0:5060" || f.SIP.Advertise != "127.0.0.1" || f.RTP.Host != "0.0.0.0" ||
		f.RTP.Advertise != "127.0.0.1" || f.DrainWait != Duration(time.Hour) || f.Control.GRPC.Listen != "0.0.0.0:50061" {
		t.Fatalf("unexpected defaults %+v", f)
	}
}

func TestParseRegistrations(t *testing.T) {
	f, err := Parse([]byte(`
sip:
  registrations:
    - registrar: "sip:pbx.example:5080;transport=tcp"
      aor: sip:node-1@pbx.example
      expires: 60s
      auth: { username: node-1, password: "${PW}" }
      headers: { X-Session-Count: "{sessions}", X-Region: eu }
    - registrar: 10.0.0.9:5060
`), env(map[string]string{"PW": "s3cret"}))
	if err != nil {
		t.Fatal(err)
	}
	r := f.SIP.Registrations
	if len(r) != 2 || r[0].Auth == nil || r[0].Auth.Password != "s3cret" || r[0].Headers["X-Region"] != "eu" ||
		r[0].Expires != "60s" || r[1].Auth != nil {
		t.Fatalf("%+v", r)
	}
	for name, doc := range map[string]string{
		"registrar": "sip: { registrations: [ { aor: sip:a@b } ] }",
		"expires":   "sip: { registrations: [ { registrar: a:5060, expires: soon } ] }",
		"short":     "sip: { registrations: [ { registrar: a:5060, expires: 500ms } ] }",
		"reserved":  "sip: { registrations: [ { registrar: a:5060, headers: { Contact: x } } ] }",
		"unknown":   "sip: { registrations: [ { registrar: a:5060, every: 15s } ] }",
		"legacy":    "registration: { registrar: a:5060 }",
	} {
		if _, err := Parse([]byte(doc), env(nil)); err == nil {
			t.Errorf("%s: want an error", name)
		}
	}
}

// The design's "Minimal roomr.yaml" parses as written.
func TestMinimalConfigParses(t *testing.T) {
	f, err := Parse([]byte(`
nodeId: roomr-0
region: us-east
nats:
  url: nats://nats:4222
  user: roomr
  password: ${NATS_PASSWORD}
sip:
  listen: 0.0.0.0:5060
  advertise: 10.0.0.7:5060
  outboundProxy: sip:routr:5060;transport=tcp
  callRefHeader: X-Call-Ref
  roomHeader: X-Room-Ref
  registrations:
    - registrar: sip:routr:5060
      aor: sip:roomr@default
      auth: { username: roomr, password: "${SIP_PASSWORD}" }
      expires: 60
      headers: { X-Session-Count: "{sessions}" }
tls:
  listen: 0.0.0.0:5061
  cert: /etc/roomr/tls.crt
  key: /etc/roomr/tls.key
rtp:
  host: 0.0.0.0
  advertise: 203.0.113.10
  portMin: 30000
  portMax: 30199
control:
  grpc:
    listen: 0.0.0.0:50061
    advertise: roomr-0.roomr:50061
    tls: { cert: /c.pem, key: /k.pem, clientCa: /ca.pem }
sessionEndpoint: appbridge.fonoster:50071
maxRooms: 200
maxParticipants: 10
maxDuration: 4h
mediaTimeout: 15s
readyTimeout: 10s
emptyRoomTimeout: 30s
drainWait: 1h
heartbeatInterval: 2s
reregisterDelta: 5
codecs: [opus, g722, pcmu, pcma]
telemetry:
  otlpEndpoint: http://otel:4318
`), env(map[string]string{"NATS_PASSWORD": "n", "SIP_PASSWORD": "s"}))
	if err != nil {
		t.Fatal(err)
	}
	if f.SessionEndpoint != "appbridge.fonoster:50071" || f.SIP.RoomHeader != "X-Room-Ref" || f.MaxRooms != 200 ||
		f.MediaTimeout != Duration(15*time.Second) || f.Region != "us-east" || len(f.Codecs) != 4 {
		t.Fatalf("unexpected %+v", f)
	}
}
