// Package sipua is the node's SIP side: INVITEs from Routr become rooms, and the node registers
// to Routr with its session count (media-node, "Nodes register to Routr with their session count").
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
	"github.com/fonoster/fonoster/go/medianode/internal/node"
	"github.com/fonoster/fonoster/go/medianode/internal/sdp"
)

// Config is the SIP side's configuration.
type Config struct {
	// Listen is host:port for UDP and TCP.
	Listen string
	// AdvertiseHost and AdvertisePort go in Contact headers.
	AdvertiseHost string
	AdvertisePort int
	// Registrar is Routr's address (host:port); empty disables registration.
	Registrar string
	// Domain, Username and Password identify the node as a Routr peer.
	Domain, Username, Password string
	// Transport for REGISTER: "udp" or "tcp".
	Transport string
	// OutboundProxy is where outbound INVITEs go (Routr, which picks the carrier trunk); empty
	// disables participant.dial and transfers.
	OutboundProxy string
	// RegisterEvery is the re-register interval; re-registers also follow load changes.
	RegisterEvery time.Duration
	// ReregisterDelta re-registers at once when the room count moved by at least this much since
	// the last REGISTER (default 5).
	ReregisterDelta int
	// TLSListen is host:port for SIP over TLS (empty: no TLS listener); TLSConfig is its
	// server certificate. ClientTLS verifies the edge when the node dials or registers over TLS.
	TLSListen string
	TLSConfig *tls.Config
	ClientTLS *tls.Config
	// RequireEncryption serves SIP over TLS only and refuses INVITEs that arrive any other way
	// (MN6); RTP must then be SRTP (node.Config.RequireEncryption).
	RequireEncryption bool
	// OutboundTransport is "udp" (default), "tcp" or "tls" for INVITEs to OutboundProxy; it is
	// "tls" whenever encryption is required.
	OutboundTransport string
	// TrustedSources lists the addresses (IP, CIDR or host name) allowed to send INVITEs: the
	// node trusts X-App-Ref, X-Call-Ref and X-Call-Direction only from the edge (Routr). Empty
	// accepts INVITEs from anywhere (development); New logs a warning then (RV-B7).
	TrustedSources []string
	Logger         *slog.Logger
}

