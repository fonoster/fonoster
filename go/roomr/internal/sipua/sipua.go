// Package sipua is the node's SIP side: INVITEs from the SIP proxy become rooms, and the node
// keeps the registrations its configuration lists, none by default (media-node, "Registration is
// optional and configured").
package sipua

import (
	"context"
	"crypto/tls"
	"errors"
	"fmt"
	"log/slog"
	"net"
	"runtime/debug"
	"strconv"
	"strings"
	"sync"
	"sync/atomic"
	"time"

	"github.com/emiago/sipgo"
	"github.com/emiago/sipgo/sip"
	"github.com/fonoster/fonoster/go/roomr/internal/node"
	"github.com/fonoster/fonoster/go/roomr/internal/sdp"
)

// Config is the SIP side's configuration.
type Config struct {
	// Listen is host:port for UDP and TCP.
	Listen string
	// AdvertiseHost and AdvertisePort go in Contact headers.
	AdvertiseHost string
	AdvertisePort int
	// Registrations are the REGISTERs the node keeps; none sends no REGISTER.
	Registrations []Registration
	// OnRegistrationState reports a registration that succeeded, failed, expired or was removed
	// (registration.state on NATS); nil drops the reports.
	OnRegistrationState func(RegistrationState)
	// OutboundProxy is where outbound INVITEs go (Routr, which picks the carrier trunk): host:port
	// or a SIP URI whose transport parameter picks udp (default), tcp or tls
	// (sip:host:port;transport=tcp); empty disables participant.dial and transfers.
	OutboundProxy string
	// ReregisterDelta is the load-change threshold: every registration re-registers at once when
	// the room count moved by at least this much since its last accepted REGISTER (default 5).
	ReregisterDelta int
	// TLSListen is host:port for SIP over TLS (empty: no TLS listener); TLSConfig is its
	// server certificate. ClientTLS verifies the edge when the node dials or registers over TLS.
	TLSListen string
	TLSConfig *tls.Config
	ClientTLS *tls.Config
	Logger    *slog.Logger
}

// UA serves SIP for one node.
type UA struct {
	cfg     Config
	node    *node.Node
	ua      *sipgo.UserAgent
	srv     *sipgo.Server
	client  *sipgo.Client
	dialogs *sipgo.DialogServerCache
	// dialogsTLS answers INVITEs that arrived over the TLS listener, with a TLS Contact (nil
	// without a TLS listener).
	dialogsTLS *sipgo.DialogServerCache
	out        *sipgo.DialogClientCache
	regs       []*registration
	// legs by dialog ID (Call-ID plus both tags), for SIP INFO keypresses.
	legs sync.Map
	// openDialogs counts INVITE dialogs in the server dialog cache (leak check, RV-B9).
	openDialogs atomic.Int64
	// udp is the UDP listening socket, bound in New so requests can go out from it.
	udp net.PacketConn
	// tcp is the TCP listener on the same address, also bound in New so a taken port fails
	// startup instead of stopping a node that already reported ready.
	tcp net.Listener
}

