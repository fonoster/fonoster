package fileconfig

import (
	"strings"
	"testing"
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
nats: { url: "nats://nats:4222", user: medianode, password: "${NATS_PW}" }
rtp: { portMin: "${MIN}", portMax: 11999 }
registration: { password: "${SIP_PW}", every: 15s }
trustedSources: ["${NET}.40"]
sessionRegistry: false
telemetry: { otlpEndpoint: "${OTEL:-}" }
`), env(map[string]string{"NATS_PW": "n1", "MIN": "11000", "SIP_PW": "123456", "NET": "10.0.0"}))
	if err != nil {
		t.Fatal(err)
	}
	if f.NodeID != "node-a" || f.NATS.Password != "n1" || f.RTP.PortMin != 11000 || f.RTP.PortMax != 11999 {
		t.Fatalf("unexpected %+v", f)
	}
	// A numeric secret stays a string.
	if f.Registration.Password != "123456" || f.TrustedSources[0] != "10.0.0.40" {
		t.Fatalf("unexpected %+v", f)
	}
	if f.SessionRegistry == nil || *f.SessionRegistry || f.Telemetry.OTLPEndpoint != "" {
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
	_, err := Parse([]byte("registration:\n  password: ${SIP_PW}\n"), env(nil))
	if err == nil || !strings.Contains(err.Error(), "registration.password") || !strings.Contains(err.Error(), "SIP_PW") {
		t.Fatalf("got %v", err)
	}
	_, err = Parse([]byte("nodeID: x\n"), env(nil))
	if err == nil || !strings.Contains(err.Error(), "nodeID") {
		t.Fatalf("unknown key: got %v", err)
	}
	_, err = Parse([]byte("drainWait: soon\n"), env(nil))
	if err == nil || !strings.Contains(err.Error(), "drainWait") {
		t.Fatalf("bad duration: got %v", err)
	}
}

func TestLoadMissingDefaultIsNotAnError(t *testing.T) {
	f, err := Load("/nonexistent/medianode.yaml", false)
	if f != nil || err != nil {
		t.Fatalf("got %v, %v", f, err)
	}
	if _, err := Load("/nonexistent/medianode.yaml", true); err == nil {
		t.Fatal("explicit missing file: want an error")
	}
}

func TestPathFromArgs(t *testing.T) {
	if p, ok := PathFromArgs([]string{"-sip", "x", "-config", "/c.yaml"}); !ok || p != "/c.yaml" {
		t.Fatalf("got %q %v", p, ok)
	}
	if p, ok := PathFromArgs([]string{"--config=/d.yaml"}); !ok || p != "/d.yaml" {
		t.Fatalf("got %q %v", p, ok)
	}
}
