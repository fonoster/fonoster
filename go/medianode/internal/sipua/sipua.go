// Package sipua is the node's SIP side: INVITEs from Routr become rooms, and the node registers
// to Routr with its session count (media-node, "Nodes register to Routr with their session count").
package sipua

import (
	"context"
	"fmt"
	"log/slog"
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
	// RegisterEvery is the re-register interval; re-registers also follow load changes.
	RegisterEvery time.Duration
	Logger        *slog.Logger
}

// UA serves SIP for one node.
type UA struct {
	cfg     Config
	node    *node.Node
	ua      *sipgo.UserAgent
	srv     *sipgo.Server
	client  *sipgo.Client
	dialogs *sipgo.DialogServerCache
	kick    chan struct{}
	lastReg int
	mu      sync.Mutex
}

// New wires a SIP user agent to the node.
func New(n *node.Node, cfg Config) (*UA, error) {
	if cfg.Logger == nil {
		cfg.Logger = slog.Default()
	}
	if cfg.RegisterEvery == 0 {
		cfg.RegisterEvery = 15 * time.Second
	}
	if cfg.Transport == "" {
		cfg.Transport = "udp"
	}
	ua, err := sipgo.NewUA(sipgo.WithUserAgent("fonoster-medianode"))
	if err != nil {
		return nil, err
	}
	srv, err := sipgo.NewServer(ua)
	if err != nil {
		return nil, err
	}
	client, err := sipgo.NewClient(ua, sipgo.WithClientHostname(cfg.AdvertiseHost))
	if err != nil {
		return nil, err
	}
	contact := sip.ContactHeader{Address: sip.Uri{User: "medianode", Host: cfg.AdvertiseHost, Port: cfg.AdvertisePort}}
	u := &UA{cfg: cfg, node: n, ua: ua, srv: srv, client: client,
		dialogs: sipgo.NewDialogServerCache(client, contact), kick: make(chan struct{}, 1), lastReg: -1}
	srv.OnInvite(u.onInvite)
	srv.OnAck(func(req *sip.Request, tx sip.ServerTransaction) { _ = u.dialogs.ReadAck(req, tx) })
	srv.OnBye(func(req *sip.Request, tx sip.ServerTransaction) {
		if err := u.dialogs.ReadBye(req, tx); err != nil {
			_ = tx.Respond(sip.NewResponseFromRequest(req, 481, "Call/Transaction Does Not Exist", nil))
		}
	})
	srv.OnOptions(func(req *sip.Request, tx sip.ServerTransaction) {
		_ = tx.Respond(sip.NewResponseFromRequest(req, 200, "OK", nil))
	})
	n.OnRoomCount = func(count int) { u.loadChanged(count) }
	return u, nil
}

// Serve listens on UDP and TCP until ctx ends.
func (u *UA) Serve(ctx context.Context) error {
	errs := make(chan error, 2)
	for _, network := range []string{"udp", "tcp"} {
		go func(network string) { errs <- u.srv.ListenAndServe(ctx, network, u.cfg.Listen) }(network)
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

// Close releases the user agent.
func (u *UA) Close() { _ = u.ua.Close() }

func header(req *sip.Request, name string) string {
	if h := req.GetHeader(name); h != nil {
		return h.Value()
	}
	return ""
}

func (u *UA) onInvite(req *sip.Request, tx sip.ServerTransaction) {
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
	if last < 0 || abs(count-last) >= 5 || count == 0 {
		select {
		case u.kick <- struct{}{}:
		default:
		}
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
	req.AppendHeader(sip.NewHeader("Expires", strconv.Itoa(int(u.cfg.RegisterEvery.Seconds()*2))))
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