// New wires a SIP user agent to the node.
func New(n *node.Node, cfg Config) (*UA, error) {
	if cfg.Logger == nil {
		cfg.Logger = slog.Default()
	}
	if cfg.ReregisterDelta <= 0 {
		cfg.ReregisterDelta = 5
	}
	opts := []sipgo.UserAgentOption{sipgo.WithUserAgent("fonoster-roomr")}
	if cfg.ClientTLS != nil {
		opts = append(opts, sipgo.WithUserAgenTLSConfig(cfg.ClientTLS))
	}
	ua, err := sipgo.NewUA(opts...)
	if err != nil {
		return nil, err
	}
	srv, err := sipgo.NewServer(ua)
	if err != nil {
		return nil, err
	}
	// rport (RFC 3581) and requests sent from the listening port: Routr stores the REGISTER's
	// source address and port as the route, so INVITEs must be able to come back to it, behind NAT
	// (Docker for Mac, cloud load balancers) as well as without it (CO-B2).
	clientOpts := []sipgo.ClientOption{sipgo.WithClientHostname(cfg.AdvertiseHost), sipgo.WithClientNAT()}
	udp, err := net.ListenPacket("udp4", cfg.Listen)
	if err != nil {
		return nil, err
	}
	tcp, err := net.Listen("tcp", cfg.Listen)
	if err != nil {
		_ = udp.Close()
		return nil, err
	}
	clientOpts = append(clientOpts, sipgo.WithClientConnectionAddr(udp.LocalAddr().String()))
	client, err := sipgo.NewClient(ua, clientOpts...)
	if err != nil {
		return nil, err
	}
	contact := sip.ContactHeader{Address: sip.Uri{User: "medianode", Host: cfg.AdvertiseHost, Port: cfg.AdvertisePort}}
	u := &UA{cfg: cfg, node: n, ua: ua, srv: srv, client: client, udp: udp, tcp: tcp,
		dialogs: sipgo.NewDialogServerCache(client, contact), out: sipgo.NewDialogClientCache(client, contact)}
	for _, r := range cfg.Registrations {
		reg, err := newRegistration(r)
		if err != nil {
			return nil, err
		}
		u.regs = append(u.regs, reg)
	}
	if cfg.TLSListen != "" {
		_, tlsPort, _ := net.SplitHostPort(cfg.TLSListen)
		port, _ := strconv.Atoi(tlsPort)
		params := sip.NewParams()
		params.Add("transport", "tls")
		tlsContact := sip.ContactHeader{Address: sip.Uri{User: "medianode", Host: cfg.AdvertiseHost, Port: port, UriParams: params}}
		u.dialogsTLS = sipgo.NewDialogServerCache(client, tlsContact)
	}
	srv.OnInvite(u.guard(u.onInvite))
	srv.OnAck(u.guard(func(req *sip.Request, tx sip.ServerTransaction) {
		if u.dialogsTLS != nil && u.dialogsTLS.ReadAck(req, tx) == nil {
			return
		}
		_ = u.dialogs.ReadAck(req, tx)
	}))
	srv.OnBye(u.guard(func(req *sip.Request, tx sip.ServerTransaction) {
		if u.dialogsTLS != nil && u.dialogsTLS.ReadBye(req, tx) == nil {
			return
		}
		if err := u.dialogs.ReadBye(req, tx); err == nil {
			return
		}
		if err := u.out.ReadBye(req, tx); err != nil {
			_ = tx.Respond(sip.NewResponseFromRequest(req, 481, "Call/Transaction Does Not Exist", nil))
		}
	}))
	srv.OnInfo(u.guard(u.onInfo))
	srv.OnOptions(u.guard(func(req *sip.Request, tx sip.ServerTransaction) {
		_ = tx.Respond(sip.NewResponseFromRequest(req, 200, "OK", nil))
	}))
	n.OnRoomCount = func(count int) { u.loadChanged(count) }
	if cfg.OutboundProxy != "" {
		n.SetDialer(u)
	}
	n.SetTargetDialer(u)
	return u, nil
}

// Serve listens on UDP and TCP until ctx ends.
func (u *UA) Serve(ctx context.Context) error {
	errs := make(chan error, 3)
	go func() { errs <- u.srv.ServeUDP(u.udp) }()
	go func() { errs <- u.srv.ServeTCP(u.tcp) }()
	if u.cfg.TLSListen != "" && u.cfg.TLSConfig != nil {
		go func() { errs <- u.srv.ListenAndServeTLS(ctx, "tcp", u.cfg.TLSListen, u.cfg.TLSConfig) }()
	}
	for _, r := range u.regs {
		go u.registerLoop(ctx, r)
	}
	select {
	case <-ctx.Done():
		return nil
	case err := <-errs:
		return err
	}
}

// Close releases the user agent (call Unregister first on a clean exit).
func (u *UA) Close() {
	_ = u.ua.Close()
	if u.udp != nil {
		_ = u.udp.Close()
	}
	if u.tcp != nil {
		_ = u.tcp.Close()
	}
}

func header(req *sip.Request, name string) string {
	if h := req.GetHeader(name); h != nil {
		return h.Value()
	}
	return ""
}

// OpenDialogs is the number of INVITE dialogs the node still holds (tests: no leaks).
func (u *UA) OpenDialogs() int { return int(u.openDialogs.Load()) }

// wellFormed reports whether a request carries the headers every handler relies on.
func wellFormed(req *sip.Request) bool {
	return req.CallID() != nil && req.From() != nil && req.To() != nil && req.CSeq() != nil && req.Via() != nil
}

