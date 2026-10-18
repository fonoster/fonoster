package control

import (
	"context"
	"errors"
	"net"
	"testing"
	"time"

	roomrv1 "github.com/fonoster/fonoster/go/roomr/api/roomr/v1"
	"github.com/fonoster/fonoster/go/roomr/internal/node"
	"google.golang.org/genproto/googleapis/rpc/errdetails"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/credentials/insecure"
	healthpb "google.golang.org/grpc/health/grpc_health_v1"
	"google.golang.org/grpc/status"
	"google.golang.org/grpc/test/bufconn"
	"google.golang.org/protobuf/encoding/protowire"
	"google.golang.org/protobuf/proto"
)

// fake records what the service asked for and answers with err (or a canned success).
type fake struct {
	err      error
	call     node.CallRequest
	room     string
	ep       node.MediaEndpoint
	tracks   []node.ListenTrack
	target   node.Target
	url      string
	digits   string
	ended    string
	roomOpts node.RoomOptions
	leaveRef string
}

func (f *fake) CreateCall(req node.CallRequest) (node.CallInfo, error) {
	f.call = req
	if f.err != nil {
		return node.CallInfo{}, f.err
	}
	return node.CallInfo{CallRef: req.CallRef, RoomRef: "room-1", State: node.CallRinging}, nil
}
func (f *fake) EndCall(ref string) error { f.ended = ref; return f.err }
func (f *fake) CreateRoom(ref string, o node.RoomOptions) (string, error) {
	f.room, f.roomOpts = ref, o
	if f.err != nil {
		return "", f.err
	}
	if ref == "" {
		ref = "room-new"
	}
	return ref, nil
}
func (f *fake) EndRoom(ref string) error { f.room = ref; return f.err }
func (f *fake) JoinRTP(room string, ep node.MediaEndpoint) (node.ParticipantInfo, error) {
	f.room, f.ep = room, ep
	if f.err != nil {
		return node.ParticipantInfo{}, f.err
	}
	return node.ParticipantInfo{ParticipantRef: "p-1", RoomRef: room, TrackID: 2,
		RTP: &node.MediaEndpoint{IP: "10.0.1.7", Port: 30010, Codec: ep.Codec, SRTPKey: "k"}}, nil
}
func (f *fake) JoinListener(room string, tracks []node.ListenTrack) (node.ParticipantInfo, error) {
	f.room, f.tracks = room, tracks
	if f.err != nil {
		return node.ParticipantInfo{}, f.err
	}
	return node.ParticipantInfo{ParticipantRef: "listener-1", RoomRef: room}, nil
}
func (f *fake) Leave(room, ref string) error { f.room, f.leaveRef = room, ref; return f.err }
func (f *fake) Play(t node.Target, url string) (string, error) {
	f.target, f.url = t, url
	if f.err != nil {
		return "", f.err
	}
	return "op-1", nil
}
func (f *fake) SendDTMF(t node.Target, digits string) error {
	f.target, f.digits = t, digits
	return f.err
}

func dial(t *testing.T, b Backend) roomrv1.RoomrClient {
	t.Helper()
	lis := bufconn.Listen(1 << 20)
	g := grpc.NewServer()
	roomrv1.RegisterRoomrServer(g, NewService(b))
	go func() { _ = g.Serve(lis) }()
	conn, err := grpc.NewClient("passthrough:///bufnet",
		grpc.WithContextDialer(func(context.Context, string) (net.Conn, error) { return lis.Dial() }),
		grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() {
		_ = conn.Close()
		g.Stop()
	})
	return roomrv1.NewRoomrClient(conn)
}

// wantCode checks the status code and the ErrorInfo reason.
func wantCode(t *testing.T, err error, code codes.Code, reason string) {
	t.Helper()
	st, ok := status.FromError(err)
	if !ok || st.Code() != code {
		t.Fatalf("got %v, want %v", err, code)
	}
	if reason == "" {
		return
	}
	for _, d := range st.Details() {
		if info, ok := d.(*errdetails.ErrorInfo); ok {
			if info.Reason != reason || info.Domain != ErrorDomain {
				t.Fatalf("reason %q domain %q, want %q", info.Reason, info.Domain, reason)
			}
			return
		}
	}
	t.Fatalf("no ErrorInfo in %v", err)
}

