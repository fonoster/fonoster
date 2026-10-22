// Package caller is a SIP caller bot for conformance tests: it places calls (adding Routr's
// X-App-Ref headers itself), sends tones and RFC 4733 keypresses, records what it hears and the
// SIP statuses it receives, and hangs up (add-conformance-framework 2.5, add-roomr 1.1).
package caller

import (
	"context"
	"crypto/tls"
	"fmt"
	"math"
	"net"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/emiago/sipgo"
	"github.com/emiago/sipgo/sip"
	"github.com/fonoster/fonoster/go/roomr/internal/audio"
	"github.com/fonoster/fonoster/go/roomr/internal/dtmf"
	"github.com/fonoster/fonoster/go/roomr/internal/rtpio"
	"github.com/fonoster/fonoster/go/roomr/internal/sdp"
)

const dtmfPayloadType = 101

// maxHeardFrames caps the heard-audio buffer at two minutes.
const maxHeardFrames = 2 * 60 * 1000 / audio.FrameMs

// Bot places calls from one local address.
type Bot struct {
	host    string
	ua      *sipgo.UserAgent
	srv     *sipgo.Server
	client  *sipgo.Client
	dialogs *sipgo.DialogClientCache
	inbound *sipgo.DialogServerCache
	// inboundTLS answers INVITEs that came over TLS, with a TLS Contact.
	inboundTLS *sipgo.DialogServerCache
	port       int
	tlsPort    int
	sipHost    string // host in Via and Contact
	mu         sync.Mutex
	calls      map[string]*Call
	seq        int
	// How the bot answers INVITEs it receives (as the callee of a dial or transfer).
	answerMode  string // answer (default), busy, no_answer, decline
	answerAfter time.Duration
	// answerCodecs, when set, are the only codecs the bot accepts as a callee (a G.711-only trunk).
	answerCodecs []string
	refers       []string
	// authUser and authPass, when set, make the bot challenge INVITEs (RequireAuth).
	authUser, authPass string
	// challenged counts the INVITEs the bot answered with 401.
	challenged int
	// challengeStatus is 401 (WWW-Authenticate, default) or 407 (Proxy-Authenticate).
	challengeStatus int
	// invites records every INVITE the bot received as the callee, answered or not (trunk.go).
	invites []InviteSeen
	// registrar: every REGISTER the bot received, and the digest it requires (trunk.go).
	registers        []RegisterSeen
	regUser, regPass string
	regChallenged    int
}

// AnswerCodecs limits the codecs the bot accepts as a callee (e.g. PCMU only, like a G.711
// trunk); none restores every codec this build supports. It still takes the offer's order.
func (b *Bot) AnswerCodecs(names ...string) {
	b.mu.Lock()
	defer b.mu.Unlock()
	b.answerCodecs = names
}

// Callee sets how the bot answers INVITEs: "answer", "busy", "no_answer" (rings forever),
// "unavailable" (480) or "decline" (603).
func (b *Bot) Callee(mode string, after time.Duration) {
	b.mu.Lock()
	defer b.mu.Unlock()
	b.answerMode, b.answerAfter = mode, after
}

// Challenged is how many INVITEs the bot answered with a 401 challenge.
func (b *Bot) Challenged() int {
	b.mu.Lock()
	defer b.mu.Unlock()
	return b.challenged
}

// Refers lists the Refer-To targets the bot accepted.
func (b *Bot) Refers() []string {
	b.mu.Lock()
	defer b.mu.Unlock()
	return append([]string(nil), b.refers...)
}

// Calls lists every call, placed or received.
func (b *Bot) Calls() []Status {
	b.mu.Lock()
	calls := make([]*Call, 0, len(b.calls))
	for _, c := range b.calls {
		calls = append(calls, c)
	}
	b.mu.Unlock()
	out := make([]Status, 0, len(calls))
	for _, c := range calls {
		out = append(out, c.Status())
	}
	return out
}

