package e2e

// A fake Routr registrar (add-media-node 1.3): it challenges the first REGISTER with digest auth,
// then accepts and records X-Session-Count from every REGISTER, so tests can check what Routr's
// least-sessions algorithm would see.

import (
	"net"
	"strconv"
	"sync"
	"testing"
	"time"

	"github.com/emiago/sipgo"
	"github.com/emiago/sipgo/sip"
	"github.com/fonoster/fonoster/go/medianode/internal/caller"
	"github.com/fonoster/fonoster/go/medianode/internal/sipua"
)

type fakeRegistrar struct {
	addr   string
	mu     sync.Mutex
	counts []int
	authed int
}

func startRegistrar(t *testing.T) *fakeRegistrar {
	ua, err := sipgo.NewUA(sipgo.WithUserAgent("fake-routr"))
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
	f := &fakeRegistrar{addr: l.LocalAddr().String()}
	srv.OnRegister(func(req *sip.Request, tx sip.ServerTransaction) {
		if req.GetHeader("Authorization") == nil {
			res := sip.NewResponseFromRequest(req, 401, "Unauthorized", nil)
			res.AppendHeader(sip.NewHeader("WWW-Authenticate", `Digest realm="fake", nonce="abc123", algorithm=MD5, qop="auth"`))
			_ = tx.Respond(res)
			return
		}
		count := -1
		if h := req.GetHeader("X-Session-Count"); h != nil {
			count, _ = strconv.Atoi(h.Value())
		}
		f.mu.Lock()
		f.counts = append(f.counts, count)
		f.authed++
		f.mu.Unlock()
		_ = tx.Respond(sip.NewResponseFromRequest(req, 200, "OK", nil))
	})
	go func() { _ = srv.ServeUDP(l) }()
	t.Cleanup(func() { _ = ua.Close() })
	return f
}

// waitCount waits for a REGISTER carrying count and returns how many REGISTERs came before it.
func (f *fakeRegistrar) waitCount(t *testing.T, count int, within time.Duration) int {
	deadline := time.Now().Add(within)
	for time.Now().Before(deadline) {
		f.mu.Lock()
		for i, c := range f.counts {
			if c == count {
				f.mu.Unlock()
				return i
			}
		}
		f.mu.Unlock()
		time.Sleep(20 * time.Millisecond)
	}
	f.mu.Lock()
	defer f.mu.Unlock()
	t.Fatalf("no REGISTER with X-Session-Count %d within %v; saw %v", count, within, f.counts)
	return -1
}

func TestRegistersWithSessionCount(t *testing.T) {
	reg := startRegistrar(t)
	r := startWith(t, rigOptions{uaCfg: func(c *sipua.Config) {
		c.Registrar, c.Username, c.Password, c.Domain = reg.addr, "medianode", "secret", "sip.local"
		c.RegisterEvery = 300 * time.Millisecond
	}})
	// First REGISTER: no rooms, after a digest challenge.
	reg.waitCount(t, 0, 2*time.Second)
	// Two answered calls: the periodic REGISTER carries 2.
	c1, _, _ := r.answeredCallWith(caller.DialOptions{}, "")
	c2, _, _ := r.answeredCallWith(caller.DialOptions{}, "")
	reg.waitCount(t, 2, 2*time.Second)
	// Draining reports the node full at once (not on the next interval).
	reg.mu.Lock()
	before := len(reg.counts)
	reg.mu.Unlock()
	r.node.Drain()
	idx := reg.waitCount(t, 1<<20, 250*time.Millisecond)
	if idx < before-1 {
		t.Fatalf("full count came before the drain")
	}
	_ = c1.Hangup()
	_ = c2.Hangup()
}

func TestReregistersOnLoadChange(t *testing.T) {
	reg := startRegistrar(t)
	r := startWith(t, rigOptions{uaCfg: func(c *sipua.Config) {
		c.Registrar, c.Password = reg.addr, "secret"
		c.RegisterEvery, c.ReregisterDelta = time.Minute, 1
	}})
	reg.waitCount(t, 0, 2*time.Second)
	// The interval is a minute, so a REGISTER with 1 can only come from the load change.
	call, _, _ := r.answeredCallWith(caller.DialOptions{}, "")
	reg.waitCount(t, 1, time.Second)
	_ = call.Hangup()
}
