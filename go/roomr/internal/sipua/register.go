package sipua

// Registrations (media-node, "Registration is optional and configured"): the node keeps zero or
// more REGISTERs from its configuration. Each names a registrar, an address of record, optional
// digest credentials, an expiry and header templates; {sessions} in a template is rendered as the
// node's active room count, or as its room limit while it is draining or full. A deployment that
// balances by load (Routr's least-sessions) templates X-Session-Count: "{sessions}"; any other
// registrar gets only the headers its configuration names.

import (
	"context"
	"errors"
	"fmt"
	"math"
	"net"
	"sort"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/emiago/sipgo"
	"github.com/emiago/sipgo/sip"
	"github.com/fonoster/fonoster/go/roomr/internal/sipheader"
)

// SessionsPlaceholder is replaced in registration header templates by the session count.
const SessionsPlaceholder = "{sessions}"

// Registration is one REGISTER the node keeps.
type Registration struct {
	// Registrar is where the REGISTER goes: host:port or a SIP URI; its transport parameter
	// (sip:host:port;transport=tcp) picks udp (default), tcp or tls, and tls is forced when the
	// node requires encryption.
	Registrar string
	// AOR is the address of record in From and To (sip:user@domain); default
	// sip:medianode@<registrar host>. Its user is the Contact's user too.
	AOR string
	// Username and Password answer a digest challenge (401/407); without either the challenge
	// fails the registration. Username defaults to the AOR's user.
	Username, Password string
	// Expires is the binding lifetime sent in Expires (default 30s); the node re-registers at
	// half of it.
	Expires time.Duration
	// Headers are added to every REGISTER after rendering {sessions}.
	Headers map[string]string
}

// Registration states reported through Config.OnRegistrationState.
const (
	RegRegistered   = "registered"
	RegFailed       = "failed"
	RegExpired      = "expired"
	RegUnregistered = "unregistered"
)

// RegistrationState is a change of one registration's state (registration.state).
type RegistrationState struct {
	Registrar string `json:"registrar"`
	AOR       string `json:"aor"`
	State     string `json:"state"`
	// SIPStatus is the registrar's final status (0: no response).
	SIPStatus int    `json:"sipStatus,omitempty"`
	Error     string `json:"error,omitempty"`
}

type registration struct {
	cfg       Registration
	dest      string // host:port the REGISTER is sent to
	transport string
	aor       sip.Uri
	kick      chan struct{}

	// sending serializes REGISTERs of this registration; closed (after Unregister) stops refreshes,
	// so no refresh in flight can land after the removal.
	sending sync.Mutex
	closed  bool

	mu     sync.Mutex
	last   int // sessions in the last accepted REGISTER; -1: none yet
	state  string
	status int // the last REGISTER's final status
	okAt   time.Time
}

func newRegistration(r Registration, requireEncryption bool) (*registration, error) {
	target, err := parseTarget(r.Registrar)
	if err != nil {
		return nil, fmt.Errorf("registration %q: registrar: %w", r.Registrar, err)
	}
	transport := orDefault(uriTransport(target), "udp")
	if requireEncryption {
		transport = "tls"
	}
	switch transport {
	case "udp", "tcp", "tls":
	default:
		return nil, fmt.Errorf("registration %q: transport %q is not udp, tcp or tls", r.Registrar, transport)
	}
	port := target.Port
	if port == 0 {
		port = 5060
		if transport == "tls" {
			port = 5061
		}
	}
	aor := sip.Uri{User: "medianode", Host: target.Host}
	if r.AOR != "" {
		parsed, err := parseTarget(r.AOR)
		if err != nil {
			return nil, fmt.Errorf("registration %q: aor: %w", r.Registrar, err)
		}
		aor = sip.Uri{User: orDefault(parsed.User, "medianode"), Host: parsed.Host, Port: parsed.Port}
	}
	if err := sipheader.Validate(r.Headers); err != nil {
		return nil, fmt.Errorf("registration %q: %w", r.Registrar, err)
	}
	if r.Expires <= 0 {
		r.Expires = 30 * time.Second
	}
	return &registration{cfg: r, dest: net.JoinHostPort(target.Host, strconv.Itoa(port)), transport: transport,
		aor: aor, kick: make(chan struct{}, 1), last: -1}, nil
}

// renderHeaders fills the templates with the session count.
func renderHeaders(templates map[string]string, sessions int) map[string]string {
	out := make(map[string]string, len(templates))
	for k, v := range templates {
		out[k] = strings.ReplaceAll(v, SessionsPlaceholder, strconv.Itoa(sessions))
	}
	return out
}

// sessions is what {sessions} renders as now: active rooms, or the room limit while the node is
// draining or full, so a load-balancing registrar stops choosing it.
func (u *UA) sessions() int {
	if u.node.Draining() || u.node.AtCapacity() {
		return u.node.RoomLimit()
	}
	return u.node.ActiveRooms()
}

// loadChanged re-registers soon after a large change in active rooms (MN3).
func (u *UA) loadChanged(count int) {
	for _, r := range u.regs {
		r.mu.Lock()
		last := r.last
		r.mu.Unlock()
		if last < 0 || abs(count-last) >= u.cfg.ReregisterDelta || count == 0 {
			r.poke()
		}
	}
}

func abs(i int) int {
	if i < 0 {
		return -i
	}
	return i
}

func (r *registration) poke() {
	select {
	case r.kick <- struct{}{}:
	default:
	}
}

// Kick re-registers every registration now (e.g. after Drain, so the registrar learns "full").
func (u *UA) Kick() {
	for _, r := range u.regs {
		r.poke()
	}
}

