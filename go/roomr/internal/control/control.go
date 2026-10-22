// Package control serves Roomr (roomr.v1) over gRPC, the node's one control API for its
// controller (redesign-roomr, media-control "Roomr is a gRPC service with three nouns"), and the
// standard health service on the same port. It only checks input and maps the node's error codes
// to gRPC status codes with the code as the reason.
package control

import (
	"context"
	"crypto/tls"
	"errors"
	"log/slog"
	"net"
	"time"

	roomrv1 "github.com/fonoster/fonoster/go/roomr/api/roomr/v1"
	"github.com/fonoster/fonoster/go/roomr/internal/node"
	"google.golang.org/genproto/googleapis/rpc/errdetails"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/credentials"
	"google.golang.org/grpc/health"
	healthpb "google.golang.org/grpc/health/grpc_health_v1"
	"google.golang.org/grpc/keepalive"
	"google.golang.org/grpc/status"
)

// ErrorDomain is the ErrorInfo domain on every refusal.
const ErrorDomain = "roomr.fonoster.com"

// Backend is what the service drives (*node.Node).
type Backend interface {
	CreateCall(req node.CallRequest) (node.CallInfo, error)
	EndCall(ref string) error
	CreateRoom(ref string, o node.RoomOptions) (string, error)
	EndRoom(ref string) error
	AddRTPParticipant(roomRef string, ep node.MediaEndpoint) (node.ParticipantInfo, error)
	AddListenerParticipant(roomRef string, tracks []node.ListenTrack) (node.ParticipantInfo, error)
	RemoveParticipant(roomRef, ref string) error
}

// codeFor maps the node's error codes to gRPC codes.
var codeFor = map[string]codes.Code{
	node.CodeAtCapacity:          codes.ResourceExhausted,
	node.CodeRoomFull:            codes.ResourceExhausted,
	node.CodeRoomExists:          codes.AlreadyExists,
	node.CodeCallExists:          codes.AlreadyExists,
	node.CodeRoomNotFound:        codes.NotFound,
	node.CodeCallNotFound:        codes.NotFound,
	node.CodeParticipantNotFound: codes.NotFound,
	node.CodeBadMessage:          codes.InvalidArgument,
	node.CodeUnsupportedCodec:    codes.InvalidArgument,
	node.CodeNotSupported:        codes.Unimplemented,
	node.CodeInternal:            codes.Internal,
}

// refusal is a gRPC status with the reason as ErrorInfo.
func refusal(c codes.Code, reason, msg string) error {
	if msg == "" {
		msg = reason
	}
	st := status.New(c, msg)
	if withInfo, err := st.WithDetails(&errdetails.ErrorInfo{Reason: reason, Domain: ErrorDomain}); err == nil {
		st = withInfo
	}
	return st.Err()
}

// toStatus maps a node error to its gRPC status.
func toStatus(err error) error {
	if err == nil {
		return nil
	}
	var ne *node.Error
	if errors.As(err, &ne) {
		c, ok := codeFor[ne.Code]
		if !ok {
			c = codes.Internal
		}
		return refusal(c, ne.Code, ne.Error())
	}
	return refusal(codes.Internal, node.CodeInternal, err.Error())
}

func invalid(msg string) error { return refusal(codes.InvalidArgument, node.CodeBadMessage, msg) }

// Service implements roomrv1.RoomrServer.
type Service struct {
	roomrv1.UnimplementedRoomrServer
	backend Backend
}

// NewService serves Roomr for a backend.
func NewService(b Backend) *Service { return &Service{backend: b} }

func callState(s string) roomrv1.Call_State {
	switch s {
	case node.CallAnswered:
		return roomrv1.Call_ANSWERED
	case node.CallEnded:
		return roomrv1.Call_ENDED
	default:
		return roomrv1.Call_RINGING
	}
}

func seconds(s uint32) time.Duration { return time.Duration(s) * time.Second }