// guard wraps a request handler: a request without Call-ID, From, To, CSeq or Via gets 400, and
// a panic in one handler is logged instead of killing the node (RV-B1).
func (u *UA) guard(h sipgo.RequestHandler) sipgo.RequestHandler {
	return func(req *sip.Request, tx sip.ServerTransaction) {
		defer func() {
			if r := recover(); r != nil {
				u.cfg.Logger.Error("sip request handler panicked", "method", string(req.Method), "panic", r,
					"stack", string(debug.Stack()))
				respondSafely(req, tx, 500, "Server Error")
			}
		}()
		if !wellFormed(req) {
			u.cfg.Logger.Warn("malformed sip request", "method", string(req.Method), "source", req.Source())
			respondSafely(req, tx, 400, "Bad Request")
			return
		}
		h(req, tx)
	}
}

// respondSafely answers a request that may be malformed; ACK gets no response.
func respondSafely(req *sip.Request, tx sip.ServerTransaction, status int, reason string) {
	if tx == nil || req.IsAck() {
		return
	}
	defer func() { _ = recover() }()
	_ = tx.Respond(sip.NewResponseFromRequest(req, status, reason, nil))
}

func (u *UA) onInvite(req *sip.Request, tx sip.ServerTransaction) {
	media, err := sdp.Parse(req.Body())
	if err != nil {
		_ = tx.Respond(sip.NewResponseFromRequest(req, 488, "Not Acceptable Here", nil))
		return
	}
	cache := u.dialogs
	if u.dialogsTLS != nil && strings.EqualFold(req.Transport(), "TLS") {
		cache = u.dialogsTLS
	}
	dlg, err := cache.ReadInvite(req, tx)
	if err != nil {
		_ = tx.Respond(sip.NewResponseFromRequest(req, 500, "Server Error", nil))
		return
	}
	// Every exit that does not answer closes the dialog, so the cache does not keep it (RV-B9).
	u.openDialogs.Add(1)
	closeDialog := sync.OnceFunc(func() {
		_ = dlg.Close()
		u.openDialogs.Add(-1)
	})
	answered := false
	defer func() {
		if !answered {
			closeDialog()
		}
	}()
	_ = dlg.Respond(100, "Trying", nil)

	leg := &inviteLeg{dlg: dlg, final: make(chan int, 1)}
	legID := dlg.ID
	u.legs.Store(legID, leg)
	go func() {
		<-dlg.Context().Done()
		u.legs.Delete(legID)
	}()
	headers := map[string]string{}
	for _, h := range req.Headers() {
		name := h.Name()
		if strings.HasPrefix(strings.ToLower(name), "x-") {
			headers[name] = h.Value()
		}
	}
	from, to := req.From(), req.To()
	call := node.IncomingCall{
		AppRef:    header(req, "X-App-Ref"),
		Direction: directionOf(header(req, "X-Call-Direction")),
		Headers:   headers,
		Media:     media,
		Leg:       leg,
	}
	if from != nil {
		call.From, call.CallerName = from.Address.User, strings.Trim(from.DisplayName, "\"")
	}
	if to != nil {
		call.To = to.Address.User
	}
	roomRef := make(chan string, 1)
	call.OnRoom = func(ref string) { roomRef <- ref }
	go u.node.Incoming(call)

	// The INVITE transaction lives until a final response or a CANCEL.
	var ref string
	select {
	case ref = <-roomRef:
	case <-leg.final:
		return
	case <-dlg.Context().Done():
		return
	}
	select {
	case status := <-leg.final:
		if status >= 300 {
			return
		}
	case <-dlg.Context().Done():
		u.node.CallerGone(ref) // CANCEL before answer
		return
	}
	// Answered: the dialog ends on BYE (either side).
	answered = true
	go func() {
		<-dlg.Context().Done()
		u.node.CallerGone(ref)
		closeDialog()
	}()
}

func directionOf(h string) string {
	switch strings.ToLower(h) {
	case "to_pstn", "outbound":
		return "outbound"
	default:
		return "inbound"
	}
}

// inviteLeg answers one INVITE for the node (node.CallLeg).
type inviteLeg struct {
	dlg   *sipgo.DialogServerSession
	final chan int
	once  sync.Once
	dtmf
}

// dtmf holds a leg's SIP INFO keypress handler (node.DTMFSource).
type dtmf struct {
	mu sync.Mutex
	fn func(string)
}