// Call is one call the bot placed.
type Call struct {
	ID       string
	bot      *Bot
	session  *sipgo.DialogClientSession
	inbound  *sipgo.DialogServerSession
	endpoint *rtpio.Endpoint

	codec  string
	secure bool
	dtmfPT int
	opts   DialOptions

	mu        sync.Mutex
	statuses  []int
	state     string // calling, answered, ended
	heardMs   int
	audibleMs int
	audibleAt []time.Time
	digits    string
	pending   []audio.Frame
	// muted: the call sends no RTP at all (a silent leg, for media timeouts).
	muted bool
	// spokeUntil is when the last queued frame went out (zero while speaking or before any).
	spokeUntil time.Time
	// heardPCM keeps what the caller heard (up to maxHeardFrames), for transcribing replies.
	heardPCM []audio.Frame
	cancel   context.CancelFunc
	stop     chan struct{}
	// from and headers are the received INVITE's From URI and X- headers (calls the bot answered).
	from    string
	headers map[string]string
	// requestURI is the received INVITE's Request-URI (calls the bot answered).
	requestURI string
}

// Status is what the bot observed on a call.
type Status struct {
	ID        string `json:"id"`
	SIP       []int  `json:"sip"`
	State     string `json:"state"`
	HeardMs   int    `json:"heardMs"`
	AudibleMs int    `json:"audibleMs"`
	// With a since time: audible agent audio after it, and the ms from it to the last audible frame.
	AudibleMsSince   int `json:"audibleMsSince"`
	LastAudibleAfter int `json:"lastAudibleAfterMs"`
	// With a since time: ms from it to the first audible frame (-1: none yet).
	FirstAudibleAfter int `json:"firstAudibleAfterMs"`
	// When the caller's queued speech finished (unix ms; 0 while speaking or before any).
	SpokeUntil int64 `json:"spokeUntilMs"`
	// Codec is the negotiated codec ("PCMU/8000"); Secure is true for SRTP.
	Codec  string `json:"codec,omitempty"`
	Secure bool   `json:"secure,omitempty"`
	// From and Headers (X- headers) of the INVITE the bot answered, for calls it received.
	From    string            `json:"from,omitempty"`
	Headers map[string]string `json:"headers,omitempty"`
	// RequestURI of the INVITE the bot answered (it may differ from where the INVITE was sent,
	// when it came through the bot as a proxy).
	RequestURI string `json:"requestUri,omitempty"`
	// Digits are the RFC 4733 keypresses the bot received.
	Digits string `json:"digits,omitempty"`
}

// DialOptions shape one call's offer.
type DialOptions struct {
	// Codecs to offer, in order ("PCMU/8000", "PCMA/8000", "G722/8000", "opus/48000", or any
	// other rtpmap name such as "GSM/8000" to test refusals). Default: PCMU only.
	Codecs []string
	// NoTelephoneEvent leaves RFC 4733 out of the offer (for SIP INFO and in-band tests).
	NoTelephoneEvent bool
	// Transport is "udp" (default), "tcp" or "tls".
	Transport string
	// SRTP offers RTP/SAVP with an SDES key.
	SRTP bool
	// RequestHost, when set, is the Request-URI host (a carrier's trunk name as Routr expects
	// it) while the INVITE still goes to the target address.
	RequestHost string
}

// New starts a bot listening for in-dialog requests (BYE) on host:0.
func New(host string) (*Bot, error) { return NewWithOptions(Options{Host: host}) }

// Options configure a bot.
type Options struct {
	// Host is where the bot binds SIP and RTP, and the address in its SDP.
	Host string
	// SIPAdvertise is the host in the bot's Via and Contact (default Host), for a proxy that can
	// only reach the bot by another name (Routr in Docker reaching the host as
	// host.docker.internal). Setting it also asks for rport (RFC 3581).
	SIPAdvertise string
	// TLS, when set, adds a SIP-over-TLS listener (needed to receive in-dialog requests on TLS
	// calls); ClientTLS verifies the node when dialing over TLS.
	TLS       *tls.Config
	ClientTLS *tls.Config
}