func ctx(t *testing.T) context.Context {
	c, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	t.Cleanup(cancel)
	return c
}

func TestCreateCallPassesTheTargetThrough(t *testing.T) {
	f := &fake{}
	c := dial(t, f)
	call, err := c.CreateCall(ctx(t), &roomrv1.CreateCallRequest{CallRef: "c1", From: "+15550001",
		To: &roomrv1.SipTarget{Uri: "sip:+15551234567@carrier", Proxy: "sip:proxy:5060",
			Headers: map[string]string{"X-Tenant": "t1"}, Auth: &roomrv1.SipAuth{Username: "u", Password: "p"}},
		RoomRef: "r1", RingTimeoutS: 20, MaxDurationS: 600, Metadata: map[string]string{"tenant": "t1"}})
	if err != nil {
		t.Fatal(err)
	}
	if call.CallRef != "c1" || call.RoomRef != "room-1" || call.State != roomrv1.Call_RINGING {
		t.Fatalf("call = %v", call)
	}
	r := f.call
	if r.To.URI != "sip:+15551234567@carrier" || r.To.Proxy != "sip:proxy:5060" || r.To.Headers["X-Tenant"] != "t1" ||
		r.To.Username != "u" || r.To.Password != "p" || r.From != "+15550001" || r.RoomRef != "r1" ||
		r.RingTimeout != 20*time.Second || r.MaxDuration != 10*time.Minute || r.Metadata["tenant"] != "t1" {
		t.Fatalf("request = %+v", r)
	}
}

func TestCreateCallRefusals(t *testing.T) {
	cases := []struct {
		name   string
		err    error
		req    *roomrv1.CreateCallRequest
		code   codes.Code
		reason string
	}{
		{"no uri", nil, &roomrv1.CreateCallRequest{CallRef: "c1"}, codes.InvalidArgument, node.CodeBadMessage},
		{"session override", nil, &roomrv1.CreateCallRequest{To: &roomrv1.SipTarget{Uri: "sip:a@b"}, Session: "x:1"},
			codes.Unimplemented, node.CodeNotSupported},
		{"at the room limit", &node.Error{Code: node.CodeAtCapacity}, nil, codes.ResourceExhausted, node.CodeAtCapacity},
		{"bad header", &node.Error{Code: node.CodeBadMessage, Message: "header Via is set by the node"}, nil,
			codes.InvalidArgument, node.CodeBadMessage},
		{"no user agent", &node.Error{Code: node.CodeNotSupported}, nil, codes.Unimplemented, node.CodeNotSupported},
		{"plain error", errors.New("boom"), nil, codes.Internal, node.CodeInternal},
		{"unknown code", &node.Error{Code: "something_new"}, nil, codes.Internal, "something_new"},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			c := dial(t, &fake{err: tc.err})
			req := tc.req
			if req == nil {
				req = &roomrv1.CreateCallRequest{CallRef: "c1", To: &roomrv1.SipTarget{Uri: "sip:a@b"}}
			}
			_, err := c.CreateCall(ctx(t), req)
			wantCode(t, err, tc.code, tc.reason)
		})
	}
}

func TestEndCall(t *testing.T) {
	f := &fake{}
	c := dial(t, f)
	if _, err := c.EndCall(ctx(t), &roomrv1.EndCallRequest{CallRef: "c1"}); err != nil || f.ended != "c1" {
		t.Fatalf("err %v ended %q", err, f.ended)
	}
	_, err := c.EndCall(ctx(t), &roomrv1.EndCallRequest{})
	wantCode(t, err, codes.InvalidArgument, node.CodeBadMessage)
	f.err = &node.Error{Code: node.CodeCallNotFound}
	_, err = c.EndCall(ctx(t), &roomrv1.EndCallRequest{CallRef: "nope"})
	wantCode(t, err, codes.NotFound, node.CodeCallNotFound)
}

