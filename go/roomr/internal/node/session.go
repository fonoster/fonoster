package node

import (
	"context"
	"errors"
	"fmt"
	"sync"
	"time"

	sessionv1 "github.com/fonoster/fonoster/go/roomr/api/session/v1"
	"google.golang.org/grpc"
	"google.golang.org/grpc/connectivity"
	"google.golang.org/grpc/credentials"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/grpc/keepalive"
)

// The per-call control stream (media-control, "Each call opens one control stream to the
// session endpoint"): the node opens a new gRPC connection for every call, sends Start first,
// then Dtmf and Event messages; the app sends Answer or Ready and its commands. A stream that
// breaks, or whose keepalive pings go unanswered twice, hangs the call up with app_gone; the
// node never reconnects a call.

// sessionConnectTimeout bounds how long the node tries to reach the session endpoint.
const sessionConnectTimeout = 5 * time.Second

// sessionCloseWait is how long the node lets the app close its side after Ended.
const sessionCloseWait = 2 * time.Second

// appStream is one call's control stream.
type appStream struct {
	conn   *grpc.ClientConn
	stream sessionv1.Session_ConnectClient
	cancel context.CancelFunc

	sendMu sync.Mutex
	closed bool

	// msgs are the app's messages in order; gone closes when the stream ends (err says why).
	msgs     chan *sessionv1.AppMessage
	gone     chan struct{}
	err      error
	recvDone chan struct{}
}

var errSessionUnreachable = errors.New("session endpoint unreachable")

// dialSession opens a new connection to endpoint and starts the stream. It fails fast when the
// endpoint refuses connections.
func (n *Node) dialSession(endpoint string) (*appStream, error) {
	if endpoint == "" {
		return nil, fmt.Errorf("%w: no session endpoint configured", errSessionUnreachable)
	}
	creds := insecure.NewCredentials()
	if n.cfg.SessionTLS != nil {
		creds = credentials.NewTLS(n.cfg.SessionTLS.Clone())
	}
	ka := n.cfg.SessionKeepalive
	conn, err := grpc.NewClient(endpoint, grpc.WithTransportCredentials(creds),
		grpc.WithKeepaliveParams(keepalive.ClientParameters{Time: ka, Timeout: 2 * ka, PermitWithoutStream: true}))
	if err != nil {
		return nil, fmt.Errorf("%w: %v", errSessionUnreachable, err)
	}
	cctx, ccancel := context.WithTimeout(context.Background(), sessionConnectTimeout)
	defer ccancel()
	conn.Connect()
	for st := conn.GetState(); st != connectivity.Ready; st = conn.GetState() {
		if st == connectivity.TransientFailure || st == connectivity.Shutdown || !conn.WaitForStateChange(cctx, st) {
			_ = conn.Close()
			return nil, fmt.Errorf("%w: %s (%s)", errSessionUnreachable, endpoint, st)
		}
	}
	ctx, cancel := context.WithCancel(context.Background())
	stream, err := sessionv1.NewSessionClient(conn).Connect(ctx)
	if err != nil {
		cancel()
		_ = conn.Close()
		return nil, fmt.Errorf("%w: %v", errSessionUnreachable, err)
	}
	s := &appStream{conn: conn, stream: stream, cancel: cancel, msgs: make(chan *sessionv1.AppMessage, 32),
		gone: make(chan struct{}), recvDone: make(chan struct{})}
	return s, nil
}

// receive reads the app's messages until the stream ends; done (the call ended) drops what
// arrives after it.
func (s *appStream) receive(done <-chan struct{}) {
	defer close(s.recvDone)
	for {
		m, err := s.stream.Recv()
		if err != nil {
			s.err = err
			close(s.gone)
			return
		}
		select {
		case s.msgs <- m:
		case <-done:
		}
	}
}

// send writes one message; false when the stream is closed or broken.
func (s *appStream) send(m *sessionv1.NodeMessage) bool {
	s.sendMu.Lock()
	defer s.sendMu.Unlock()
	if s.closed {
		return false
	}
	return s.stream.Send(m) == nil
}

func (s *appStream) sendEvent(ev *sessionv1.Event) bool {
	return s.send(&sessionv1.NodeMessage{Msg: &sessionv1.NodeMessage_Event{Event: ev}})
}

// close half-closes the stream, gives the app a moment to close its side, then drops the
// connection.
func (s *appStream) close() {
	s.sendMu.Lock()
	if s.closed {
		s.sendMu.Unlock()
		return
	}
	s.closed = true
	_ = s.stream.CloseSend()
	s.sendMu.Unlock()
	go func() {
		select {
		case <-s.recvDone:
		case <-time.After(sessionCloseWait):
		}
		s.cancel()
		_ = s.conn.Close()
	}()
}

func mediaEndpoint(ip string, port int, codec, key string) *sessionv1.MediaEndpoint {
	return &sessionv1.MediaEndpoint{Ip: ip, Port: uint32(port), Codec: codec, SrtpKey: key}
}