// NewWithOptions starts a bot listening for in-dialog requests (BYE) on Host:0.
func NewWithOptions(o Options) (*Bot, error) {
	host, sipHost := o.Host, o.SIPAdvertise
	if sipHost == "" {
		sipHost = host
	}
	uaOpts := []sipgo.UserAgentOption{sipgo.WithUserAgent("fonoster-caller-bot")}
	if o.ClientTLS != nil {
		uaOpts = append(uaOpts, sipgo.WithUserAgenTLSConfig(o.ClientTLS))
	}
	ua, err := sipgo.NewUA(uaOpts...)
	if err != nil {
		return nil, err
	}
	srv, err := sipgo.NewServer(ua)
	if err != nil {
		return nil, err
	}
	l, err := net.ListenPacket("udp4", net.JoinHostPort(host, "0"))
	if err != nil {
		return nil, err
	}
	port := l.LocalAddr().(*net.UDPAddr).Port
	clientOpts := []sipgo.ClientOption{sipgo.WithClientHostname(sipHost), sipgo.WithClientConnectionAddr(net.JoinHostPort(host, strconv.Itoa(port)))}
	if o.SIPAdvertise != "" {
		clientOpts = append(clientOpts, sipgo.WithClientNAT())
	}
	client, err := sipgo.NewClient(ua, clientOpts...)
	if err != nil {
		return nil, err
	}
	b := &Bot{host: host, sipHost: sipHost, ua: ua, srv: srv, client: client, port: port, calls: map[string]*Call{}}
	b.dialogs = sipgo.NewDialogClientCache(client, sip.ContactHeader{Address: sip.Uri{User: "caller", Host: sipHost, Port: port}})
	contact := sip.ContactHeader{Address: sip.Uri{User: "callee", Host: sipHost, Port: port}}
	b.inbound = sipgo.NewDialogServerCache(client, contact)
	srv.OnBye(func(req *sip.Request, tx sip.ServerTransaction) {
		if err := b.dialogs.ReadBye(req, tx); err == nil {
			return
		}
		if b.inboundTLS != nil && b.inboundTLS.ReadBye(req, tx) == nil {
			return
		}
		if err := b.inbound.ReadBye(req, tx); err != nil {
			_ = tx.Respond(sip.NewResponseFromRequest(req, 481, "No dialog", nil))
		}
	})
	srv.OnAck(func(req *sip.Request, tx sip.ServerTransaction) {
		if b.inboundTLS != nil && b.inboundTLS.ReadAck(req, tx) == nil {
			return
		}
		_ = b.inbound.ReadAck(req, tx)
	})
	srv.OnInvite(b.onInvite)
	srv.OnRegister(b.onRegister)
	srv.OnRefer(func(req *sip.Request, tx sip.ServerTransaction) {
		target := ""
		if h := req.GetHeader("Refer-To"); h != nil {
			target = h.Value()
		}
		b.mu.Lock()
		b.refers = append(b.refers, target)
		b.mu.Unlock()
		_ = tx.Respond(sip.NewResponseFromRequest(req, 202, "Accepted", nil))
	})
	srv.OnInfo(func(req *sip.Request, tx sip.ServerTransaction) {
		_ = tx.Respond(sip.NewResponseFromRequest(req, 200, "OK", nil))
	})
	go func() { _ = srv.ServeUDP(l) }()
	// Requests go out from the listening socket (WithClientConnectionAddr): dialing before the
	// transport layer has registered it makes the client bind the same port again and fail
	// with "address already in use".
	for deadline := time.Now().Add(2 * time.Second); time.Now().Before(deadline); time.Sleep(time.Millisecond) {
		if c, err := ua.TransportLayer().GetConnection("udp", l.LocalAddr().String()); err == nil && c != nil {
			break
		}
	}
	if o.TLS != nil {
		tl, err := tls.Listen("tcp4", net.JoinHostPort(host, "0"), o.TLS)
		if err != nil {
			return nil, err
		}
		b.tlsPort = tl.Addr().(*net.TCPAddr).Port
		params := sip.NewParams()
		params.Add("transport", "tls")
		b.inboundTLS = sipgo.NewDialogServerCache(client, sip.ContactHeader{Address: sip.Uri{User: "callee", Host: sipHost,
			Port: b.tlsPort, UriParams: params}})
		go func() { _ = srv.ServeTLS(tl) }()
	}
	return b, nil
}