// registerLoop refreshes r at half its expiry, at once on a kick, and after a failure retries
// sooner (1 s, doubling up to the refresh interval).
func (u *UA) registerLoop(ctx context.Context, r *registration) {
	interval := r.cfg.Expires / 2
	retry := time.Second
	for {
		wait := interval
		if !u.refresh(ctx, r) {
			wait = min(retry, interval)
			retry = min(2*retry, interval)
		} else {
			retry = time.Second
		}
		t := time.NewTimer(wait)
		select {
		case <-ctx.Done():
			t.Stop()
			return
		case <-t.C:
		case <-r.kick:
			t.Stop()
		}
	}
}

// refresh sends one REGISTER and reports a change of state (or of the failure's status); it
// returns whether the registrar accepted it.
func (u *UA) refresh(ctx context.Context, r *registration) bool {
	expires := int(math.Ceil(r.cfg.Expires.Seconds()))
	r.sending.Lock()
	if r.closed {
		r.sending.Unlock()
		return true
	}
	status, err := u.send(ctx, r, expires)
	r.sending.Unlock()
	r.mu.Lock()
	prev, prevStatus := r.state, r.status
	r.status = status
	next := RegRegistered
	if err != nil {
		next = RegFailed
		if (prev == RegRegistered || prev == RegFailed) && !r.okAt.IsZero() && time.Since(r.okAt) > r.cfg.Expires {
			next = RegExpired
		}
		if prev == RegExpired {
			next = RegExpired
		}
	} else {
		r.okAt = time.Now()
	}
	r.state = next
	r.mu.Unlock()
	if err != nil {
		u.cfg.Logger.Warn("register failed", "registrar", r.cfg.Registrar, "aor", r.aor.String(), "err", err)
	}
	if next != prev || (err != nil && status != prevStatus) {
		u.reportState(r, next, status, err)
	}
	return err == nil
}

func (u *UA) reportState(r *registration, state string, status int, err error) {
	if u.cfg.OnRegistrationState == nil {
		return
	}
	s := RegistrationState{Registrar: r.cfg.Registrar, AOR: r.aor.String(), State: state, SIPStatus: status}
	if err != nil {
		s.Error = err.Error()
	}
	u.cfg.OnRegistrationState(s)
}

// Unregister removes every binding (REGISTER with Expires 0), so a registrar stops choosing a
// node that exits instead of waiting for the binding to expire (CO-B3).
func (u *UA) Unregister(ctx context.Context) error {
	var wg sync.WaitGroup
	errs := make([]error, len(u.regs))
	for i, r := range u.regs {
		wg.Add(1)
		go func() {
			defer wg.Done()
			r.sending.Lock()
			r.closed = true
			status, err := u.send(ctx, r, 0)
			r.sending.Unlock()
			errs[i] = err
			if err == nil {
				r.mu.Lock()
				r.state = RegUnregistered
				r.mu.Unlock()
				u.reportState(r, RegUnregistered, status, nil)
			}
		}()
	}
	wg.Wait()
	return errors.Join(errs...)
}

// send sends one REGISTER and answers a digest challenge; it returns the final status.
func (u *UA) send(ctx context.Context, r *registration, expires int) (int, error) {
	count := u.sessions()
	req := sip.NewRequest(sip.REGISTER, sip.Uri{Host: r.aor.Host, Port: r.aor.Port})
	req.SetDestination(r.dest)
	req.SetTransport(strings.ToUpper(r.transport))
	aor := sip.Uri{User: r.aor.User, Host: r.aor.Host, Port: r.aor.Port}
	req.AppendHeader(&sip.FromHeader{Address: aor, Params: sip.NewParams()})
	req.AppendHeader(&sip.ToHeader{Address: aor})
	contactParams := sip.NewParams()
	contactParams.Add("transport", r.transport)
	req.AppendHeader(&sip.ContactHeader{Address: sip.Uri{User: r.aor.User, Host: u.cfg.AdvertiseHost,
		Port: u.cfg.AdvertisePort, UriParams: contactParams}})
	req.AppendHeader(sip.NewHeader("Expires", strconv.Itoa(expires)))
	rendered := renderHeaders(r.cfg.Headers, count)
	names := make([]string, 0, len(rendered))
	for k := range rendered {
		names = append(names, k)
	}
	sort.Strings(names)
	for _, k := range names {
		req.AppendHeader(sip.NewHeader(k, rendered[k]))
	}

	cctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()
	res, err := u.client.Do(cctx, req, sipgo.ClientRequestRegisterBuild)
	if err != nil {
		return 0, err
	}
	// sipgo can end a canceled transaction with neither a response nor an error.
	if res == nil {
		return 0, errors.New("REGISTER got no response")
	}
	if res.StatusCode == 401 || res.StatusCode == 407 {
		if r.cfg.Username == "" && r.cfg.Password == "" {
			return int(res.StatusCode), fmt.Errorf("REGISTER challenged (%d) and no auth is configured", res.StatusCode)
		}
		user := orDefault(r.cfg.Username, r.aor.User)
		res, err = u.client.DoDigestAuth(cctx, req, res, sipgo.DigestAuth{Username: user, Password: r.cfg.Password})
		if err != nil {
			return 0, err
		}
		if res == nil {
			return 0, errors.New("REGISTER got no response")
		}
	}
	if res.StatusCode != 200 {
		return int(res.StatusCode), fmt.Errorf("REGISTER answered %d", res.StatusCode)
	}
	r.mu.Lock()
	r.last = count
	r.mu.Unlock()
	return 200, nil
}