// CreateCall dials out.
func (s *Service) CreateCall(_ context.Context, req *roomrv1.CreateCallRequest) (*roomrv1.Call, error) {
	to := req.GetTo()
	if to.GetUri() == "" {
		return nil, invalid("to.uri is required")
	}
	target := node.SipTarget{URI: to.GetUri(), Proxy: to.GetProxy(), Headers: to.GetHeaders(),
		Username: to.GetAuth().GetUsername(), Password: to.GetAuth().GetPassword()}
	info, err := s.backend.CreateCall(node.CallRequest{CallRef: req.GetCallRef(), RoomRef: req.GetRoomRef(),
		From: req.GetFrom(), To: target, Session: req.GetSession(), RingTimeout: seconds(req.GetRingTimeoutS()),
		MaxDuration: seconds(req.GetMaxDurationS()), Metadata: req.GetMetadata()})
	if err != nil {
		return nil, toStatus(err)
	}
	return &roomrv1.Call{CallRef: info.CallRef, RoomRef: info.RoomRef, State: callState(info.State),
		ParticipantRef: info.ParticipantRef}, nil
}

// EndCall ends a call.
func (s *Service) EndCall(_ context.Context, req *roomrv1.EndCallRequest) (*roomrv1.Empty, error) {
	if req.GetCallRef() == "" {
		return nil, invalid("call_ref is required")
	}
	if err := s.backend.EndCall(req.GetCallRef()); err != nil {
		return nil, toStatus(err)
	}
	return &roomrv1.Empty{}, nil
}

// CreateRoom creates an empty room.
func (s *Service) CreateRoom(_ context.Context, req *roomrv1.CreateRoomRequest) (*roomrv1.Room, error) {
	ref, err := s.backend.CreateRoom(req.GetRoomRef(), node.RoomOptions{MaxDuration: seconds(req.GetMaxDurationS()),
		EmptyTimeout: seconds(req.GetEmptyRoomTimeoutS()), MaxParticipants: int(req.GetMaxParticipants())})
	if err != nil {
		return nil, toStatus(err)
	}
	return &roomrv1.Room{RoomRef: ref}, nil
}

// EndRoom ends a room and everything in it.
func (s *Service) EndRoom(_ context.Context, req *roomrv1.EndRoomRequest) (*roomrv1.Empty, error) {
	if req.GetRoomRef() == "" {
		return nil, invalid("room_ref is required")
	}
	if err := s.backend.EndRoom(req.GetRoomRef()); err != nil {
		return nil, toStatus(err)
	}
	return &roomrv1.Empty{}, nil
}

func endpoint(m *roomrv1.MediaEndpoint) (node.MediaEndpoint, error) {
	if m.GetIp() == "" || m.GetPort() == 0 || m.GetPort() > 65535 {
		return node.MediaEndpoint{}, invalid("rtp needs ip and a port from 1 to 65535")
	}
	if net.ParseIP(m.GetIp()) == nil {
		return node.MediaEndpoint{}, invalid("rtp.ip must be an IP address")
	}
	codec := m.GetCodec()
	if codec == "" {
		codec = "L16/16000"
	}
	return node.MediaEndpoint{IP: m.GetIp(), Port: int(m.GetPort()), Codec: codec, SRTPKey: m.GetSrtpKey()}, nil
}

func participant(p node.ParticipantInfo) *roomrv1.Participant {
	out := &roomrv1.Participant{ParticipantRef: p.ParticipantRef, RoomRef: p.RoomRef, TrackId: uint32(p.TrackID)}
	if p.RTP != nil {
		out.Rtp = &roomrv1.MediaEndpoint{Ip: p.RTP.IP, Port: uint32(p.RTP.Port), Codec: p.RTP.Codec, SrtpKey: p.RTP.SRTPKey}
	}
	return out
}