// offer builds the bot's SDP offer for the options; key is the SRTP key it will send with.
func (b *Bot) offer(port int, o DialOptions) (body []byte, key string) {
	d := sdp.Description{Host: b.host, Port: port, DTMF: dtmfPayloadType}
	if o.NoTelephoneEvent {
		d.DTMF = -1
	}
	codecs := o.Codecs
	if len(codecs) == 0 {
		codecs = []string{audio.NamePCMU}
	}
	dynamic := 111
	for _, name := range codecs {
		pt := audio.StaticPayloadType(name)
		if pt < 0 {
			switch strings.ToUpper(name) {
			case "GSM/8000", "GSM":
				pt = 3
			default:
				pt = dynamic
				dynamic++
			}
		}
		d.Codecs = append(d.Codecs, sdp.Codec{PT: pt, Name: name})
	}
	if o.SRTP {
		key = rtpio.NewSRTPKey()
		d.Crypto = &sdp.Crypto{Tag: 1, Suite: rtpio.SRTPSuite, Key: key}
	}
	return sdp.WriteDescription(d), key
}

// Address is the bot's SIP host:port (where it receives INVITEs as a callee).
func (b *Bot) Address() string { return net.JoinHostPort(b.host, strconv.Itoa(b.port)) }

// TLSAddress is the bot's SIP-over-TLS host:port ("" without a TLS listener).
func (b *Bot) TLSAddress() string {
	if b.tlsPort == 0 {
		return ""
	}
	return net.JoinHostPort(b.host, strconv.Itoa(b.tlsPort))
}

// Close stops the bot.
func (b *Bot) Close() { _ = b.ua.Close() }

// Get returns a call by id.
func (b *Bot) Get(id string) *Call {
	b.mu.Lock()
	defer b.mu.Unlock()
	return b.calls[id]
}

// Dial calls target (host:port) for number `to`, with extra headers (e.g. X-App-Ref), offering
// PCMU with RFC 4733 over UDP.
func (b *Bot) Dial(target, to, from string, headers map[string]string) (*Call, error) {
	return b.DialWith(target, to, from, headers, DialOptions{})
}

// DialVia sends the INVITE to target (host:port) with requestHost as the Request-URI host, the
// way a carrier calls Routr: Routr finds the Trunk by that host (its inboundUri), not by where the
// INVITE was sent. An empty requestHost means target's host and port.
func (b *Bot) DialVia(target, requestHost, to, from string, headers map[string]string) (*Call, error) {
	return b.DialWith(target, to, from, headers, DialOptions{RequestHost: requestHost})
}

