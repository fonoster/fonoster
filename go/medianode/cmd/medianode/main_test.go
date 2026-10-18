package main

import (
	"os"
	"reflect"
	"testing"
	"time"

	"github.com/fonoster/fonoster/go/medianode/internal/fileconfig"
	"github.com/fonoster/fonoster/go/medianode/internal/sipua"
	"github.com/nats-io/nats.go"
)

// The node reads no MEDIANODE_* variables (fix-config-and-placement-gaps): a value set only in
// the environment leaves the default in place; the file's value wins over the default.
func TestDefaultsIgnoreMedianodeEnv(t *testing.T) {
	t.Setenv("MEDIANODE_NATS_URL", "nats://from-env:4222")
	t.Setenv("MEDIANODE_MAX_PARTICIPANTS", "99")
	t.Setenv("MEDIANODE_DRAIN_WAIT", "1s")
	t.Setenv("MEDIANODE_SESSION_REGISTRY", "false")

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
		"MEDIANODE_NATS_URL=nats://x:4222",
		"MEDIANODE_PASSWORD=s3cret",
		"MEDIANODE_ID=node-a",
		"MEDIANODE_TLS_KEY=-----BEGIN",
	}
	refs := []byte("-tls-key secret://env/MEDIANODE_TLS_KEY nodeId: \"${MEDIANODE_ID:-node-a}\"\nregistration: { password: \"${MEDIANODE_PASSWORD}\" }\n")
	got := ignoredEnv(environ, refs)
	if want := []string{"MEDIANODE_NATS_URL"}; !reflect.DeepEqual(got, want) {
		t.Fatalf("ignoredEnv = %v; want %v", got, want)
	}
	if got := ignoredEnv(environ, nil); len(got) != 4 {
		t.Fatalf("ignoredEnv without a file = %v", got)
	}
}

// The shipped config files parse, with every placeholder filled from the environment the
// deployment sets (they replaced MEDIANODE_* variables in the cell's Compose file).
func TestShippedConfigsParse(t *testing.T) {
	env := map[string]string{
		"MEDIANODE_ID": "node-a", "MEDIANODE_ADVERTISE": "10.0.0.42", "MEDIANODE_RTP_PORT_MIN": "30000",
		"MEDIANODE_RTP_PORT_MAX": "30199", "MEDIANODE_PASSWORD": "p", "MEDIANODE_TRUSTED_SOURCE": "10.0.0.40",
		"NATS_MEDIANODE_PASSWORD": "n", "SUBNET_PREFIX": "10.0.0", "SIP_PORT": "5060",
	}
	lookup := func(k string) (string, bool) { v, ok := env[k]; return v, ok }
	for _, file := range []string{"../../../../ops/rebuild/cell/config/medianode.yaml", "../../../../ops/bundle/config/medianode.example.yaml"} {
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
		// Routr is one registration templating its least-sessions header; dialed calls go out as
		// the same peer.
		s, err := buildSIP(f, legacyRegistration{})
		if err != nil {
			t.Fatal(err)
		}
		reg := s.Registrations[0]
		if reg.AOR != "sip:medianode@default" || reg.Username != "medianode" || reg.Password != "p" ||
			reg.Expires != 30*time.Second || reg.Headers["X-Session-Count"] != "{sessions}" {
			t.Fatalf("%s: registration %+v", file, reg)
		}
		if s.Domain != "default" || s.Username != "medianode" || s.Password != "p" || s.Legacy {
			t.Fatalf("%s: dial identity %+v", file, s)
		}
	}
}

// The media node's replies arrive under its own inbox prefix, the only inbox its NATS user may
// subscribe to (nats-permissions/medianode.conf).
func TestNATSInboxPrefixIsPerUser(t *testing.T) {
	if got := natsInboxPrefix("medianode"); got != "_INBOX_medianode" {
		t.Fatalf("prefix %q", got)
	}
	opts := nats.GetDefaultOptions()
	if err := nats.CustomInboxPrefix(natsInboxPrefix("medianode"))(&opts); err != nil {
		t.Fatalf("CustomInboxPrefix: %v", err)
	}
	if opts.InboxPrefix != "_INBOX_medianode" {
		t.Fatalf("InboxPrefix %q", opts.InboxPrefix)
	}
}

// The legacy registration block and flags still register with Routr, as one generic registration
// with X-Session-Count, and keep the dial identity they had.
func TestLegacyRegistrationMapsToRegistrations(t *testing.T) {
	s, err := buildSIP(&fileconfig.File{}, legacyRegistration{Registrar: "routr:5060", Domain: "default",
		Password: "pw", Transport: "tcp", Every: 15 * time.Second})
	if err != nil {
		t.Fatal(err)
	}
	if !s.Legacy || len(s.Registrations) != 1 {
		t.Fatalf("%+v", s)
	}
	want := sipua.Registration{Registrar: "sip:routr:5060;transport=tcp", AOR: "sip:medianode@default",
		Username: "medianode", Password: "pw", Expires: 30 * time.Second,
		Headers: map[string]string{"X-Session-Count": "{sessions}"}}
	if !reflect.DeepEqual(s.Registrations[0], want) {
		t.Fatalf("registration = %+v, want %+v", s.Registrations[0], want)
	}
	if s.Domain != "default" || s.Username != "medianode" || s.Password != "pw" {
		t.Fatalf("dial identity %+v", s)
	}
	// No registrar anywhere: no REGISTER.
	if s, _ := buildSIP(&fileconfig.File{}, legacyRegistration{}); len(s.Registrations) != 0 {
		t.Fatalf("registrations without configuration: %+v", s.Registrations)
	}
	// Both forms at once is a configuration error.
	f := &fileconfig.File{}
	f.SIP.Registrations = []fileconfig.Registration{{Registrar: "pbx:5060"}}
	if _, err := buildSIP(f, legacyRegistration{Registrar: "routr:5060"}); err == nil {
		t.Fatal("want an error for registration plus sip.registrations")
	}
}
