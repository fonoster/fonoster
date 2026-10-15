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
	"strconv"
	"strings"
	"sync"
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
	Logger            *slog.Logger
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
	// legs by Call-ID, for SIP INFO keypresses.
	legs sync.Map
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
	// rport on Via (WithClientNAT) lets Routr answer to where requests really came from, which
	// matters behind NAT and container port mappings.
	client, err := sipgo.NewClient(ua, sipgo.WithClientHostname(cfg.AdvertiseHost), sipgo.WithClientNAT())
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
	u := &UA{cfg: cfg, node: n, ua: ua, srv: srv, client: client,
		dialogs: sipgo.NewDialogServerCache(client, contact), out: sipgo.NewDialogClientCache(client, contact),
		kick: make(chan struct{}, 1), lastReg: -1}
	srv.OnInvite(u.onInvite)
	srv.OnAck(func(req *sip.Request, tx sip.ServerTransaction) { _ = u.dialogs.ReadAck(req, tx) })
	srv.OnBye(func(req *sip.Request, tx sip.ServerTransaction) {
		if err := u.dialogs.ReadBye(req, tx); err == nil {
			return
		}
		if err := u.out.ReadBye(req, tx); err != nil {
			_ = tx.Respond(sip.NewResponseFromRequest(req, 481, "Call/Transaction Does Not Exist", nil))
		}
	})
	srv.OnInfo(u.onInfo)
	srv.OnOptions(func(req *sip.Request, tx sip.ServerTransaction) {
		_ = tx.Respond(sip.NewResponseFromRequest(req, 200, "OK", nil))
	})
	n.OnRoomCount = func(count int) { u.loadChanged(count) }
	n.OnDrain = func() { u.kickRegister() }
	if cfg.OutboundProxy != "" {
		n.SetDialer(u)
	}
	return u, nil
}

// Serve listens on UDP and TCP until ctx ends.
func (u *UA) Serve(ctx context.Context) error {
	errs := make(chan error, 3)
	if !u.cfg.RequireEncryption {
		for _, network := range []string{"udp", "tcp"} {
			go func(network string) { errs <- u.srv.ListenAndServe(ctx, network, u.cfg.Listen) }(network)
		}
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

// Close unregisters (Expires: 0, so Routr stops routing here at once) and releases the user
// agent.
func (u *UA) Close() {
	if u.cfg.Registrar != "" {
		ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
		_ = u.registerWith(ctx, 0)
		cancel()
	}
	_ = u.ua.Close()
}

func header(req *sip.Request, name string) string {
	if h := req.GetHeader(name); h != nil {
		return h.Value()
	}
	return ""
}

func (u *UA) onInvite(req *sip.Request, tx sip.ServerTransaction) {
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
	_ = dlg.Respond(100, "Trying", nil)

	leg := &inviteLeg{dlg: dlg, final: make(chan int, 1)}
	callID := req.CallID().Value()
	u.legs.Store(callID, leg)
	go func() {
		<-dlg.Context().Done()
		u.legs.Delete(callID)
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
	go func() {
		<-dlg.Context().Done()
		u.node.CallerGone(ref)
		_ = dlg.Close()
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

// onInfo reads SIP INFO keypresses: application/dtmf-relay ("Signal=7") or application/dtmf ("7").
func (u *UA) onInfo(req *sip.Request, tx sip.ServerTransaction) {
	v, ok := u.legs.Load(req.CallID().Value())
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
		u.kickRegister()
	}
}

func (u *UA) kickRegister() {
	select {
	case u.kick <- struct{}{}:
	default:
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

func (u *UA) register(ctx context.Context) error {
	return u.registerWith(ctx, int(u.cfg.RegisterEvery.Seconds()*2))
}

// registerWith sends one REGISTER with the current session count; expires 0 unregisters.
func (u *UA) registerWith(ctx context.Context, expires int) error {
	count := u.node.ActiveRooms()
	if u.node.Draining() {
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
	user := u.cfg.Username
	if user == "" {
		user = "medianode"
	}
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

// Dial sends an INVITE through the outbound proxy (node.Dialer).
func (u *UA) Dial(ctx context.Context, to, from string, headers map[string]string, offer []byte,
	onProgress func(status int)) (node.OutLeg, []byte, error) {
	host, portText, err := net.SplitHostPort(u.cfg.OutboundProxy)
	if err != nil {
		return nil, nil, err
	}
	port, _ := strconv.Atoi(portText)
	if from == "" {
		from = "medianode"
	}
	fromHdr := &sip.FromHeader{Address: sip.Uri{User: from, Host: u.cfg.AdvertiseHost}, Params: sip.NewParams()}
	fromHdr.Params.Add("tag", sip.GenerateTagN(10))
	hdrs := []sip.Header{fromHdr, sip.NewHeader("Content-Type", "application/sdp")}
	for k, v := range headers {
		hdrs = append(hdrs, sip.NewHeader(k, v))
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
	err = session.WaitAnswer(ctx, sipgo.AnswerOptions{OnResponse: func(res *sip.Response) error {
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
	callID := session.InviteRequest.CallID().Value()
	u.legs.Store(callID, leg)
	go func() {
		<-session.Context().Done()
		u.legs.Delete(callID)
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
