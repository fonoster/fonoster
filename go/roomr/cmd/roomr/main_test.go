package main

import (
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"github.com/fonoster/fonoster/go/roomr/internal/fileconfig"
	"github.com/nats-io/nats.go"
)

// The shipped config files parse, with every placeholder filled from the environment the
// deployment sets (they replaced ROOMR_* variables in the cell's Compose file).
func TestShippedConfigsParse(t *testing.T) {
	env := map[string]string{
		"ROOMR_ID": "node-a", "ROOMR_ADVERTISE": "10.0.0.42", "ROOMR_RTP_PORT_MIN": "30000",
		"ROOMR_RTP_PORT_MAX": "30199", "ROOMR_PASSWORD": "p",
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
		if reg.AOR != "sip:roomr@default" || reg.Username != "roomr" || reg.Password != "p" ||
			reg.Expires != 30*time.Second || reg.Headers["X-Session-Count"] != "{sessions}" {
			t.Fatalf("%s: registration %+v", file, reg)
		}
	}
}

// The Roomr node's replies arrive under its own inbox prefix, the only inbox its NATS user may
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

// -config <path> is the only flag: any other flag stops the node with a usage error, so an old
// command line fails loudly instead of being half ignored.
func TestConfigIsTheOnlyFlag(t *testing.T) {
	bin := filepath.Join(t.TempDir(), "roomr")
	if out, err := exec.Command("go", "build", "-o", bin, ".").CombinedOutput(); err != nil {
		t.Fatalf("go build: %v\n%s", err, out)
	}
	run := func(args ...string) (string, error) {
		out, err := exec.Command(bin, args...).CombinedOutput()
		return string(out), err
	}
	out, err := run("-sip", "0.0.0.0:5060")
	if err == nil || !strings.Contains(out, "flag provided but not defined: -sip") {
		t.Fatalf("an old flag was accepted: %v\n%s", err, out)
	}
	if out, err := run("-config", "/nonexistent/roomr.yaml"); err == nil || !strings.Contains(out, "unable to read roomr config") {
		t.Fatalf("a missing -config file was not an error: %v\n%s", err, out)
	}
}