// TestUnknownFieldIgnored: a request carrying a field this version does not know is served as
// usual (messages only grow).
func TestUnknownFieldIgnored(t *testing.T) {
	f := &fake{}
	c := dial(t, f)
	raw, _ := proto.Marshal(&roomrv1.EndCallRequest{CallRef: "c1"})
	raw = protowire.AppendTag(raw, 99, protowire.BytesType)
	raw = protowire.AppendString(raw, "from a newer controller")
	req := &roomrv1.EndCallRequest{}
	if err := proto.Unmarshal(raw, req); err != nil {
		t.Fatal(err)
	}
	if len(req.ProtoReflect().GetUnknown()) == 0 {
		t.Fatal("the unknown field was not kept for the wire")
	}
	if _, err := c.EndCall(ctx(t), req); err != nil || f.ended != "c1" {
		t.Fatalf("err %v ended %q", err, f.ended)
	}
}

func TestRooms(t *testing.T) {
	f := &fake{}
	c := dial(t, f)
	room, err := c.CreateRoom(ctx(t), &roomrv1.CreateRoomRequest{RoomRef: "lobby", MaxDurationS: 60,
		EmptyTimeoutS: 5, MaxParticipants: 3})
	if err != nil || room.RoomRef != "lobby" || f.roomOpts != (node.RoomOptions{MaxDuration: time.Minute,
		EmptyTimeout: 5 * time.Second, MaxParticipants: 3}) {
		t.Fatalf("room %v err %v opts %+v", room, err, f.roomOpts)
	}
	f.err = &node.Error{Code: node.CodeRoomExists}
	_, err = c.CreateRoom(ctx(t), &roomrv1.CreateRoomRequest{RoomRef: "lobby"})
	wantCode(t, err, codes.AlreadyExists, node.CodeRoomExists)
	f.err = &node.Error{Code: node.CodeAtCapacity}
	_, err = c.CreateRoom(ctx(t), &roomrv1.CreateRoomRequest{})
	wantCode(t, err, codes.ResourceExhausted, node.CodeAtCapacity)
	f.err = &node.Error{Code: node.CodeRoomNotFound}
	_, err = c.EndRoom(ctx(t), &roomrv1.EndRoomRequest{RoomRef: "gone"})
	wantCode(t, err, codes.NotFound, node.CodeRoomNotFound)
	_, err = c.EndRoom(ctx(t), &roomrv1.EndRoomRequest{})
	wantCode(t, err, codes.InvalidArgument, node.CodeBadMessage)
}