// DialWith calls target with a chosen offer, transport and Request-URI host.
func (b *Bot) DialWith(target, to, from string, headers map[string]string, o DialOptions) (*Call, error) {
	ep, err := rtpio.Listen(b.host)
	if err != nil {
		return nil, err
	}
	host, portText, err := net.SplitHostPort(target)
	if err != nil {
		return nil, err
	}
	port, _ := strconv.Atoi(portText)
	if from == "" {
		from = "+15550001111"
	}
	offer, key := b.offer(ep.Port(), o)
	hdrs := []sip.Header{
		&sip.FromHeader{Address: sip.Uri{User: from, Host: b.host}, Params: sip.NewParams()},
		sip.NewHeader("Content-Type", "application/sdp"),
	}
	hdrs[0].(*sip.FromHeader).Params.Add("tag", sip.GenerateTagN(10))
	recipient := sip.Uri{User: to, Host: host, Port: port}
	if o.Transport != "" && o.Transport != "udp" {
		recipient.UriParams = sip.NewParams()
		recipient.UriParams.Add("transport", o.Transport)
		contactParams := sip.NewParams()
		contactParams.Add("transport", o.Transport)
		// The client binds its SIP port for TCP and TLS too, so the node's in-dialog requests reuse
		// the connection the INVITE opened.
		contactPort := b.port
		hdrs = append(hdrs, &sip.ContactHeader{Address: sip.Uri{User: "caller", Host: b.sipHost, Port: contactPort, UriParams: contactParams}})
	}
	for k, v := range headers {
		hdrs = append(hdrs, sip.NewHeader(k, v))
	}
	ctx, cancel := context.WithCancel(context.Background())
	ruri := recipient
	if o.RequestHost != "" {
		ruri = sip.Uri{User: to, Host: o.RequestHost, UriParams: recipient.UriParams}
	}
	req := sip.NewRequest(sip.INVITE, ruri)
	req.SetBody(offer)
	for _, h := range hdrs {
		req.AppendHeader(h)
	}
	req.SetDestination(target)
	session, err := b.dialogs.WriteInvite(ctx, req)
	if err != nil {
		cancel()
		ep.Close()
		return nil, err
	}
	b.mu.Lock()
	b.seq++
	c := &Call{ID: fmt.Sprintf("call-%d", b.seq), bot: b, session: session, endpoint: ep, state: "calling",
		cancel: cancel, stop: make(chan struct{}), opts: o}
	b.calls[c.ID] = c
	b.mu.Unlock()
	go c.await(ctx, key)
	return c, nil
}

func (c *Call) await(ctx context.Context, key string) {
	err := c.session.WaitAnswer(ctx, sipgo.AnswerOptions{OnResponse: func(res *sip.Response) error {
		c.mu.Lock()
		c.statuses = append(c.statuses, int(res.StatusCode))
		c.mu.Unlock()
		return nil
	}})
	if err != nil {
		var final *sipgo.ErrDialogResponse
		if e, ok := err.(*sipgo.ErrDialogResponse); ok {
			final = e
		}
		status := 0
		if final != nil {
			status = int(final.Res.StatusCode)
		} else if res := c.session.InviteResponse; res != nil && res.StatusCode >= 300 {
			// Our own CANCEL: sipgo waits for the 487 and keeps it as the INVITE's response.
			status = int(res.StatusCode)
		}
		c.mu.Lock()
		if status != 0 && (len(c.statuses) == 0 || c.statuses[len(c.statuses)-1] != status) {
			c.statuses = append(c.statuses, status)
		}
		c.state = "ended"
		c.mu.Unlock()
		c.endpoint.Close()
		return
	}
	c.mu.Lock()
	if n := len(c.statuses); n == 0 || c.statuses[n-1] != 200 {
		c.statuses = append(c.statuses, 200)
	}
	c.mu.Unlock()
	answer, err := sdp.Parse(c.session.InviteResponse.Body())
	if err != nil {
		_ = c.Hangup()
		return
	}
	_ = c.session.Ack(context.Background())
	pt, codecName, ok := answer.Choose(append(audio.PhoneCodecs(), c.opts.Codecs...)...)
	codec, known := audio.CodecFor(codecName)
	if !ok || !known {
		_ = c.Hangup()
		return
	}
	_ = c.endpoint.Configure(codec, pt, answer.DTMF, answer.Host, answer.Port)
	if key != "" {
		for _, cr := range answer.Crypto {
			if cr.Suite == rtpio.SRTPSuite {
				_ = c.endpoint.SetSRTP(key, cr.Key)
			}
		}
	}
	c.mu.Lock()
	c.codec, c.secure, c.dtmfPT = codecName, c.endpoint.Secure(), answer.DTMF
	c.mu.Unlock()
	c.mu.Lock()
	c.state = "answered"
	c.mu.Unlock()
	go c.endpoint.Serve(rtpio.Handlers{Audio: c.heard, DTMF: func(d string) {
		c.mu.Lock()
		c.digits += d
		c.mu.Unlock()
	}})
	go c.talk()
	go func() {
		<-c.session.Context().Done()
		c.mu.Lock()
		c.state = "ended"
		c.mu.Unlock()
		close(c.stop)
		c.endpoint.Close()
	}()
}

