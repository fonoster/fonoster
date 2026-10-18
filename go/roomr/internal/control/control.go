// Package control serves Roomr (roomr.v1) over gRPC next to the node's NATS commands
// (redesign-media-node, "Roomr is a gRPC service with three nouns"). Each RPC calls the
// node operation the NATS handler for the same action uses; this package only checks input and
// maps the node's error codes to gRPC status codes with the code as the reason.
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
	"google.golang.org/grpc/keepalive"
	"google.golang.org/grpc/status"
)

// ErrorDomain is the ErrorInfo domain on every refusal.
const ErrorDomain = "roomr.fonoster.com"

// Backend is what the service drives (*node.Node).
type Backend interface {
	CreateCall(req node.CallRequest) (node.CallInfo, error)
	EndCall(ref string) error
	CreateRoom(ref string, maxDuration time.Duration) (string, error)
	EndRoom(ref string) error
	JoinRTP(roomRef string, ep node.MediaEndpoint) (node.ParticipantInfo, error)
	JoinListener(roomRef string, tracks []node.ListenTrack) (node.ParticipantInfo, error)
	Leave(roomRef, ref string) error
	Play(t node.Target, url string) (string, error)
	SendDTMF(t node.Target, digits string) error
}

// codeFor maps the node's error codes (node.Code* and the NATS handlers' codes) to gRPC codes.
var codeFor = map[string]codes.Code{
	node.CodeDraining:            codes.Unavailable,
	node.CodeAtCapacity:          codes.ResourceExhausted,
	node.CodeRoomFull:            codes.ResourceExhausted,
	node.CodeRoomExists:          codes.AlreadyExists,
	node.CodeRoomNotFound:        codes.NotFound,
	node.CodeCallNotFound:        codes.NotFound,
	node.CodeParticipantNotFound: codes.NotFound,
	"listener_not_found":         codes.NotFound,
	node.CodeBadMessage:          codes.InvalidArgument,
	"unsupported_codec":          codes.InvalidArgument,
	"unsupported_track_kind":     codes.InvalidArgument,
	node.CodeNotSupported:        codes.Unimplemented,
	node.CodeCallNotAnswered:     codes.FailedPrecondition,
	node.CodeNoDTMF:              codes.FailedPrecondition,
	node.CodeEncryptionRequired:  codes.FailedPrecondition,
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
	if req.GetSession() != "" {
		return nil, refusal(codes.Unimplemented, node.CodeNotSupported, "session override needs the control stream, which is not implemented yet")
	}
	target := node.SipTarget{URI: to.GetUri(), Proxy: to.GetProxy(), Headers: to.GetHeaders(),
		Username: to.GetAuth().GetUsername(), Password: to.GetAuth().GetPassword()}
	info, err := s.backend.CreateCall(node.CallRequest{CallRef: req.GetCallRef(), RoomRef: req.GetRoomRef(),
		From: req.GetFrom(), To: target, RingTimeout: seconds(req.GetRingTimeoutS()),
		MaxDuration: seconds(req.GetMaxDurationS()), Labels: req.GetLabels()})
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
	ref, err := s.backend.CreateRoom(req.GetRoomRef(), seconds(req.GetMaxDurationS()))
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

// Join adds an RTP participant or a listener. WebRTC is not implemented yet.
func (s *Service) Join(_ context.Context, req *roomrv1.JoinRequest) (*roomrv1.Participant, error) {
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
		p, err := s.backend.JoinRTP(req.GetRoomRef(), ep)
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
		p, err := s.backend.JoinListener(req.GetRoomRef(), tracks)
		if err != nil {
			return nil, toStatus(err)
		}
		return participant(p), nil
	}
	return nil, invalid("an rtp endpoint, a webrtc offer or listen is required")
}

// Leave removes a participant or listener.
func (s *Service) Leave(_ context.Context, req *roomrv1.LeaveRequest) (*roomrv1.Empty, error) {
	if req.GetParticipantRef() == "" {
		return nil, invalid("participant_ref is required")
	}
	if err := s.backend.Leave(req.GetRoomRef(), req.GetParticipantRef()); err != nil {
		return nil, toStatus(err)
	}
	return &roomrv1.Empty{}, nil
}

// Play plays a file to a call, participant or room.
func (s *Service) Play(_ context.Context, req *roomrv1.PlayRequest) (*roomrv1.Operation, error) {
	t := node.Target{CallRef: req.GetCallRef(), ParticipantRef: req.GetParticipantRef(), RoomRef: req.GetRoomRef()}
	if t == (node.Target{}) {
		return nil, invalid("a call_ref, participant_ref or room_ref is required")
	}
	if req.GetUrl() == "" {
		return nil, invalid("url is required")
	}
	ref, err := s.backend.Play(t, req.GetUrl())
	if err != nil {
		return nil, toStatus(err)
	}
	return &roomrv1.Operation{OperationRef: ref}, nil
}

// Record is not implemented yet: the node has no recorder (recording runs through listeners).
func (s *Service) Record(context.Context, *roomrv1.RecordRequest) (*roomrv1.Operation, error) {
	return nil, refusal(codes.Unimplemented, node.CodeNotSupported, "Record is not implemented yet; attach a listener with Join")
}

// SendDtmf sends RFC 4733 events on a SIP leg.
func (s *Service) SendDtmf(_ context.Context, req *roomrv1.SendDtmfRequest) (*roomrv1.Empty, error) {
	t := node.Target{CallRef: req.GetCallRef(), ParticipantRef: req.GetParticipantRef()}
	if t == (node.Target{}) {
		return nil, invalid("a call_ref or participant_ref is required")
	}
	if req.GetDigits() == "" {
		return nil, invalid("digits are required")
	}
	if err := s.backend.SendDTMF(t, req.GetDigits()); err != nil {
		return nil, toStatus(err)
	}
	return &roomrv1.Empty{}, nil
}

// Server is the gRPC server for Roomr.
type Server struct {
	grpc *grpc.Server
	lis  net.Listener
	log  *slog.Logger
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
	return &Server{grpc: g, lis: lis, log: log}, nil
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