func (d *dtmf) OnDTMF(fn func(string)) {
	d.mu.Lock()
	d.fn = fn
	d.mu.Unlock()
}

func (d *dtmf) deliver(digit string) bool {
	d.mu.Lock()
	fn := d.fn
	d.mu.Unlock()
	if fn == nil {
		return false
	}
	fn(digit)
	return true
}

type dtmfLeg interface{ deliver(string) bool }

// legFor finds the leg an in-dialog request belongs to by its dialog ID (Call-ID and both
// tags): a dialog the node answered (UAS) or one it dialed (UAC). Call-ID alone is not enough.
func (u *UA) legFor(req *sip.Request) (any, bool) {
	if id, err := sip.DialogIDFromRequestUAS(req); err == nil {
		if v, ok := u.legs.Load(id); ok {
			return v, true
		}
	}
	if id, err := sip.DialogIDFromRequestUAC(req); err == nil {
		if v, ok := u.legs.Load(id); ok {
			return v, true
		}
	}
	return nil, false
}

// onInfo reads SIP INFO keypresses: application/dtmf-relay ("Signal=7") or application/dtmf ("7").
func (u *UA) onInfo(req *sip.Request, tx sip.ServerTransaction) {
	v, ok := u.legFor(req)
	if !ok {
		_ = tx.Respond(sip.NewResponseFromRequest(req, 481, "Call/Transaction Does Not Exist", nil))
		return
	}
	digit := infoDigit(req)
	if digit == "" {
		_ = tx.Respond(sip.NewResponseFromRequest(req, 415, "Unsupported Media Type", nil))
		return
	}
	_ = tx.Respond(sip.NewResponseFromRequest(req, 200, "OK", nil))
	v.(dtmfLeg).deliver(digit)
}

func infoDigit(req *sip.Request) string {
	ct := ""
	if h := req.ContentType(); h != nil {
		ct = strings.ToLower(h.Value())
	}
	body := strings.TrimSpace(string(req.Body()))
	switch {
	case strings.HasPrefix(ct, "application/dtmf-relay"):
		for _, line := range strings.Split(body, "\n") {
			k, v, ok := strings.Cut(strings.TrimSpace(line), "=")
			if ok && strings.EqualFold(strings.TrimSpace(k), "signal") {
				return normalizeDigit(strings.TrimSpace(v))
			}
		}
	case strings.HasPrefix(ct, "application/dtmf"):
		return normalizeDigit(body)
	}
	return ""
}

func normalizeDigit(v string) string {
	switch v {
	case "10":
		return "*"
	case "11":
		return "#"
	}
	if len(v) == 1 && strings.Contains("0123456789*#ABCDabcd", v) {
		return strings.ToUpper(v)
	}
	return ""
}

func (l *inviteLeg) finish(status int) {
	l.once.Do(func() { l.final <- status })
}

func (l *inviteLeg) Ring() error { return l.dlg.Respond(180, "Ringing", nil) }

func (l *inviteLeg) Answer(body []byte) error {
	err := l.dlg.RespondSDP(body)
	l.finish(200)
	return err
}

func (l *inviteLeg) Reject(status int) error {
	err := l.dlg.Respond(status, reasonPhrase(status), nil)
	l.finish(status)
	return err
}

// Refer sends a SIP REFER on the caller's leg (transfer mode refer) and waits for 202.
func (l *inviteLeg) Refer(target string) error {
	req := sip.NewRequest(sip.REFER, l.dlg.InviteRequest.Contact().Address)
	req.AppendHeader(sip.NewHeader("Refer-To", "<"+referURI(target)+">"))
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	res, err := l.dlg.Do(ctx, req)
	if err != nil {
		return err
	}
	if res.StatusCode != 202 && res.StatusCode != 200 {
		return fmt.Errorf("REFER answered %d", res.StatusCode)
	}
	return nil
}

func referURI(target string) string {
	if strings.HasPrefix(target, "sip:") || strings.HasPrefix(target, "tel:") {
		return target
	}
	return "tel:" + target
}

func (l *inviteLeg) Bye() error {
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()
	return l.dlg.Bye(ctx)
}

func reasonPhrase(status int) string {
	switch status {
	case 404:
		return "Not Found"
	case 480:
		return "Temporarily Unavailable"
	case 486:
		return "Busy Here"
	case 488:
		return "Not Acceptable Here"
	case 503:
		return "Service Unavailable"
	}
	return "Error"
}