// AddParticipant adds an RTP participant or a listener. WebRTC is not implemented yet.
func (s *Service) AddParticipant(_ context.Context, req *roomrv1.AddParticipantRequest) (*roomrv1.Participant, error) {
	if req.GetRoomRef() == "" {
		return nil, invalid("room_ref is required")
	}
	if req.GetWebrtc() != nil {
		return nil, refusal(codes.Unimplemented, node.CodeNotSupported, "WebRTC participants are not implemented yet")
	}
	listen := req.GetListen()
	switch {
	case req.GetRtp() != nil && len(listen) > 0:
		return nil, invalid("set rtp or listen, not both")
	case req.GetRtp() != nil:
		ep, err := endpoint(req.GetRtp())
		if err != nil {
			return nil, err
		}
		p, err := s.backend.AddRTPParticipant(req.GetRoomRef(), ep)
		if err != nil {
			return nil, toStatus(err)
		}
		return participant(p), nil
	case len(listen) > 0:
		tracks := make([]node.ListenTrack, 0, len(listen))
		for _, t := range listen {
			if t.GetTrackId() == 0 {
				return nil, invalid("listen needs a track_id")
			}
			ep, err := endpoint(t.GetRtp())
			if err != nil {
				return nil, err
			}
			tracks = append(tracks, node.ListenTrack{TrackID: int(t.GetTrackId()), RTP: ep})
		}
		p, err := s.backend.AddListenerParticipant(req.GetRoomRef(), tracks)
		if err != nil {
			return nil, toStatus(err)
		}
		return participant(p), nil
	}
	return nil, invalid("an rtp endpoint, a webrtc offer or listen is required")
}

// RemoveParticipant removes a participant or listener.
func (s *Service) RemoveParticipant(_ context.Context, req *roomrv1.RemoveParticipantRequest) (*roomrv1.Empty, error) {
	if req.GetParticipantRef() == "" {
		return nil, invalid("participant_ref is required")
	}
	if err := s.backend.RemoveParticipant(req.GetRoomRef(), req.GetParticipantRef()); err != nil {
		return nil, toStatus(err)
	}
	return &roomrv1.Empty{}, nil
}

// Server is the gRPC server for Roomr and the standard health service (grpc.health.v1.Health),
// SERVING until NotServing.
type Server struct {
	grpc   *grpc.Server
	lis    net.Listener
	log    *slog.Logger
	health *health.Server
}

// Listen binds addr and prepares the server; tlsConfig nil serves plaintext (mTLS when it
// requires client certificates).
func Listen(addr string, b Backend, tlsConfig *tls.Config, log *slog.Logger) (*Server, error) {
	if log == nil {
		log = slog.Default()
	}
	lis, err := net.Listen("tcp", addr)
	if err != nil {
		return nil, err
	}
	opts := []grpc.ServerOption{
		grpc.KeepaliveParams(keepalive.ServerParameters{Time: 10 * time.Second, Timeout: 20 * time.Second}),
		grpc.KeepaliveEnforcementPolicy(keepalive.EnforcementPolicy{MinTime: 5 * time.Second, PermitWithoutStream: true}),
	}
	if tlsConfig != nil {
		opts = append(opts, grpc.Creds(credentials.NewTLS(tlsConfig)))
	}
	g := grpc.NewServer(opts...)
	roomrv1.RegisterRoomrServer(g, NewService(b))
	h := health.NewServer()
	healthpb.RegisterHealthServer(g, h)
	return &Server{grpc: g, lis: lis, log: log, health: h}, nil
}

// NotServing flips the health service to NOT_SERVING (a drain has begun): readiness probes fail
// while the RPCs of live calls keep working.
func (s *Server) NotServing() {
	s.health.Shutdown()
}

// Addr is the bound address.
func (s *Server) Addr() string { return s.lis.Addr().String() }

// Serve blocks until Stop.
func (s *Server) Serve() error {
	err := s.grpc.Serve(s.lis)
	if errors.Is(err, grpc.ErrServerStopped) {
		return nil
	}
	return err
}

// Stop finishes in-flight RPCs (up to 5 s) and closes the listener.
func (s *Server) Stop() {
	done := make(chan struct{})
	go func() {
		s.grpc.GracefulStop()
		close(done)
	}()
	select {
	case <-done:
	case <-time.After(5 * time.Second):
		s.grpc.Stop()
	}
}