// UA serves SIP for one node.
type UA struct {
	cfg     Config
	node    *node.Node
	ua      *sipgo.UserAgent
	srv     *sipgo.Server
	client  *sipgo.Client
	dialogs *sipgo.DialogServerCache
	out     *sipgo.DialogClientCache
	kick    chan struct{}
	lastReg int
	mu      sync.Mutex
	// legs by dialog ID (Call-ID plus both tags), for SIP INFO keypresses.
	legs sync.Map
	// openDialogs counts INVITE dialogs in the server dialog cache (leak check, RV-B9).
	openDialogs atomic.Int64
	trust       *sourceFilter
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
	if cfg.RegisterEvery == 0 {
		cfg.RegisterEvery = 15 * time.Second
	}
	if cfg.ReregisterDelta <= 0 {
		cfg.ReregisterDelta = 5
	}
	if cfg.Transport == "" {
		cfg.Transport = "udp"
	}
	if cfg.OutboundTransport == "" {
		cfg.OutboundTransport = "udp"
	}
	if cfg.RequireEncryption {
		cfg.Transport, cfg.OutboundTransport = "tls", "tls"
		if cfg.TLSListen == "" || cfg.TLSConfig == nil {
			return nil, errors.New("encryption required but no TLS listener or certificate configured")
		}
	}
	opts := []sipgo.UserAgentOption{sipgo.WithUserAgent("fonoster-medianode")}
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
	// (Docker for Mac, cloud load balancers) as well as without it (CO-B2). With encryption
	// required there is no plain listener at all (MN6).
	var udp net.PacketConn
	var tcp net.Listener
	clientOpts := []sipgo.ClientOption{sipgo.WithClientHostname(cfg.AdvertiseHost), sipgo.WithClientNAT()}
	if !cfg.RequireEncryption {
		udp, err = net.ListenPacket("udp4", cfg.Listen)
		if err != nil {
			return nil, err
		}
		tcp, err = net.Listen("tcp", cfg.Listen)
		if err != nil {
			_ = udp.Close()
			return nil, err
		}
		clientOpts = append(clientOpts, sipgo.WithClientConnectionAddr(udp.LocalAddr().String()))
	}
	client, err := sipgo.NewClient(ua, clientOpts...)
	if err != nil {
		return nil, err
	}
	contact := sip.ContactHeader{Address: sip.Uri{User: "medianode", Host: cfg.AdvertiseHost, Port: cfg.AdvertisePort}}
	if cfg.RequireEncryption {
		_, tlsPort, _ := net.SplitHostPort(cfg.TLSListen)
		port, _ := strconv.Atoi(tlsPort)
		params := sip.NewParams()
		params.Add("transport", "tls")
		contact.Address.Port, contact.Address.UriParams = port, params
	}
	trust, err := newSourceFilter(cfg.TrustedSources)
	if err != nil {
		return nil, err
	}
	if trust == nil {
		cfg.Logger.Warn("no trusted SIP sources configured: INVITEs are accepted from any address")
	}
	u := &UA{cfg: cfg, node: n, ua: ua, srv: srv, client: client, udp: udp, tcp: tcp, trust: trust,
		dialogs: sipgo.NewDialogServerCache(client, contact), out: sipgo.NewDialogClientCache(client, contact),
		kick: make(chan struct{}, 1), lastReg: -1}
	srv.OnInvite(u.guard(u.onInvite))
	srv.OnAck(u.guard(func(req *sip.Request, tx sip.ServerTransaction) { _ = u.dialogs.ReadAck(req, tx) }))
	srv.OnBye(u.guard(func(req *sip.Request, tx sip.ServerTransaction) {
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
	n.OnDrain = func() { u.Kick() }
	if cfg.OutboundProxy != "" {
		n.SetDialer(u)
	}
	return u, nil
}

// Serve listens on UDP and TCP until ctx ends.
func (u *UA) Serve(ctx context.Context) error {
	errs := make(chan error, 3)
	if !u.cfg.RequireEncryption {
		go func() { errs <- u.srv.ServeUDP(u.udp) }()
		go func() { errs <- u.srv.ServeTCP(u.tcp) }()
	}
	if u.cfg.TLSListen != "" && u.cfg.TLSConfig != nil {
		go func() { errs <- u.srv.ListenAndServeTLS(ctx, "tcp", u.cfg.TLSListen, u.cfg.TLSConfig) }()
	}
	if u.cfg.Registrar != "" {
		go u.registerLoop(ctx)
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
	if !u.trust.allows(req.Source()) {
		u.cfg.Logger.Warn("INVITE from an untrusted source refused", "source", req.Source())
		_ = tx.Respond(sip.NewResponseFromRequest(req, 403, "Forbidden", nil))
		return
	}
	if u.cfg.RequireEncryption && !strings.EqualFold(req.Transport(), "TLS") {
		_ = tx.Respond(sip.NewResponseFromRequest(req, 403, "TLS Required", nil))
		return
	}
	media, err := sdp.Parse(req.Body())
	if err != nil {
		_ = tx.Respond(sip.NewResponseFromRequest(req, 488, "Not Acceptable Here", nil))
		return
	}
	if u.node.Draining() {
		_ = tx.Respond(sip.NewResponseFromRequest(req, 503, "Service Unavailable", nil))
		return
	}
	dlg, err := u.dialogs.ReadInvite(req, tx)
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
		CallRef:   header(req, "X-Call-Ref"),
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

// ---- registration ---------------------------------------------------------------------------

// loadChanged re-registers soon after a large change in active rooms (MN3).
func (u *UA) loadChanged(count int) {
	u.mu.Lock()
	last := u.lastReg
	u.mu.Unlock()
	if last < 0 || abs(count-last) >= u.cfg.ReregisterDelta || count == 0 {
		u.Kick()
	}
}

func abs(i int) int {
	if i < 0 {
		return -i
	}
	return i
}

func (u *UA) registerLoop(ctx context.Context) {
	t := time.NewTicker(u.cfg.RegisterEvery)
	defer t.Stop()
	for {
		if err := u.register(ctx); err != nil {
			u.cfg.Logger.Warn("register failed", "registrar", u.cfg.Registrar, "err", err)
		}
		select {
		case <-ctx.Done():
			return
		case <-t.C:
		case <-u.kick:
		}
	}
}

// Kick re-registers now (e.g. after Drain, so Routr stops choosing this node at once).
func (u *UA) Kick() {
	select {
	case u.kick <- struct{}{}:
	default:
	}
}

// Unregister removes this node's route from Routr (REGISTER with Expires 0), so Routr stops
// choosing a node that exits instead of waiting for its registration to expire (CO-B3).
func (u *UA) Unregister(ctx context.Context) error {
	if u.cfg.Registrar == "" {
		return nil
	}
	return u.send(ctx, 0)
}

func (u *UA) register(ctx context.Context) error {
	return u.send(ctx, int(u.cfg.RegisterEvery.Seconds()*2))
}

func (u *UA) send(ctx context.Context, expires int) error {
	count := u.node.ActiveRooms()
	if u.node.Draining() || u.node.AtCapacity() {
		count = 1 << 20 // full: Routr stops choosing this node
	}
	host, portText, _ := strings.Cut(u.cfg.Registrar, ":")
	port, _ := strconv.Atoi(portText)
	domain := u.cfg.Domain
	if domain == "" {
		domain = host
	}
	req := sip.NewRequest(sip.REGISTER, sip.Uri{Host: domain})
	req.SetDestination(fmt.Sprintf("%s:%d", host, port))
	req.SetTransport(strings.ToUpper(u.cfg.Transport))
	user := u.peerUser()
	req.AppendHeader(&sip.FromHeader{Address: sip.Uri{User: user, Host: domain}, Params: sip.NewParams()})
	req.AppendHeader(&sip.ToHeader{Address: sip.Uri{User: user, Host: domain}})
	contactParams := sip.NewParams()
	contactParams.Add("transport", u.cfg.Transport)
	req.AppendHeader(&sip.ContactHeader{Address: sip.Uri{User: user, Host: u.cfg.AdvertiseHost, Port: u.cfg.AdvertisePort,
		UriParams: contactParams}})
	req.AppendHeader(sip.NewHeader("Expires", strconv.Itoa(expires)))
	req.AppendHeader(sip.NewHeader("X-Session-Count", strconv.Itoa(count)))

	cctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()
	res, err := u.client.Do(cctx, req, sipgo.ClientRequestRegisterBuild)
	if err != nil {
		return err
	}
	if res.StatusCode == 401 || res.StatusCode == 407 {
		res, err = u.client.DoDigestAuth(cctx, req, res, sipgo.DigestAuth{Username: user, Password: u.cfg.Password})
		if err != nil {
			return err
		}
	}
	if res.StatusCode != 200 {
		return fmt.Errorf("REGISTER answered %d", res.StatusCode)
	}
	u.mu.Lock()
	u.lastReg = count
	u.mu.Unlock()
	return nil
}

// ---- outbound legs --------------------------------------------------------------------------

// DODNumberHeader carries the caller-id number of a Peer's call to the PSTN; Routr picks the
// trunk by it (connect's peerToPSTN reads X-DOD-Number; SIP header names are case-insensitive).
const DODNumberHeader = "X-DOD-Number"

// peerUser is the node's Routr Peer username (REGISTER and outbound INVITEs).
func (u *UA) peerUser() string {
	if u.cfg.Username != "" {
		return u.cfg.Username
	}
	return "medianode"
}

// peerDomain is the host in the Peer's From: the configured domain, else the registrar's or
// outbound proxy's host.
func (u *UA) peerDomain() string {
	if u.cfg.Domain != "" {
		return u.cfg.Domain
	}
	for _, addr := range []string{u.cfg.Registrar, u.cfg.OutboundProxy} {
		if host, _, err := net.SplitHostPort(addr); err == nil && host != "" {
			return host
		}
	}
	return u.cfg.AdvertiseHost
}

// Dial sends an INVITE through the outbound proxy (node.Dialer).
func (u *UA) Dial(ctx context.Context, to, from string, headers map[string]string, offer []byte,
	onProgress func(status int)) (node.OutLeg, []byte, error) {
	host, portText, err := net.SplitHostPort(u.cfg.OutboundProxy)
	if err != nil {
		return nil, nil, err
	}
	port, _ := strconv.Atoi(portText)
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
	target := sip.Uri{User: to, Host: host, Port: port}
	if u.cfg.OutboundTransport != "udp" {
		target.UriParams = sip.NewParams()
		target.UriParams.Add("transport", u.cfg.OutboundTransport)
	}
	session, err := u.out.Invite(ctx, target, offer, hdrs...)
	if err != nil {
		return nil, nil, err
	}
	// Routr challenges a Peer's INVITE (401) like its REGISTER: answer with the same credentials.
	err = session.WaitAnswer(ctx, sipgo.AnswerOptions{Username: user, Password: u.cfg.Password,
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