func (c *Call) heard(f audio.Frame) {
	var sum float64
	for _, s := range f {
		sum += float64(s) * float64(s)
	}
	c.mu.Lock()
	c.heardMs += audio.FrameMs
	if len(c.heardPCM) < maxHeardFrames {
		c.heardPCM = append(c.heardPCM, append(audio.Frame(nil), f...))
	}
	if math.Sqrt(sum/float64(len(f))) > 300 {
		c.audibleMs += audio.FrameMs
		c.audibleAt = append(c.audibleAt, time.Now())
	}
	c.mu.Unlock()
}

// talk sends a frame every 20 ms: queued speech, else silence (keeps media timeouts away).
func (c *Call) talk() {
	t := time.NewTicker(audio.FrameMs * time.Millisecond)
	defer t.Stop()
	for {
		select {
		case <-c.stop:
			return
		case <-t.C:
		}
		c.mu.Lock()
		if c.muted {
			c.mu.Unlock()
			continue
		}
		var f audio.Frame
		if len(c.pending) > 0 {
			f, c.pending = c.pending[0], c.pending[1:]
			if len(c.pending) == 0 {
				c.spokeUntil = time.Now().Add(audio.FrameMs * time.Millisecond)
			}
		}
		c.mu.Unlock()
		if f == nil {
			f = audio.Silence()
		}
		c.endpoint.Send(f)
	}
}

// Speak queues a tone (440 Hz, or "tone:<hz>") or silence of ms milliseconds.
func (c *Call) Speak(kind string, ms int) {
	freq := 440.0
	if f, err := strconv.ParseFloat(strings.TrimPrefix(kind, "tone:"), 64); err == nil && strings.HasPrefix(kind, "tone:") {
		freq = f
	}
	frames := ms / audio.FrameMs
	out := make([]audio.Frame, 0, frames)
	for i := 0; i < frames; i++ {
		f := audio.Silence()
		if kind != "silence" {
			for j := range f {
				n := float64(i*audio.FrameSamples + j)
				f[j] = int16(8000 * math.Sin(2*math.Pi*freq*n/audio.Rate))
			}
		}
		out = append(out, f)
	}
	c.queue(out)
}

// SpeakPCM queues recorded speech: 16-bit little-endian PCM at the internal 16 kHz rate.
func (c *Call) SpeakPCM(pcm []byte) {
	out := make([]audio.Frame, 0, len(pcm)/(audio.FrameSamples*2)+1)
	for off := 0; off < len(pcm); off += audio.FrameSamples * 2 {
		f := audio.Silence()
		for j := range f {
			if i := off + j*2; i+1 < len(pcm) {
				f[j] = int16(uint16(pcm[i]) | uint16(pcm[i+1])<<8)
			}
		}
		out = append(out, f)
	}
	c.queue(out)
}

func (c *Call) queue(frames []audio.Frame) {
	c.mu.Lock()
	c.pending = frames
	c.spokeUntil = time.Time{}
	c.mu.Unlock()
}

// Heard returns what the caller heard so far as 16-bit little-endian PCM at 16 kHz.
func (c *Call) Heard() []byte {
	c.mu.Lock()
	defer c.mu.Unlock()
	out := make([]byte, 0, len(c.heardPCM)*audio.FrameSamples*2)
	for _, f := range c.heardPCM {
		for _, v := range f {
			out = append(out, byte(v), byte(uint16(v)>>8))
		}
	}
	return out
}

