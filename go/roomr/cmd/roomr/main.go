// Command roomr runs one Fonoster media node: SIP legs from the SIP proxy become rooms, mixed and
// driven over media-control on NATS (add-media-node) and Roomr on gRPC (redesign-media-node).
// Its only flag is -config <path>; everything else is in the config file (fileconfig).
package main

import (
	"context"
	"flag"
	"fmt"
	"log/slog"
	"net"
	"os"
	"os/signal"
	"strconv"
	"strings"
	"syscall"
	"time"

	"github.com/fonoster/fonoster/go/roomr/internal/audio"
	"github.com/fonoster/fonoster/go/roomr/internal/control"
	"github.com/fonoster/fonoster/go/roomr/internal/edgetls"
	"github.com/fonoster/fonoster/go/roomr/internal/fileconfig"
	"github.com/fonoster/fonoster/go/roomr/internal/node"
	"github.com/fonoster/fonoster/go/roomr/internal/rtpio"
	"github.com/fonoster/fonoster/go/roomr/internal/secretref"
	"github.com/fonoster/fonoster/go/roomr/internal/sipua"
	"github.com/fonoster/fonoster/go/roomr/internal/telemetry"
	"github.com/nats-io/nats.go"
)

// version is the build's version (-ldflags "-X main.version=..."), reported in heartbeats.
var version = "dev"

// advertised is listen's port on host ("" when listen is empty or has no port).
func advertised(listen, host string) string {
	_, port, err := net.SplitHostPort(listen)
	if listen == "" || err != nil || port == "" {
		return ""
	}
	return net.JoinHostPort(host, port)
}

// loadFile reads -config, else /config/roomr.yaml when it exists (unify-config-placeholders).
func loadFile() (*fileconfig.File, string) {
	path := flag.String("config", "", "the config file (YAML or JSON; ${VAR} placeholders from the environment); default "+fileconfig.DefaultPath+" when it exists")
	flag.Parse()
	explicit := *path != ""
	if !explicit {
		*path = fileconfig.DefaultPath
	}
	f, err := fileconfig.Load(*path, explicit)
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(2)
	}
	if f == nil {
		f = &fileconfig.File{}
		f.Defaults()
		return f, ""
	}
	return f, *path
}

