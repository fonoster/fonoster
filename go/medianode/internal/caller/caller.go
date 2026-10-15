// Package caller is a SIP caller bot for conformance tests: it places calls (adding Routr's
// X-App-Ref headers itself), sends tones and RFC 4733 keypresses, records what it hears and the
// SIP statuses it receives, and hangs up (add-conformance-framework 2.5, add-media-node 1.1).
package caller

import (
	"context"
	"fmt"
	"math"
	"net"
	"strconv"
	"sync"
	"time"

	"github.com/emiago/sipgo"
	"github.com/emiago/sipgo/sip"
	"github.com/fonoster/fonoster/go/medianode/internal/audio"
	"github.com/fonoster/fonoster/go/medianode/internal/rtpio"
	"github.com/fonoster/fonoster/go/medianode/internal/sdp"
)

const dtmfPayloadType = 101

// Bot places calls from one local address.
type Bot struct {
	host    string
	ua      *sipgo.UserAgent
	srv     *sipgo.Server
	client  *sipgo.Client
	dialogs *sipgo.DialogClientCache
	port    int
	mu      sync.Mutex
	calls   map[string]*Call
	seq     int
}

// Call is one call the bot placed.
type Call struct {
	ID       string
	bot      *Bot
	session  *sipgo.DialogClientSession
	endpoint *rtpio.Endpoint

	mu        sync.Mutex
	statuses  []int
	state     string // calling, answered, ended
	heardMs   int
	audibleMs int
	audibleAt []time.Time
	digits    string
	pending   []audio.Frame
	cancel    context.CancelFunc
	stop      chan struct{}
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
}

// New starts a bot listening for in-dialog requests (BYE) on host:0.
func New(host string) (*Bot, error) {
	ua, err := sipgo.NewUA(sipgo.WithUserAgent("fonoster-caller-bot"))
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
	client, err := sipgo.NewClient(ua, sipgo.WithClientHostname(host), sipgo.WithClientConnectionAddr(net.JoinHostPort(host, strconv.Itoa(port))))
	if err != nil {
		return nil, err
	}
	b := &Bot{host: host, ua: ua, srv: srv, client: client, port: port, calls: map[string]*Call{}}
	b.dialogs = sipgo.NewDialogClientCache(client, sip.ContactHeader{Address: sip.Uri{User: "caller", Host: host, Port: port}})
	srv.OnBye(func(req *sip.Request, tx sip.ServerTransaction) {
		if err := b.dialogs.ReadBye(req, tx); err != nil {
			_ = tx.Respond(sip.NewResponseFromRequest(req, 481, "No dialog", nil))
		}
	})
	go func() { _ = srv.ServeUDP(l) }()
	return b, nil
}

// Close stops the bot.
func (b *Bot) Close() { _ = b.ua.Close() }

// Get returns a call by id.
func (b *Bot) Get(id string) *Call {
	b.mu.Lock()
	defer b.mu.Unlock()
	return b.calls[id]
}

// Dial calls target (host:port) for number `to`, with extra headers (e.g. X-App-Ref).
func (b *Bot) Dial(target, to, from string, headers map[string]string) (*Call, error) {
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
	offer := sdp.Write(b.host, ep.Port(), 0, "PCMU/8000", dtmfPayloadType)
	hdrs := []sip.Header{
		&sip.FromHeader{Address: sip.Uri{User: from, Host: b.host}, Params: sip.NewParams()},
		sip.NewHeader("Content-Type", "application/sdp"),
	}
	hdrs[0].(*sip.FromHeader).Params.Add("tag", sip.GenerateTagN(10))
	for k, v := range headers {
		hdrs = append(hdrs, sip.NewHeader(k, v))
	}
	ctx, cancel := context.WithCancel(context.Background())
	session, err := b.dialogs.Invite(ctx, sip.Uri{User: to, Host: host, Port: port}, offer, hdrs...)
	if err != nil {
		cancel()
		ep.Close()
		return nil, err
	}
	b.mu.Lock()
	b.seq++
	c := &Call{ID: fmt.Sprintf("call-%d", b.seq), bot: b, session: session, endpoint: ep, state: "calling",
		cancel: cancel, stop: make(chan struct{})}
	b.calls[c.ID] = c
	b.mu.Unlock()
	go c.await(ctx)
	return c, nil
}

func (c *Call) await(ctx context.Context) {
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
		c.mu.Lock()
		if final != nil && (len(c.statuses) == 0 || c.statuses[len(c.statuses)-1] != int(final.Res.StatusCode)) {
			c.statuses = append(c.statuses, int(final.Res.StatusCode))
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
	pt, codecName, _ := answer.Choose("PCMU/8000")
	codec, _ := audio.CodecFor(codecName)
	_ = c.endpoint.Configure(codec, pt, answer.DTMF, answer.Host, answer.Port)
	_ = c.session.Ack(context.Background())
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
		var f audio.Frame
		if len(c.pending) > 0 {
			f, c.pending = c.pending[0], c.pending[1:]
		}
		c.mu.Unlock()
		if f == nil {
			f = audio.Silence()
		}
		c.endpoint.Send(f)
	}
}

// Speak queues a 440 Hz tone (or silence) of ms milliseconds.
func (c *Call) Speak(kind string, ms int) {
	frames := ms / audio.FrameMs
	out := make([]audio.Frame, 0, frames)
	for i := 0; i < frames; i++ {
		f := audio.Silence()
		if kind != "silence" {
			for j := range f {
				n := float64(i*audio.FrameSamples + j)
				f[j] = int16(8000 * math.Sin(2*math.Pi*440*n/audio.Rate))
			}
		}
		out = append(out, f)
	}
	c.mu.Lock()
	c.pending = out
	c.mu.Unlock()
}

// DTMF sends keypresses as RFC 4733 events.
func (c *Call) DTMF(digits string) {
	for _, d := range digits {
		c.endpoint.SendDTMF(d, dtmfPayloadType)
	}
}

// Hangup sends BYE (answered) or CANCEL (still calling).
func (c *Call) Hangup() error {
	c.mu.Lock()
	state := c.state
	c.mu.Unlock()
	switch state {
	case "answered":
		ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
		defer cancel()
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
	s := Status{ID: c.ID, SIP: append([]int(nil), c.statuses...), State: c.state, HeardMs: c.heardMs, AudibleMs: c.audibleMs}
	for _, at := range c.audibleAt {
		if !at.Before(since) {
			s.AudibleMsSince += audio.FrameMs
			s.LastAudibleAfter = int(at.Sub(since).Milliseconds())
		}
	}
	return s
}