// DTMF sends keypresses as RFC 4733 events.
func (c *Call) DTMF(digits string) { c.DTMFVia(digits, "rfc4733") }

// DTMFVia sends keypresses as "rfc4733" events, "info" (SIP INFO, application/dtmf-relay) or
// "inband" tones (100 ms tone, 100 ms gap) in the audio.
func (c *Call) DTMFVia(digits, mode string) {
	switch mode {
	case "info":
		for _, d := range digits {
			req := sip.NewRequest(sip.INFO, c.remoteContact())
			req.AppendHeader(sip.NewHeader("Content-Type", "application/dtmf-relay"))
			req.SetBody([]byte(fmt.Sprintf("Signal=%c\r\nDuration=160\r\n", d)))
			ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
			if c.inbound != nil {
				_, _ = c.inbound.Do(ctx, req)
			} else {
				_, _ = c.session.Do(ctx, req)
			}
			cancel()
			time.Sleep(100 * time.Millisecond)
		}
	case "inband":
		frames := []audio.Frame{}
		for _, d := range digits {
			frames = append(frames, dtmf.Tone(d, 100)...)
			frames = append(frames, dtmf.Tone(0, 100)...)
		}
		c.mu.Lock()
		c.pending = append(c.pending, frames...)
		c.mu.Unlock()
	default:
		c.mu.Lock()
		pt := c.dtmfPT
		c.mu.Unlock()
		if pt <= 0 {
			pt = dtmfPayloadType
		}
		for _, d := range digits {
			c.endpoint.SendDTMF(d, pt)
		}
	}
}

func (c *Call) remoteContact() sip.Uri {
	if c.inbound != nil {
		return c.inbound.InviteRequest.Contact().Address
	}
	if h := c.session.InviteResponse.Contact(); h != nil {
		return h.Address
	}
	return c.session.InviteRequest.Recipient
}

// SetImpair applies network impairment to what this call sends (load harness and tests).
func (c *Call) SetImpair(fn func() (copies int, delay time.Duration)) { c.endpoint.SetImpair(fn) }

// Hangup sends BYE (answered) or CANCEL (still calling).
func (c *Call) Hangup() error {
	c.mu.Lock()
	state := c.state
	c.mu.Unlock()
	switch state {
	case "answered":
		ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
		defer cancel()
		if c.inbound != nil {
			return c.inbound.Bye(ctx)
		}
		return c.session.Bye(ctx)
	case "calling":
		c.cancel()
	}
	return nil
}

// Status reports what the call observed so far.
func (c *Call) Status() Status { return c.StatusSince(time.Time{}) }

// StatusSince also measures agent audio heard after since.
func (c *Call) StatusSince(since time.Time) Status {
	c.mu.Lock()
	defer c.mu.Unlock()
	s := Status{ID: c.ID, SIP: append([]int(nil), c.statuses...), State: c.state, HeardMs: c.heardMs, AudibleMs: c.audibleMs,
		Codec: c.codec, Secure: c.secure, FirstAudibleAfter: -1, From: c.from, Headers: c.headers,
		RequestURI: c.requestURI, Digits: c.digits}
	if !c.spokeUntil.IsZero() {
		s.SpokeUntil = c.spokeUntil.UnixMilli()
	}
	for _, at := range c.audibleAt {
		if !at.Before(since) {
			if s.FirstAudibleAfter < 0 {
				s.FirstAudibleAfter = int(at.Sub(since).Milliseconds())
			}
			s.AudibleMsSince += audio.FrameMs
			s.LastAudibleAfter = int(at.Sub(since).Milliseconds())
		}
	}
	return s
}