func main() {
	fc, configPath := loadFile()
	nodeID := fc.NodeID
	if nodeID == "" {
		nodeID, _ = os.Hostname()
	}
	natsURL := fc.NATS.URL
	if natsURL == "" {
		natsURL = nats.DefaultURL
	}
	if fc.RTP.PortMax != 0 {
		if fc.RTP.PortMin <= 0 || fc.RTP.PortMin > fc.RTP.PortMax {
			fmt.Fprintln(os.Stderr, "invalid RTP port range")
			os.Exit(2)
		}
		rtpio.SetPortRange(fc.RTP.PortMin, fc.RTP.PortMax)
	}

	// OTLP traces and metrics: telemetry.otlpEndpoint in the file, else the standard OTEL_*
	// variables; unset means no-op (add-platform). Logs go to stderr only.
	if fc.Telemetry.OTLPEndpoint != "" {
		_ = os.Setenv("OTEL_EXPORTER_OTLP_ENDPOINT", fc.Telemetry.OTLPEndpoint)
	}
	shutdownOtel, err := telemetry.Setup(context.Background(), "fonoster-roomr", nodeID)
	if err != nil {
		fmt.Fprintln(os.Stderr, "telemetry:", err)
		os.Exit(1)
	}
	defer func() { _ = shutdownOtel(context.Background()) }()
	logger := slog.New(slog.NewJSONHandler(os.Stderr, nil)).With("nodeId", nodeID)
	codecs, err := audio.ParseCodecList(fc.Codecs)
	if err != nil {
		logger.Error("codecs", "err", err)
		os.Exit(1)
	}
	logger.Info("sip codecs", "offer", strings.Join(codecs, ","), "opus", audio.OpusAvailable)
	if configPath != "" {
		logger.Info("loaded config", "path", configPath)
	}
	natsOpts := []nats.Option{nats.Name("roomr-" + nodeID)}
	if fc.NATS.User != "" {
		pass, err := secretref.Resolve(fc.NATS.Password)
		if err != nil {
			logger.Error("nats password", "err", err)
			os.Exit(1)
		}
		// Replies arrive under the user's own inbox prefix, the only inbox its NATS permissions
		// let it read (nats-permissions/roomr.conf): no service reads another's replies.
		natsOpts = append(natsOpts, nats.UserInfo(fc.NATS.User, pass), nats.CustomInboxPrefix(natsInboxPrefix(fc.NATS.User)))
	}
	registrations, err := buildRegistrations(fc)
	if err != nil {
		logger.Error("sip", "err", err)
		os.Exit(1)
	}
	nc, err := nats.Connect(natsURL, natsOpts...)
	if err != nil {
		logger.Error("nats", "err", err)
		os.Exit(1)
	}
	defer nc.Close()

	grpcListen := fc.Control.GRPC.Listen
	n := node.New(nc, node.Config{NodeID: nodeID, RTPHost: fc.RTP.Host, AdvertiseHost: fc.RTP.Advertise,
		Heartbeat: time.Duration(fc.HeartbeatInterval), MaxDuration: time.Duration(fc.MaxDuration),
		MaxParticipants: fc.MaxParticipants, MaxRooms: fc.MaxRooms,
		MediaTimeout: time.Duration(fc.MediaTimeout), Logger: logger,
		EmptyRoomTimeout: time.Duration(fc.EmptyRoomTimeout), OwnerTimeout: time.Duration(fc.OwnerTimeout),
		Codecs: codecs, CallRefHeader: fc.SIP.CallRefHeader,
		Version: version, Region: fc.Region, RTPPorts: [2]int{fc.RTP.PortMin, fc.RTP.PortMax},
		SIPAddr:     advertised(fc.SIP.Listen, fc.SIP.Advertise),
		ControlAddr: orControlAddr(fc.Control.GRPC.Advertise, advertised(grpcListen, fc.SIP.Advertise))})
	// The PEM settings are file paths or secret:// references (edgetls, add-platform 4.2).
	edge, err := edgetls.Build(edgetls.Options{Cert: fc.TLS.Cert, Key: fc.TLS.Key, CA: fc.TLS.CA})
	if err != nil {
		logger.Error("tls", "err", err)
		os.Exit(1)
	}
	_, portText, _ := net.SplitHostPort(fc.SIP.Listen)
	port, _ := strconv.Atoi(portText)
	ua, err := sipua.New(n, sipua.Config{Listen: fc.SIP.Listen, AdvertiseHost: fc.SIP.Advertise, AdvertisePort: port,
		Registrations: registrations, OnRegistrationState: registrationStatePublisher(nc, nodeID, logger),
		ReregisterDelta: fc.ReregisterDelta, OutboundProxy: fc.OutboundProxy, TLSListen: fc.TLS.Listen,
		TLSConfig: edge.Server, ClientTLS: edge.Client, Logger: logger})
	if err != nil {
		logger.Error("sip", "err", err)
		os.Exit(1)
	}
	if m, err := telemetry.RegisterNode(nodeID, n.ActiveRooms); err == nil {
		telemetry.SetMeters(m)
	}
	if err := n.Start(); err != nil {
		logger.Error("media-control", "err", err)
		os.Exit(1)
	}

	var roomrServer *control.Server
	if grpcListen != "" {
		// Same PEM rules as the SIP listener (edgetls: file paths or secret:// references).
		t := fc.Control.GRPC.TLS
		grpcTLS, err := edgetls.Build(edgetls.Options{Cert: t.Cert, Key: t.Key, ClientCA: t.ClientCA})
		if err != nil {
			logger.Error("media-control grpc tls", "err", err)
			os.Exit(1)
		}
		roomrServer, err = control.Listen(grpcListen, n, grpcTLS.Server, logger)
		if err != nil {
			logger.Error("media-control grpc listen", "addr", grpcListen, "err", err)
			os.Exit(1)
		}
		logger.Info("media-control grpc", "addr", roomrServer.Addr(), "tls", grpcTLS.Server != nil, "mutual", grpcTLS.Mutual)
		go func() {
			if err := roomrServer.Serve(); err != nil {
				logger.Error("media-control grpc serve", "err", err)
			}
		}()
	}

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	go func() {
		if err := ua.Serve(ctx); err != nil {
			logger.Error("sip serve", "err", err)
			os.Exit(1)
		}
	}()
	fmt.Printf("roomr %s ready sip=%s\n", nodeID, fc.SIP.Listen)

	signals := make(chan os.Signal, 1)
	signal.Notify(signals, syscall.SIGTERM, syscall.SIGINT)
	<-signals
	// Drain (the rollout model): the node does not refuse anything; it stops being chosen. Health
	// goes NOT_SERVING (readiness), the registrations are removed (Expires 0), the heartbeats
	// stop with node.down, and live rooms run until they end or drainWait passes. A second
	// signal stops waiting.
	logger.Info("draining", "rooms", n.ActiveRooms())
	stop := make(chan struct{})
	go func() {
		<-signals
		close(stop)
	}()
	if roomrServer != nil {
		roomrServer.NotServing()
	}
	uctx, ucancel := context.WithTimeout(context.Background(), 2*time.Second)
	if err := ua.Unregister(uctx); err != nil {
		logger.Warn("unregister failed", "err", err)
	}
	ucancel()
	n.Down()
	if forced := n.WaitRooms(time.Duration(fc.DrainWait), stop); forced > 0 {
		logger.Warn("drain wait over; ended rooms", "rooms", forced)
	}
	cancel()
	if roomrServer != nil {
		roomrServer.Stop()
	}
	n.Shutdown()
	ua.Close()
}

func orControlAddr(advertise, fallback string) string {
	if advertise != "" {
		return advertise
	}
	return fallback
}

// natsInboxPrefix is the inbox prefix of a NATS user, `_INBOX_<user>` (the JS services' too:
// mods/common natsInboxPrefix).
func natsInboxPrefix(user string) string {
	return "_INBOX_" + user
}