// ---- outbound legs --------------------------------------------------------------------------

// DODNumberHeader carries the caller-id number of a Peer's call to the PSTN; Routr picks the
// trunk by it (connect's peerToPSTN reads X-DOD-Number; SIP header names are case-insensitive).
const DODNumberHeader = "X-DOD-Number"

// The NATS participant.dial and transfer INVITEs (retired with media.<id>.commands) dial as the
// Peer the node registers as: the first registration's AOR and auth.

// peerUser is the Peer's username: the first registration's auth username, else its AOR user.
func (u *UA) peerUser() string {
	if len(u.regs) > 0 {
		return orDefault(u.regs[0].cfg.Username, u.regs[0].aor.User)
	}
	return "medianode"
}

// peerPassword answers the outbound proxy's challenge.
func (u *UA) peerPassword() string {
	if len(u.regs) > 0 {
		return u.regs[0].cfg.Password
	}
	return ""
}

// peerDomain is the host in the Peer's From: the first registration's AOR host, else the
// outbound proxy's host.
func (u *UA) peerDomain() string {
	if len(u.regs) > 0 {
		return u.regs[0].aor.Host
	}
	if proxy, err := parseTarget(u.cfg.OutboundProxy); err == nil {
		return proxy.Host
	}
	return u.cfg.AdvertiseHost
}

// Dial sends an INVITE through the outbound proxy (node.Dialer).
func (u *UA) Dial(ctx context.Context, to, from string, headers map[string]string, offer []byte,
	onProgress func(status int)) (node.OutLeg, []byte, error) {
	proxy, err := parseTarget(u.cfg.OutboundProxy)
	if err != nil {
		return nil, nil, err
	}
	// The node calls as its Routr Peer, the way Asterisk's outbound endpoint did (from_user and
	// outbound_auth): Routr finds the caller by the From user, so From is the Peer and the caller-id
	// number travels in X-DOD-Number, which picks the trunk (PEER_TO_PSTN). A Number in From makes
	// the routing direction unknown and Routr answers 403 (OB-B1).
	user := u.peerUser()
	fromHdr := &sip.FromHeader{Address: sip.Uri{User: user, Host: u.peerDomain()}, Params: sip.NewParams()}
	fromHdr.Params.Add("tag", sip.GenerateTagN(10))
	hdrs := []sip.Header{fromHdr, sip.NewHeader("Content-Type", "application/sdp")}
	hasDOD := false
	for k, v := range headers {
		if strings.EqualFold(k, DODNumberHeader) {
			hasDOD = true
		}
		hdrs = append(hdrs, sip.NewHeader(k, v))
	}
	if !hasDOD && from != "" {
		hdrs = append(hdrs, sip.NewHeader(DODNumberHeader, from))
	}
	target := sip.Uri{User: to, Host: proxy.Host, Port: proxy.Port}
	if tr := uriTransport(proxy); tr != "" && tr != "udp" {
		target.UriParams = sip.NewParams()
		target.UriParams.Add("transport", tr)
	}
	session, err := u.out.Invite(ctx, target, offer, hdrs...)
	if err != nil {
		return nil, nil, err
	}
	// Routr challenges a Peer's INVITE (401) like its REGISTER: answer with the same credentials.
	return u.awaitAnswer(ctx, session, user, u.peerPassword(), onProgress)
}

// awaitAnswer waits for a dialed INVITE's final response, answering a digest challenge with
// user and password, and ACKs a 200.
func (u *UA) awaitAnswer(ctx context.Context, session *sipgo.DialogClientSession, user, password string,
	onProgress func(status int)) (node.OutLeg, []byte, error) {
	err := session.WaitAnswer(ctx, sipgo.AnswerOptions{Username: user, Password: password,
		OnResponse: func(res *sip.Response) error {
			onProgress(int(res.StatusCode))
			return nil
		}})
	if err != nil {
		var final *sipgo.ErrDialogResponse
		if errors.As(err, &final) {
			return nil, nil, &node.DialError{Status: int(final.Res.StatusCode)}
		}
		if ctx.Err() != nil {
			return nil, nil, &node.DialError{Status: 408}
		}
		return nil, nil, err
	}
	if err := session.Ack(context.Background()); err != nil {
		return nil, nil, err
	}
	leg := &outLeg{session: session}
	legID := session.ID
	u.legs.Store(legID, leg)
	go func() {
		<-session.Context().Done()
		u.legs.Delete(legID)
	}()
	return leg, session.InviteResponse.Body(), nil
}

