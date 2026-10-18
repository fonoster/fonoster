package main

import (
	"os"
	"reflect"
	"testing"
	"time"

	"github.com/fonoster/fonoster/go/roomr/internal/fileconfig"
	"github.com/nats-io/nats.go"
)

// The node reads no ROOMR_* variables (fix-config-and-placement-gaps): a value set only in
// the environment leaves the default in place; the file's value wins over the default.
func TestDefaultsIgnoreRoomrEnv(t *testing.T) {
	t.Setenv("ROOMR_NATS_URL", "nats://from-env:4222")
	t.Setenv("ROOMR_MAX_PARTICIPANTS", "99")
	t.Setenv("ROOMR_DRAIN_WAIT", "1s")
	t.Setenv("ROOMR_SESSION_REGISTRY", "false")

	if got := or("", "nats://127.0.0.1:4222"); got != "nats://127.0.0.1:4222" {
		t.Fatalf("or = %q; want the default", got)
	}
	if got := orInt(0, 10); got != 10 {
		t.Fatalf("orInt = %d; want the default", got)
	}
	if got := orDuration("", 10*time.Minute); got != 10*time.Minute {
		t.Fatalf("orDuration = %v; want the default", got)
	}
	if got := orBool(nil, true); !got {
		t.Fatal("orBool = false; want the default")
	}

	f, err := fileconfig.Parse([]byte("nats: { url: nats://from-file:4222 }\nmaxParticipants: 4\ndrainWait: 2m\nsessionRegistry: false\n"), func(string) (string, bool) { return "", false })
	if err != nil {
		t.Fatal(err)
	}
	if got := or(f.NATS.URL, "x"); got != "nats://from-file:4222" {
		t.Fatalf("or(file) = %q", got)
	}
	if got := orInt(f.MaxParticipants, 10); got != 4 {
		t.Fatalf("orInt(file) = %d", got)
	}
	if got := orDuration(f.DrainWait, time.Minute); got != 2*time.Minute {
		t.Fatalf("orDuration(file) = %v", got)
	}
	if got := orBool(f.SessionRegistry, true); got {
		t.Fatal("orBool(file) = true")
	}
}

func TestIgnoredEnvNamesUnreferencedVariables(t *testing.T) {
	environ := []string{
		"PATH=/bin",
		"ROOMR_NATS_URL=nats://x:4222",
		"ROOMR_PASSWORD=s3cret",
		"ROOMR_ID=node-a",
		"ROOMR_TLS_KEY=-----BEGIN",
	}
	refs := []byte("-tls-key secret://env/ROOMR_TLS_KEY nodeId: \"${ROOMR_ID:-node-a}\"\nsip: { registrations: [ { registrar: routr, auth: { password: \"${ROOMR_PASSWORD}\" } } ] }\n")
	got := ignoredEnv(environ, refs)
	if want := []string{"ROOMR_NATS_URL"}; !reflect.DeepEqual(got, want) {
		t.Fatalf("ignoredEnv = %v; want %v", got, want)
	}
	if got := ignoredEnv(environ, nil); len(got) != 4 {
		t.Fatalf("ignoredEnv without a file = %v", got)
	}
}

// The shipped config files parse, with every placeholder filled from the environment the
// deployment sets (they replaced ROOMR_* variables in the cell's Compose file).
func TestShippedConfigsParse(t *testing.T) {
	env := map[string]string{
		"ROOMR_ID": "node-a", "ROOMR_ADVERTISE": "10.0.0.42", "ROOMR_RTP_PORT_MIN": "30000",
		"ROOMR_RTP_PORT_MAX": "30199", "ROOMR_PASSWORD": "p", "ROOMR_TRUSTED_SOURCE": "10.0.0.40",
		"NATS_ROOMR_PASSWORD": "n", "SUBNET_PREFIX": "10.0.0", "SIP_PORT": "5060",
	}
	lookup := func(k string) (string, bool) { v, ok := env[k]; return v, ok }
	for _, file := range []string{"../../../../ops/rebuild/cell/config/roomr.yaml", "../../../../ops/bundle/config/roomr.example.yaml"} {
		data, err := os.ReadFile(file)
		if err != nil {
			t.Fatal(err)
		}
		f, err := fileconfig.Parse(data, lookup)
		if err != nil {
			t.Fatalf("%s: %v", file, err)
		}
		if f.NodeID != "node-a" || f.RTP.PortMin != 30000 || f.RTP.PortMax != 30199 || len(f.SIP.Registrations) != 1 {
			t.Fatalf("%s: %+v", file, f)
		}
		// Routr is one registration templating its least-sessions header.
		regs, err := buildRegistrations(f)
		if err != nil {
			t.Fatal(err)
		}
		reg := regs[0]
		if reg.AOR != "sip:medianode@default" || reg.Username != "medianode" || reg.Password != "p" ||
			reg.Expires != 30*time.Second || reg.Headers["X-Session-Count"] != "{sessions}" {
			t.Fatalf("%s: registration %+v", file, reg)
		}
	}
}

// The media node's replies arrive under its own inbox prefix, the only inbox its NATS user may
// subscribe to (nats-permissions/roomr.conf).
func TestNATSInboxPrefixIsPerUser(t *testing.T) {
	if got := natsInboxPrefix("roomr"); got != "_INBOX_roomr" {
		t.Fatalf("prefix %q", got)
	}
	opts := nats.GetDefaultOptions()
	if err := nats.CustomInboxPrefix(natsInboxPrefix("roomr"))(&opts); err != nil {
		t.Fatalf("CustomInboxPrefix: %v", err)
	}
	if opts.InboxPrefix != "_INBOX_roomr" {
		t.Fatalf("InboxPrefix %q", opts.InboxPrefix)
	}
}
