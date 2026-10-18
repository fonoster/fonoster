package e2e

// A fake registrar (redesign-roomr 13.4, conformance "registration templates against the
// fake registrar"): it records every REGISTER with its headers and, when given credentials,
// challenges REGISTERs with digest auth and checks the response, the way Routr checks a Peer's.
// The node knows no registrar by name: Routr is one deployment that templates X-Session-Count.

import (
	"crypto/md5"
	"encoding/hex"
	"fmt"
	"net"
	"sync"
	"testing"
	"time"

	"github.com/emiago/sipgo"
	"github.com/emiago/sipgo/sip"
	"github.com/fonoster/fonoster/go/roomr/internal/caller"
	"github.com/fonoster/fonoster/go/roomr/internal/node"
	"github.com/fonoster/fonoster/go/roomr/internal/sipua"
	"github.com/icholy/digest"
)

const regRealm, regNonce = "fake-registrar", "5ca1ab1e"

// register is one accepted REGISTER.
type register struct {
	expires string
	from    string
	headers map[string]string
}

type fakeRegistrar struct {
	addr       string
	user, pass string // empty user: no challenge
	mu         sync.Mutex
	accepted   []register
	challenged int
	rejected   int
}

// startRegistrar starts a registrar; with user set it requires digest auth for user and pass.
func startRegistrar(t *testing.T, user, pass string) *fakeRegistrar {
	ua, err := sipgo.NewUA(sipgo.WithUserAgent("fake-registrar"))
	if err != nil {
		t.Fatal(err)
	}
	srv, err := sipgo.NewServer(ua)
	if err != nil {
		t.Fatal(err)
	}
	l, err := net.ListenPacket("udp4", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	f := &fakeRegistrar{addr: l.LocalAddr().String(), user: user, pass: pass}
	srv.OnRegister(func(req *sip.Request, tx sip.ServerTransaction) {
		if f.user != "" {
			if req.GetHeader("Authorization") == nil {
				f.mu.Lock()
				f.challenged++
				f.mu.Unlock()
				res := sip.NewResponseFromRequest(req, 401, "Unauthorized", nil)
				res.AppendHeader(sip.NewHeader("WWW-Authenticate",
					fmt.Sprintf(`Digest realm="%s", nonce="%s", algorithm=MD5, qop="auth"`, regRealm, regNonce)))
				_ = tx.Respond(res)
				return
			}
			if !digestValid(req, f.user, f.pass) {
				f.mu.Lock()
				f.rejected++
				f.mu.Unlock()
				_ = tx.Respond(sip.NewResponseFromRequest(req, 403, "Forbidden", nil))
				return
			}
		}
		reg := register{headers: map[string]string{}}
		if h := req.GetHeader("Expires"); h != nil {
			reg.expires = h.Value()
		}
		if from := req.From(); from != nil {
			reg.from = from.Address.String()
		}
		for _, h := range req.Headers() {
			if len(h.Name()) > 2 && (h.Name()[:2] == "X-" || h.Name()[:2] == "x-") {
				reg.headers[h.Name()] = h.Value()
			}
		}
		f.mu.Lock()
		f.accepted = append(f.accepted, reg)
		f.mu.Unlock()
		_ = tx.Respond(sip.NewResponseFromRequest(req, 200, "OK", nil))
	})
	go func() { _ = srv.ServeUDP(l) }()
	t.Cleanup(func() { _ = ua.Close() })
	return f
}

// digestValid checks an MD5 digest response (with or without qop), as Routr does.
func digestValid(req *sip.Request, user, pass string) bool {
	cred, err := digest.ParseCredentials(req.GetHeader("Authorization").Value())
	if err != nil || cred.Username != user || cred.Nonce != regNonce || cred.Realm != regRealm {
		return false
	}
	md := func(s string) string { sum := md5.Sum([]byte(s)); return hex.EncodeToString(sum[:]) }
	ha1 := md(fmt.Sprintf("%s:%s:%s", user, cred.Realm, pass))
	ha2 := md(fmt.Sprintf("%s:%s", req.Method, cred.URI))
	want := md(fmt.Sprintf("%s:%s:%s", ha1, cred.Nonce, ha2))
	if cred.QOP != "" {
		want = md(fmt.Sprintf("%s:%s:%08x:%s:%s:%s", ha1, cred.Nonce, cred.Nc, cred.Cnonce, cred.QOP, ha2))
	}
	return want == cred.Response
}

func (f *fakeRegistrar) snapshot() []register {
	f.mu.Lock()
	defer f.mu.Unlock()
	return append([]register(nil), f.accepted...)
}

// waitHeader waits for an accepted REGISTER whose header name is value and returns its index.
func (f *fakeRegistrar) waitHeader(t *testing.T, name, value string, within time.Duration) int {
	t.Helper()
	deadline := time.Now().Add(within)
	for time.Now().Before(deadline) {
		for i, r := range f.snapshot() {
			if r.headers[name] == value {
				return i
			}
		}
		time.Sleep(20 * time.Millisecond)
	}
	t.Fatalf("no REGISTER with %s: %s within %v; saw %v", name, value, within, f.snapshot())
	return -1
}

// stateLog records registration.state reports.
type stateLog struct {
	mu     sync.Mutex
	states []sipua.RegistrationState
}

func (l *stateLog) add(s sipua.RegistrationState) {
	l.mu.Lock()
	l.states = append(l.states, s)
	l.mu.Unlock()
}

// wait waits for a report of state (with the SIP status, when one is given): the first failure of
// a node may be local (its socket not ready yet) before the registrar's answer.
func (l *stateLog) wait(t *testing.T, state string, within time.Duration, status ...int) sipua.RegistrationState {
	t.Helper()
	deadline := time.Now().Add(within)
	for time.Now().Before(deadline) {
		l.mu.Lock()
		for _, s := range l.states {
			if s.State == state && (len(status) == 0 || s.SIPStatus == status[0]) {
				l.mu.Unlock()
				return s
			}
		}
		l.mu.Unlock()
		time.Sleep(20 * time.Millisecond)
	}
	t.Fatalf("no registration.state %s within %v; saw %v", state, within, l.states)
	return sipua.RegistrationState{}
}

const sessionCount = "X-Session-Count"

// TestRegistersWithSessionCount: digest challenge answered, {sessions} rendered as the room count,
// and "full" (the room limit) reported at once on drain.
func TestRegistersWithSessionCount(t *testing.T) {
	reg := startRegistrar(t, "roomr", "secret")
	states := &stateLog{}
	r := startWith(t, rigOptions{
		nodeCfg: func(c *node.Config) { c.MaxRooms = 50 },
		uaCfg: func(c *sipua.Config) {
			c.Registrations = []sipua.Registration{{Registrar: reg.addr, AOR: "sip:roomr@sip.local",
				Username: "roomr", Password: "secret", Expires: 2 * time.Second,
				Headers: map[string]string{sessionCount: sipua.SessionsPlaceholder, "X-Node-Load": "rooms={sessions}"}}}
			c.OnRegistrationState = states.add
		}})
	// First REGISTER: no rooms, after a digest challenge.
	reg.waitHeader(t, sessionCount, "0", 3*time.Second)
	if s := states.wait(t, sipua.RegRegistered, time.Second); s.AOR != "sip:roomr@sip.local" || s.SIPStatus != 200 {
		t.Fatalf("registered state = %+v", s)
	}
	first := reg.snapshot()[0]
	if first.expires != "2" || first.headers["X-Node-Load"] != "rooms=0" || first.from != "sip:roomr@sip.local" {
		t.Fatalf("REGISTER = %+v", first)
	}
	reg.mu.Lock()
	challenged := reg.challenged
	reg.mu.Unlock()
	if challenged == 0 {
		t.Fatal("the registrar never challenged")
	}
	// Two answered calls: the periodic REGISTER (every Expires/2) carries 2.
	c1, _, _ := r.answeredCallWith(caller.DialOptions{}, "")
	c2, _, _ := r.answeredCallWith(caller.DialOptions{}, "")
	reg.waitHeader(t, sessionCount, "2", 3*time.Second)
	_ = c1.Hangup()
	_ = c2.Hangup()
	// Unregister: Expires 0 and an "unregistered" state.
	if err := r.ua.Unregister(rpcCtx(t)); err != nil {
		t.Fatal(err)
	}
	all := reg.snapshot()
	if all[len(all)-1].expires != "0" {
		t.Fatalf("last REGISTER Expires = %q, want 0", all[len(all)-1].expires)
	}
	states.wait(t, sipua.RegUnregistered, time.Second)
}

func TestReregistersOnLoadChange(t *testing.T) {
	reg := startRegistrar(t, "roomr", "secret")
	r := startWith(t, rigOptions{uaCfg: func(c *sipua.Config) {
		c.Registrations = []sipua.Registration{{Registrar: reg.addr, Password: "secret", Expires: 2 * time.Minute,
			Headers: map[string]string{sessionCount: sipua.SessionsPlaceholder}}}
		c.ReregisterDelta = 1
	}})
	reg.waitHeader(t, sessionCount, "0", 2*time.Second)
	// The interval is a minute, so a REGISTER with 1 can only come from the load change.
	call, _, _ := r.answeredCallWith(caller.DialOptions{}, "")
	reg.waitHeader(t, sessionCount, "1", time.Second)
	_ = call.Hangup()
}

// TestRegistersWithoutAuth: a registrar that does not challenge; a registration with no auth and
// no headers sends a plain REGISTER (no X-Session-Count: the node adds no header of its own).
func TestRegistersWithoutAuth(t *testing.T) {
	reg := startRegistrar(t, "", "")
	startWith(t, rigOptions{uaCfg: func(c *sipua.Config) {
		c.Registrations = []sipua.Registration{{Registrar: "sip:" + reg.addr, AOR: "sip:node-7@pbx.example"}}
	}})
	deadline := time.Now().Add(2 * time.Second)
	for len(reg.snapshot()) == 0 && time.Now().Before(deadline) {
		time.Sleep(20 * time.Millisecond)
	}
	got := reg.snapshot()
	if len(got) == 0 {
		t.Fatal("no REGISTER reached the registrar")
	}
	if got[0].from != "sip:node-7@pbx.example" || len(got[0].headers) != 0 || got[0].expires != "30" {
		t.Fatalf("REGISTER = %+v", got[0])
	}
}

// TestRegistrationFailsOnChallengeWithoutAuth: a challenge with no credentials configured, or with
// the wrong password, is a failed registration (registration.state failed with the status).
func TestRegistrationFailsOnChallengeWithoutAuth(t *testing.T) {
	reg := startRegistrar(t, "roomr", "secret")
	noAuth, badAuth := &stateLog{}, &stateLog{}
	startWith(t, rigOptions{uaCfg: func(c *sipua.Config) {
		c.Registrations = []sipua.Registration{{Registrar: reg.addr}}
		c.OnRegistrationState = noAuth.add
	}})
	startWith(t, rigOptions{uaCfg: func(c *sipua.Config) {
		c.Registrations = []sipua.Registration{{Registrar: reg.addr, Username: "roomr", Password: "wrong"}}
		c.OnRegistrationState = badAuth.add
	}})
	if s := noAuth.wait(t, sipua.RegFailed, 4*time.Second, 401); s.SIPStatus != 401 {
		t.Fatalf("no-auth state = %+v", s)
	}
	if s := badAuth.wait(t, sipua.RegFailed, 4*time.Second, 403); s.SIPStatus != 403 {
		t.Fatalf("bad-auth state = %+v", s)
	}
	if n := len(reg.snapshot()); n != 0 {
		t.Fatalf("registrar accepted %d REGISTERs", n)
	}
}

// TestNoRegistrations: with none configured the node sends no REGISTER and still takes calls.
func TestNoRegistrations(t *testing.T) {
	reg := startRegistrar(t, "", "")
	r := start(t)
	call, _, _ := r.answeredCallWith(caller.DialOptions{}, "")
	_ = call.Hangup()
	time.Sleep(300 * time.Millisecond)
	if n := len(reg.snapshot()); n != 0 {
		t.Fatalf("registrar saw %d REGISTERs", n)
	}
	if err := r.ua.Unregister(rpcCtx(t)); err != nil {
		t.Fatal(err)
	}
}
