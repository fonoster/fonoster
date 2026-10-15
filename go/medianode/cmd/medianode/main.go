// Command medianode runs one Fonoster media node: SIP legs from Routr become rooms, mixed and
// driven over media-control on NATS (add-media-node).
package main

import (
	"context"
	"crypto/tls"
	"crypto/x509"
	"encoding/json"
	"flag"
	"fmt"
	"log/slog"
	"net"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"syscall"
	"time"

	"github.com/fonoster/fonoster/go/medianode/internal/node"
	"github.com/fonoster/fonoster/go/medianode/internal/rtpio"
	"github.com/fonoster/fonoster/go/medianode/internal/sipua"
	"github.com/fonoster/fonoster/go/medianode/internal/telemetry"
	"github.com/nats-io/nats.go"
)

func env(name, def string) string {
	if v := os.Getenv(name); v != "" {
		return v
	}
	return def
}

func envInt(name string, def int) int {
	if v, err := strconv.Atoi(os.Getenv(name)); err == nil {
		return v
	}
	return def
}

func envDuration(name string, def time.Duration) time.Duration {
	if d, err := time.ParseDuration(os.Getenv(name)); err == nil {
		return d
	}
	return def
}

func main() {
	hostname, _ := os.Hostname()
	nodeID := flag.String("node-id", env("MEDIANODE_ID", hostname), "node id used in media-control subjects")
	natsURL := flag.String("nats", env("MEDIANODE_NATS_URL", nats.DefaultURL), "NATS URL")
	sipListen := flag.String("sip", env("MEDIANODE_SIP_LISTEN", "0.0.0.0:5060"), "SIP listen address (UDP and TCP)")
	sipAdvertise := flag.String("sip-advertise", env("MEDIANODE_SIP_ADVERTISE", "127.0.0.1"), "host in Contact headers")
	rtpHost := flag.String("rtp", env("MEDIANODE_RTP_HOST", "0.0.0.0"), "address RTP sockets bind to")
	rtpAdvertise := flag.String("rtp-advertise", env("MEDIANODE_RTP_ADVERTISE", "127.0.0.1"), "address in SDP and rtp blocks")
	rtpMin := flag.Int("rtp-port-min", envInt("MEDIANODE_RTP_PORT_MIN", 0), "lowest RTP port (0 with -rtp-port-max 0: any port)")
	rtpMax := flag.Int("rtp-port-max", envInt("MEDIANODE_RTP_PORT_MAX", 0), "highest RTP port; publish exactly [min,max]/udp")
	registrar := flag.String("registrar", env("MEDIANODE_REGISTRAR", ""), "Routr host:port; empty disables REGISTER")
	domain := flag.String("domain", env("MEDIANODE_DOMAIN", ""), "registration domain")
	username := flag.String("username", env("MEDIANODE_USERNAME", "medianode"), "peer username at Routr")
	password := flag.String("password", env("MEDIANODE_PASSWORD", ""), "peer password at Routr")
	outbound := flag.String("outbound-proxy", env("MEDIANODE_OUTBOUND_PROXY", ""), "host:port outbound INVITEs go to (Routr); empty disables dial and transfers")
	transport := flag.String("transport", env("MEDIANODE_TRANSPORT", "udp"), "REGISTER transport (udp or tcp)")
	heartbeat := flag.Duration("heartbeat", 2*time.Second, "node.heartbeat period")
	registerEvery := flag.Duration("register-every", envDuration("MEDIANODE_REGISTER_EVERY", 15*time.Second), "REGISTER interval (Expires is twice this); load changes of 5+ rooms re-register at once")
	debugAddr := flag.String("debug", env("MEDIANODE_DEBUG_ADDR", ""), "host:port for a debug HTTP endpoint (GET /rooms); empty disables it")
	drainWait := flag.Duration("drain-wait", envDuration("MEDIANODE_DRAIN_WAIT", 10*time.Minute), "longest wait for rooms to end on SIGTERM")
	maxDuration := flag.Duration("max-duration", envDuration("MEDIANODE_MAX_DURATION", 4*time.Hour), "longest call (ended with reason timeout); apps can lower it per call")
	maxParticipants := flag.Int("max-participants", envInt("MEDIANODE_MAX_PARTICIPANTS", 10), "participants per room (room_full beyond it)")
	mediaTimeout := flag.Duration("media-timeout", envDuration("MEDIANODE_MEDIA_TIMEOUT", 30*time.Second), "end an answered call with no caller RTP for this long")
	tlsListen := flag.String("tls", env("MEDIANODE_TLS_LISTEN", ""), "SIP-over-TLS listen address; empty disables TLS")
	tlsCert := flag.String("tls-cert", env("MEDIANODE_TLS_CERT", ""), "PEM certificate for the TLS listener")
	tlsKey := flag.String("tls-key", env("MEDIANODE_TLS_KEY", ""), "PEM key for the TLS listener")
	tlsCA := flag.String("tls-ca", env("MEDIANODE_TLS_CA", ""), "PEM CA that signs the edge's certificate (dialing and registering over TLS)")
	requireEnc := flag.Bool("require-encryption", env("MEDIANODE_REQUIRE_ENCRYPTION", "") == "true", "SIP over TLS only and SRTP on every leg (MN6)")
	reregisterDelta := flag.Int("reregister-delta", 5, "re-register at once when the room count moves by this much")
	outboundTransport := flag.String("outbound-transport", env("MEDIANODE_OUTBOUND_TRANSPORT", "udp"), "transport to the outbound proxy (udp, tcp, tls)")
	flag.Parse()
	if *rtpMax != 0 {
		if *rtpMin <= 0 || *rtpMin > *rtpMax {
			fmt.Fprintln(os.Stderr, "invalid RTP port range")
			os.Exit(2)
		}
		rtpio.SetPortRange(*rtpMin, *rtpMax)
	}

	// OTLP is configured with the standard OTEL_* variables; unset means no-op (add-platform).
	shutdownOtel, otelLogs, err := telemetry.Setup(context.Background(), "fonoster-medianode", *nodeID)
	if err != nil {
		fmt.Fprintln(os.Stderr, "telemetry:", err)
		os.Exit(1)
	}
	defer func() { _ = shutdownOtel(context.Background()) }()
	logger := slog.New(telemetry.Tee(slog.NewJSONHandler(os.Stderr, nil), otelLogs)).With("nodeId", *nodeID)
	nc, err := nats.Connect(*natsURL, nats.Name("medianode-"+*nodeID))
	if err != nil {
		logger.Error("nats", "err", err)
		os.Exit(1)
	}
	defer nc.Close()

	n := node.New(nc, node.Config{NodeID: *nodeID, RTPHost: *rtpHost, AdvertiseHost: *rtpAdvertise,
		Heartbeat: *heartbeat, MaxDuration: *maxDuration, MaxParticipants: *maxParticipants,
		MediaTimeout: *mediaTimeout, RequireEncryption: *requireEnc, Logger: logger})
	var serverTLS, clientTLS *tls.Config
	if *tlsCert != "" {
		cert, err := tls.LoadX509KeyPair(*tlsCert, *tlsKey)
		if err != nil {
			logger.Error("tls certificate", "err", err)
			os.Exit(1)
		}
		serverTLS = &tls.Config{Certificates: []tls.Certificate{cert}, MinVersion: tls.VersionTLS12}
	}
	if *tlsCA != "" {
		pem, err := os.ReadFile(*tlsCA)
		if err != nil {
			logger.Error("tls ca", "err", err)
			os.Exit(1)
		}
		pool := x509.NewCertPool()
		pool.AppendCertsFromPEM(pem)
		clientTLS = &tls.Config{RootCAs: pool, MinVersion: tls.VersionTLS12}
	}
	_, portText, _ := net.SplitHostPort(*sipListen)
	port, _ := strconv.Atoi(portText)
	ua, err := sipua.New(n, sipua.Config{Listen: *sipListen, AdvertiseHost: *sipAdvertise, AdvertisePort: port,
		Registrar: *registrar, OutboundProxy: *outbound, Domain: *domain, Username: *username, Password: *password, Transport: *transport,
		TLSListen: *tlsListen, TLSConfig: serverTLS, ClientTLS: clientTLS, RequireEncryption: *requireEnc,
		OutboundTransport: *outboundTransport, RegisterEvery: *registerEvery, ReregisterDelta: *reregisterDelta,
		Logger: logger})
	if err != nil {
		logger.Error("sip", "err", err)
		os.Exit(1)
	}
	if m, err := telemetry.RegisterNode(*nodeID, n.ActiveRooms, n.Draining); err == nil {
		telemetry.SetMeters(m)
	}
	if err := n.Start(); err != nil {
		logger.Error("media-control", "err", err)
		os.Exit(1)
	}

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	go func() {
		if err := ua.Serve(ctx); err != nil {
			logger.Error("sip serve", "err", err)
			os.Exit(1)
		}
	}()
	if *debugAddr != "" {
		// Diagnostics for tests and operators; never part of media-control.
		mux := http.NewServeMux()
		mux.HandleFunc("GET /rooms", func(w http.ResponseWriter, _ *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			_ = json.NewEncoder(w).Encode(n.Rooms())
		})
		mux.HandleFunc("GET /stats", func(w http.ResponseWriter, _ *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			_ = json.NewEncoder(w).Encode(n.Stats())
		})
		go func() { _ = http.ListenAndServe(*debugAddr, mux) }()
	}
	fmt.Printf("medianode %s ready sip=%s\n", *nodeID, *sipListen)

	signals := make(chan os.Signal, 1)
	signal.Notify(signals, syscall.SIGTERM, syscall.SIGINT)
	<-signals
	// Drain: report full, keep existing rooms, exit when they end or the wait runs out (MN9). A
	// second signal stops waiting.
	logger.Info("draining", "rooms", n.ActiveRooms())
	stop := make(chan struct{})
	go func() {
		<-signals
		close(stop)
	}()
	// Drain also re-registers at once (OnDrain → Kick), so Routr learns "full" now.
	if forced := n.DrainAndWait(*drainWait, stop); forced > 0 {
		logger.Warn("drain wait over; ended rooms", "rooms", forced)
	}
	cancel() // stops the REGISTER timer; the UDP socket still serves the reply
	uctx, ucancel := context.WithTimeout(context.Background(), 2*time.Second)
	if err := ua.Unregister(uctx); err != nil {
		logger.Warn("unregister failed", "err", err)
	}
	ucancel()
	n.Shutdown()
	ua.Close()
}