// parseTarget reads "sip:user@host:port;params", "sips:..." or a bare "host:port".
func parseTarget(s string) (sip.Uri, error) {
	s = strings.TrimSpace(s)
	lower := strings.ToLower(s)
	if !strings.HasPrefix(lower, "sip:") && !strings.HasPrefix(lower, "sips:") {
		s = "sip:" + s
	}
	var uri sip.Uri
	if err := sip.ParseUri(s, &uri); err != nil {
		return sip.Uri{}, err
	}
	if uri.Host == "" {
		return sip.Uri{}, fmt.Errorf("no host in %q", s)
	}
	return uri, nil
}

func uriTransport(uri sip.Uri) string {
	if uri.UriParams != nil {
		if tr, ok := uri.UriParams.Get("transport"); ok && tr != "" {
			return strings.ToLower(tr)
		}
	}
	if uri.Scheme == "sips" {
		return "tls"
	}
	return ""
}

// DialTarget sends an INVITE to t.URI through t.Proxy, with t.Headers added untouched and
// t's digest credentials for a challenge (node.TargetDialer, Roomr CreateCall). Unlike
// Dial it does not call as the Routr Peer: From is `from` and no header is added.
func (u *UA) DialTarget(ctx context.Context, t node.SipTarget, from string, offer []byte,
	onProgress func(status int)) (node.OutLeg, []byte, error) {
	recipient, err := parseTarget(t.URI)
	if err != nil {
		return nil, nil, &node.Error{Code: node.CodeBadMessage, Message: "to.uri: " + err.Error()}
	}
	next, transport := recipient, uriTransport(recipient)
	if t.Proxy != "" {
		if next, err = parseTarget(t.Proxy); err != nil {
			return nil, nil, &node.Error{Code: node.CodeBadMessage, Message: "to.proxy: " + err.Error()}
		}
		transport = uriTransport(next)
	}
	if transport == "" {
		transport = "udp"
	}
	req := sip.NewRequest(sip.INVITE, recipient)
	req.SetBody(offer)
	req.SetTransport(strings.ToUpper(transport))
	if t.Proxy != "" {
		// The proxy as a loose route (RFC 3261 8.1.2): the INVITE, its CANCEL and the ACK of a
		// failure all go to it while the Request-URI stays the callee's.
		route := sip.Uri{Scheme: "sip", Host: next.Host, Port: next.Port, UriParams: sip.NewParams()}
		if route.Port == 0 {
			route.Port = 5060
			if transport == "tls" {
				route.Port = 5061
			}
		}
		if transport != "udp" {
			route.UriParams.Add("transport", transport)
		}
		route.UriParams.Add("lr", "")
		req.AppendHeader(&sip.RouteHeader{Address: route})
	}
	var fromURI sip.Uri
	if strings.Contains(from, "@") || strings.HasPrefix(strings.ToLower(from), "sip") {
		if fromURI, err = parseTarget(from); err != nil {
			return nil, nil, &node.Error{Code: node.CodeBadMessage, Message: "from: " + err.Error()}
		}
	} else {
		fromURI = sip.Uri{User: orDefault(from, u.peerUser()), Host: u.peerDomain()}
	}
	fromHdr := &sip.FromHeader{Address: fromURI, Params: sip.NewParams()}
	fromHdr.Params.Add("tag", sip.GenerateTagN(10))
	req.AppendHeader(fromHdr)
	req.AppendHeader(sip.NewHeader("Content-Type", "application/sdp"))
	for k, v := range t.Headers {
		req.AppendHeader(sip.NewHeader(k, v))
	}
	session, err := u.out.WriteInvite(ctx, req)
	if err != nil {
		return nil, nil, err
	}
	return u.awaitAnswer(ctx, session, t.Username, t.Password, onProgress)
}

func orDefault(s, d string) string {
	if s == "" {
		return d
	}
	return s
}

type outLeg struct {
	session *sipgo.DialogClientSession
	dtmf
}

func (l *outLeg) Bye() error {
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()
	return l.session.Bye(ctx)
}

func (l *outLeg) Gone() <-chan struct{} { return l.session.Context().Done() }