func TestJoin(t *testing.T) {
	f := &fake{}
	c := dial(t, f)
	p, err := c.Join(ctx(t), &roomrv1.JoinRequest{RoomRef: "r1",
		Endpoint: &roomrv1.JoinRequest_Rtp{Rtp: &roomrv1.MediaEndpoint{Ip: "10.0.0.5", Port: 40010}}})
	if err != nil {
		t.Fatal(err)
	}
	if f.ep.Codec != "L16/16000" || f.ep.Port != 40010 || f.ep.IP != "10.0.0.5" {
		t.Fatalf("endpoint = %+v", f.ep)
	}
	if p.ParticipantRef != "p-1" || p.TrackId != 2 || p.Rtp.GetPort() != 30010 || p.Rtp.GetSrtpKey() != "k" {
		t.Fatalf("participant = %v", p)
	}

	p, err = c.Join(ctx(t), &roomrv1.JoinRequest{RoomRef: "r1", Listen: []*roomrv1.ListenTrack{
		{TrackId: 1, Rtp: &roomrv1.MediaEndpoint{Ip: "10.0.0.5", Port: 40100, Codec: "L16/16000"}}}})
	if err != nil || p.ParticipantRef != "listener-1" || len(f.tracks) != 1 || f.tracks[0].TrackID != 1 {
		t.Fatalf("listener %v err %v tracks %v", p, err, f.tracks)
	}

	bad := []struct {
		name string
		req  *roomrv1.JoinRequest
		code codes.Code
	}{
		{"webrtc", &roomrv1.JoinRequest{RoomRef: "r1", Endpoint: &roomrv1.JoinRequest_Webrtc{Webrtc: &roomrv1.WebRtcOffer{Sdp: "v=0"}}}, codes.Unimplemented},
		{"no room", &roomrv1.JoinRequest{Endpoint: &roomrv1.JoinRequest_Rtp{Rtp: &roomrv1.MediaEndpoint{Ip: "10.0.0.5", Port: 1}}}, codes.InvalidArgument},
		{"nothing to join", &roomrv1.JoinRequest{RoomRef: "r1"}, codes.InvalidArgument},
		{"bad ip", &roomrv1.JoinRequest{RoomRef: "r1", Endpoint: &roomrv1.JoinRequest_Rtp{Rtp: &roomrv1.MediaEndpoint{Ip: "gateway", Port: 1}}}, codes.InvalidArgument},
		{"bad port", &roomrv1.JoinRequest{RoomRef: "r1", Endpoint: &roomrv1.JoinRequest_Rtp{Rtp: &roomrv1.MediaEndpoint{Ip: "10.0.0.5", Port: 70000}}}, codes.InvalidArgument},
		{"rtp and listen", &roomrv1.JoinRequest{RoomRef: "r1", Endpoint: &roomrv1.JoinRequest_Rtp{Rtp: &roomrv1.MediaEndpoint{Ip: "10.0.0.5", Port: 1}},
			Listen: []*roomrv1.ListenTrack{{TrackId: 1, Rtp: &roomrv1.MediaEndpoint{Ip: "10.0.0.5", Port: 2}}}}, codes.InvalidArgument},
		{"listen without track", &roomrv1.JoinRequest{RoomRef: "r1", Listen: []*roomrv1.ListenTrack{{Rtp: &roomrv1.MediaEndpoint{Ip: "10.0.0.5", Port: 2}}}}, codes.InvalidArgument},
	}
	for _, tc := range bad {
		t.Run(tc.name, func(t *testing.T) {
			_, err := c.Join(ctx(t), tc.req)
			wantCode(t, err, tc.code, "")
		})
	}

	backend := []struct {
		code   string
		status codes.Code
	}{
		{node.CodeRoomFull, codes.ResourceExhausted},
		{node.CodeRoomNotFound, codes.NotFound},
		{"unsupported_codec", codes.InvalidArgument},
		{node.CodeBadMessage, codes.InvalidArgument},
	}
	for _, tc := range backend {
		t.Run(tc.code, func(t *testing.T) {
			f.err = &node.Error{Code: tc.code}
			_, err := c.Join(ctx(t), &roomrv1.JoinRequest{RoomRef: "r1",
				Endpoint: &roomrv1.JoinRequest_Rtp{Rtp: &roomrv1.MediaEndpoint{Ip: "10.0.0.5", Port: 40010}}})
			wantCode(t, err, tc.status, tc.code)
		})
	}
}

func TestLeave(t *testing.T) {
	f := &fake{}
	c := dial(t, f)
	if _, err := c.Leave(ctx(t), &roomrv1.LeaveRequest{RoomRef: "r1", ParticipantRef: "p-1"}); err != nil || f.leaveRef != "p-1" {
		t.Fatalf("err %v ref %q", err, f.leaveRef)
	}
	_, err := c.Leave(ctx(t), &roomrv1.LeaveRequest{RoomRef: "r1"})
	wantCode(t, err, codes.InvalidArgument, node.CodeBadMessage)
	f.err = &node.Error{Code: node.CodeParticipantNotFound}
	_, err = c.Leave(ctx(t), &roomrv1.LeaveRequest{ParticipantRef: "p-9"})
	wantCode(t, err, codes.NotFound, node.CodeParticipantNotFound)
}