// onInvite answers an INVITE as the configured callee.
func (b *Bot) onInvite(req *sip.Request, tx sip.ServerTransaction) {
	b.mu.Lock()
	mode, after := b.answerMode, b.answerAfter
	user, pass := b.authUser, b.authPass
	b.recordInviteLocked(req)
	if pass != "" && !authorized(req, user, pass) {
		b.challenged++
		status := b.challengeStatus
		b.mu.Unlock()
		challenge(req, tx, status)
		return
	}
	b.seq++
	id := fmt.Sprintf("in-%d", b.seq)
	b.mu.Unlock()
	offer, err := sdp.Parse(req.Body())
	if err != nil {
		_ = tx.Respond(sip.NewResponseFromRequest(req, 488, "Not Acceptable Here", nil))
		return
	}
	cache := b.inbound
	if b.inboundTLS != nil && strings.EqualFold(req.Transport(), "TLS") {
		cache = b.inboundTLS
	}
	dlg, err := cache.ReadInvite(req, tx)
	if err != nil {
		return
	}
	_ = dlg.Respond(180, "Ringing", nil)
	select {
	case <-time.After(after):
	case <-dlg.Context().Done():
		return
	}
	switch mode {
	case "busy":
		_ = dlg.Respond(486, "Busy Here", nil)
		return
	case "decline":
		_ = dlg.Respond(603, "Decline", nil)
		return
	case "unavailable":
		_ = dlg.Respond(480, "Temporarily Unavailable", nil)
		return
	case "no_answer":
		<-dlg.Context().Done() // ring until the caller gives up
		return
	}
	ep, err := rtpio.Listen(b.host)
	if err != nil {
		_ = dlg.Respond(500, "Server Error", nil)
		return
	}
	b.mu.Lock()
	accept := b.answerCodecs
	b.mu.Unlock()
	if len(accept) == 0 {
		accept = audio.PhoneCodecs()
	}
	pt, codecName, ok := offer.Choose(accept...)
	if !ok {
		ep.Close()
		_ = dlg.Respond(488, "Not Acceptable Here", nil)
		return
	}
	codec, _ := audio.CodecFor(codecName)
	_ = ep.Configure(codec, pt, offer.DTMF, offer.Host, offer.Port)
	answer := sdp.Description{Host: b.host, Port: ep.Port(), Codecs: []sdp.Codec{{PT: pt, Name: codecName}}, DTMF: offer.DTMF}
	if offer.Secure {
		for _, cr := range offer.Crypto {
			if cr.Suite == rtpio.SRTPSuite {
				key := rtpio.NewSRTPKey()
				_ = ep.SetSRTP(key, cr.Key)
				answer.Crypto = &sdp.Crypto{Tag: cr.Tag, Suite: cr.Suite, Key: key}
			}
		}
	}
	c := &Call{ID: id, bot: b, endpoint: ep, inbound: dlg, state: "answered", stop: make(chan struct{}), statuses: []int{200},
		codec: codecName, secure: ep.Secure(), dtmfPT: offer.DTMF, headers: map[string]string{}}
	if f := req.From(); f != nil {
		c.from = f.Address.String()
	}
	c.requestURI = req.Recipient.String()
	for _, h := range req.Headers() {
		if strings.HasPrefix(strings.ToLower(h.Name()), "x-") {
			c.headers[h.Name()] = h.Value()
		}
	}
	b.mu.Lock()
	b.calls[id] = c
	b.mu.Unlock()
	if err := dlg.RespondSDP(sdp.WriteDescription(answer)); err != nil {
		ep.Close()
		return
	}
	go ep.Serve(rtpio.Handlers{Audio: c.heard, DTMF: func(d string) {
		c.mu.Lock()
		c.digits += d
		c.mu.Unlock()
	}})
	go c.talk()
	go func() {
		<-dlg.Context().Done()
		c.mu.Lock()
		c.state = "ended"
		c.mu.Unlock()
		close(c.stop)
		ep.Close()
		_ = dlg.Close()
	}()
}

// SIPCallID is the Call-ID of the call's INVITE (tests craft out-of-dialog requests with it).
func (c *Call) SIPCallID() string {
	if c.inbound != nil {
		return c.inbound.InviteRequest.CallID().Value()
	}
	return c.session.InviteRequest.CallID().Value()
}
