package node

import (
	"net"
	"sync"
	"testing"
	"time"

	sessionv1 "github.com/fonoster/fonoster/go/roomr/api/session/v1"
	"github.com/fonoster/fonoster/go/roomr/internal/sdp"
	"google.golang.org/grpc"
)

// fakeLeg is an inbound SIP leg that records the node's answers.
type fakeLeg struct {
	mu       sync.Mutex
	rang     bool
	answered bool
	rejected int
	gone     chan struct{}
	once     sync.Once
}

func newFakeLeg() *fakeLeg { return &fakeLeg{gone: make(chan struct{})} }

func (l *fakeLeg) Ring() error { l.mu.Lock(); l.rang = true; l.mu.Unlock(); return nil }
func (l *fakeLeg) Answer([]byte) error {
	l.mu.Lock()
	l.answered = true
	l.mu.Unlock()
	return nil
}
func (l *fakeLeg) Reject(status int) error {
	l.mu.Lock()
	l.rejected = status
	l.mu.Unlock()
	l.hangup()
	return nil
}
func (l *fakeLeg) Bye() error            { l.hangup(); return nil }
func (l *fakeLeg) Gone() <-chan struct{} { return l.gone }
func (l *fakeLeg) hangup()               { l.once.Do(func() { close(l.gone) }) }
func (l *fakeLeg) state() (bool, bool, int) {
	l.mu.Lock()
	defer l.mu.Unlock()
	return l.rang, l.answered, l.rejected
}

// app answers or rejects every stream and keeps the Starts and Ended it saw.
type app struct {
	sessionv1.UnimplementedSessionServer
	reject uint32
	mu     sync.Mutex
	starts []*sessionv1.Start
	ended  []*sessionv1.Ended
}

func (a *app) Connect(s sessionv1.Session_ConnectServer) error {
	first, err := s.Recv()
	if err != nil {
		return err
	}
	a.mu.Lock()
	a.starts = append(a.starts, first.GetStart())
	a.mu.Unlock()
	if a.reject != 0 {
		_ = s.Send(&sessionv1.AppMessage{Msg: &sessionv1.AppMessage_Reject{Reject: &sessionv1.Reject{SipStatus: a.reject}}})
	} else {
		_ = s.Send(&sessionv1.AppMessage{Msg: &sessionv1.AppMessage_Answer{Answer: &sessionv1.Answer{
			Media: &sessionv1.MediaEndpoint{Ip: "127.0.0.1", Port: 9, Codec: "L16/16000"}}}})
	}
	for {
		m, err := s.Recv()
		if err != nil {
			return nil
		}
		if e := m.GetEvent().GetEnded(); e != nil {
			a.mu.Lock()
			a.ended = append(a.ended, e)
			a.mu.Unlock()
		}
	}
}

func serveApp(t *testing.T, a *app) string {
	lis, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	srv := grpc.NewServer()
	sessionv1.RegisterSessionServer(srv, a)
	go func() { _ = srv.Serve(lis) }()
	t.Cleanup(srv.Stop)
	return lis.Addr().String()
}

func invite(leg *fakeLeg, headers map[string]string) IncomingCall {
	return IncomingCall{From: "+1555", To: "+1666", Headers: headers, Leg: leg,
		Media: sdp.Media{Host: "127.0.0.1", Port: 9, DTMF: -1, PayloadTypes: []int{0}, Codecs: map[int]string{0: "PCMU/8000"}}}
}

func eventually(t *testing.T, ok func() bool) {
	t.Helper()
	deadline := time.Now().Add(3 * time.Second)
	for !ok() {
		if time.Now().After(deadline) {
			t.Fatal("condition not reached")
		}
		time.Sleep(10 * time.Millisecond)
	}
}

func TestInboundAnsweredOnlyOnAnswer(t *testing.T) {
	a := &app{}
	n := New(nil, Config{SessionEndpoint: serveApp(t, a), CallRefHeader: "X-Call-Ref", EmptyRoomTimeout: -1})
	defer n.Shutdown()
	leg := newFakeLeg()
	go n.Incoming(invite(leg, map[string]string{"X-Call-Ref": "c1", "X-Anything": "42"}))
	eventually(t, func() bool { _, answered, _ := leg.state(); return answered })
	if rang, _, _ := leg.state(); !rang {
		t.Fatal("no 180 before the answer")
	}
	a.mu.Lock()
	s := a.starts[0]
	a.mu.Unlock()
	if s.GetCallRef() != "c1" || s.GetHeaders()["X-Anything"] != "42" || s.GetRoomRef() == "" ||
		s.GetMedia().GetPort() == 0 || s.GetMedia().GetSrtpKey() == "" || s.GetDirection() != sessionv1.Start_INBOUND {
		t.Fatalf("Start = %v", s)
	}
	if info, err := n.GetCall("c1"); err != nil || info.State != CallAnswered {
		t.Fatalf("call = %+v %v", info, err)
	}
	leg.hangup() // the caller's BYE
	eventually(t, func() bool { a.mu.Lock(); defer a.mu.Unlock(); return len(a.ended) == 1 })
	if a.ended[0].GetCause() != ReasonCallerHangup {
		t.Fatalf("Ended = %v", a.ended[0])
	}
	eventually(t, func() bool { return n.ActiveRooms() == 0 })
}

func TestInboundRejectAndUnreachable(t *testing.T) {
	n := New(nil, Config{SessionEndpoint: serveApp(t, &app{reject: 404}), EmptyRoomTimeout: -1})
	defer n.Shutdown()
	leg := newFakeLeg()
	n.Incoming(invite(leg, nil))
	if _, answered, rejected := leg.state(); answered || rejected != 404 || n.ActiveRooms() != 0 {
		t.Fatalf("answered %v rejected %d rooms %d", answered, rejected, n.ActiveRooms())
	}

	l, _ := net.Listen("tcp", "127.0.0.1:0")
	dead := l.Addr().String()
	_ = l.Close()
	n2 := New(nil, Config{SessionEndpoint: dead, EmptyRoomTimeout: -1})
	defer n2.Shutdown()
	leg2 := newFakeLeg()
	n2.Incoming(invite(leg2, nil))
	if _, _, rejected := leg2.state(); rejected != 503 || n2.ActiveRooms() != 0 {
		t.Fatalf("rejected %d rooms %d", rejected, n2.ActiveRooms())
	}
}

func TestInboundAnswerTimeout(t *testing.T) {
	lis, _ := net.Listen("tcp", "127.0.0.1:0")
	srv := grpc.NewServer()
	stall := &stallApp{}
	sessionv1.RegisterSessionServer(srv, stall)
	go func() { _ = srv.Serve(lis) }()
	defer srv.Stop()
	n := New(nil, Config{SessionEndpoint: lis.Addr().String(), AnswerTimeout: 300 * time.Millisecond, EmptyRoomTimeout: -1})
	defer n.Shutdown()
	leg := newFakeLeg()
	n.Incoming(invite(leg, nil))
	if _, _, rejected := leg.state(); rejected != 480 {
		t.Fatalf("rejected %d, want 480", rejected)
	}
}

type stallApp struct {
	sessionv1.UnimplementedSessionServer
}

func (stallApp) Connect(s sessionv1.Session_ConnectServer) error {
	for {
		if _, err := s.Recv(); err != nil {
			return nil
		}
	}
}