func TestOperations(t *testing.T) {
	f := &fake{}
	c := dial(t, f)
	op, err := c.Play(ctx(t), &roomrv1.PlayRequest{Target: &roomrv1.PlayRequest_CallRef{CallRef: "c1"}, Url: "https://example.com/a.wav"})
	if err != nil || op.OperationRef != "op-1" || f.target.CallRef != "c1" || f.url != "https://example.com/a.wav" {
		t.Fatalf("op %v err %v target %+v", op, err, f.target)
	}
	_, err = c.Play(ctx(t), &roomrv1.PlayRequest{Url: "https://example.com/a.wav"})
	wantCode(t, err, codes.InvalidArgument, node.CodeBadMessage)
	_, err = c.Play(ctx(t), &roomrv1.PlayRequest{Target: &roomrv1.PlayRequest_RoomRef{RoomRef: "r1"}})
	wantCode(t, err, codes.InvalidArgument, node.CodeBadMessage)

	_, err = c.Record(ctx(t), &roomrv1.RecordRequest{Target: &roomrv1.RecordRequest_RoomRef{RoomRef: "r1"}, Destination: "s3://x"})
	wantCode(t, err, codes.Unimplemented, node.CodeNotSupported)

	if _, err := c.SendDtmf(ctx(t), &roomrv1.SendDtmfRequest{Target: &roomrv1.SendDtmfRequest_ParticipantRef{ParticipantRef: "p-1"},
		Digits: "12#"}); err != nil || f.digits != "12#" || f.target.ParticipantRef != "p-1" {
		t.Fatalf("err %v digits %q", err, f.digits)
	}
	_, err = c.SendDtmf(ctx(t), &roomrv1.SendDtmfRequest{Digits: "1"})
	wantCode(t, err, codes.InvalidArgument, node.CodeBadMessage)
	f.err = &node.Error{Code: node.CodeNoDTMF}
	_, err = c.SendDtmf(ctx(t), &roomrv1.SendDtmfRequest{Target: &roomrv1.SendDtmfRequest_CallRef{CallRef: "c1"}, Digits: "1"})
	wantCode(t, err, codes.FailedPrecondition, node.CodeNoDTMF)
	f.err = &node.Error{Code: node.CodeCallNotAnswered}
	_, err = c.Play(ctx(t), &roomrv1.PlayRequest{Target: &roomrv1.PlayRequest_CallRef{CallRef: "c1"}, Url: "https://example.com/a.wav"})
	wantCode(t, err, codes.FailedPrecondition, node.CodeCallNotAnswered)
}

// TestEveryNodeCodeIsMapped: each code the node and its NATS handlers return has a deliberate
// gRPC code (nothing falls through to INTERNAL by accident).
func TestEveryNodeCodeIsMapped(t *testing.T) {
	for _, code := range []string{node.CodeAtCapacity, node.CodeRoomExists, node.CodeRoomNotFound,
		node.CodeCallNotFound, node.CodeParticipantNotFound, node.CodeRoomFull, node.CodeBadMessage,
		node.CodeNotSupported, node.CodeCallNotAnswered, node.CodeNoDTMF,
		node.CodeInternal, "unsupported_codec", "unsupported_track_kind", "listener_not_found"} {
		if _, ok := codeFor[code]; !ok {
			t.Errorf("%s has no gRPC code", code)
		}
	}
}

func TestListenServesPlaintext(t *testing.T) {
	s, err := Listen("127.0.0.1:0", &fake{}, nil, nil)
	if err != nil {
		t.Fatal(err)
	}
	go func() { _ = s.Serve() }()
	defer s.Stop()
	conn, err := grpc.NewClient(s.Addr(), grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		t.Fatal(err)
	}
	defer conn.Close()
	room, err := roomrv1.NewRoomrClient(conn).CreateRoom(ctx(t), &roomrv1.CreateRoomRequest{})
	if err != nil || room.RoomRef != "room-new" {
		t.Fatalf("room %v err %v", room, err)
	}
}

// The standard health service answers SERVING, then NOT_SERVING once a drain begins, while the
// Roomr RPCs keep working for live calls.
func TestHealthServingThenNotServing(t *testing.T) {
	s, err := Listen("127.0.0.1:0", &fake{}, nil, nil)
	if err != nil {
		t.Fatal(err)
	}
	go func() { _ = s.Serve() }()
	defer s.Stop()
	conn, err := grpc.NewClient(s.Addr(), grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		t.Fatal(err)
	}
	defer conn.Close()
	h := healthpb.NewHealthClient(conn)
	check := func(want healthpb.HealthCheckResponse_ServingStatus) {
		t.Helper()
		res, err := h.Check(ctx(t), &healthpb.HealthCheckRequest{})
		if err != nil || res.Status != want {
			t.Fatalf("health = %v, %v; want %v", res, err, want)
		}
	}
	check(healthpb.HealthCheckResponse_SERVING)
	s.NotServing()
	check(healthpb.HealthCheckResponse_NOT_SERVING)
	if _, err := roomrv1.NewRoomrClient(conn).CreateRoom(ctx(t), &roomrv1.CreateRoomRequest{}); err != nil {
		t.Fatalf("CreateRoom while not serving: %v", err)
	}
}
