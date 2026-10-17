// Command medianode runs one Fonoster media node: SIP legs from Routr become rooms, mixed and
// driven over media-control on NATS (add-media-node).
package main

import (
	"bytes"
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"log/slog"
	"net"
	"net/http"
	"os"
	"os/signal"
	"sort"
	"strconv"
	"strings"
	"syscall"
	"time"

	"github.com/fonoster/fonoster/go/medianode/internal/edgetls"
	"github.com/fonoster/fonoster/go/medianode/internal/fileconfig"
	"github.com/fonoster/fonoster/go/medianode/internal/node"
	"github.com/fonoster/fonoster/go/medianode/internal/registry"
	"github.com/fonoster/fonoster/go/medianode/internal/rtpio"
	"github.com/fonoster/fonoster/go/medianode/internal/secretref"
	"github.com/fonoster/fonoster/go/medianode/internal/sipua"
	"github.com/fonoster/fonoster/go/medianode/internal/telemetry"
	"github.com/nats-io/nats.go"
)

// The helpers below give a flag its default: the config file's value, else def. Flags still win
// over both. The node reads no MEDIANODE_* variables (fix-config-and-placement-gaps); a value
// from the environment must be written in the file as a ${VAR} placeholder.

func or(file, def string) string {
	if file != "" {
		return file
	}
	return def
}

func orInt(file, def int) int {
	if file != 0 {
		return file
	}
	return def
}

func orDuration(file string, def time.Duration) time.Duration {
	if d, err := time.ParseDuration(file); err == nil {
		return d
	}
	return def
}

func orBool(file *bool, def bool) bool {
	if file != nil {
		return *file
	}
	return def
}

// ignoredEnv lists the MEDIANODE_* variables in environ that refs (the config file and the
// command line) reference neither as a ${VAR} placeholder nor as secret://env/VAR: values an older
// deployment still sets but the node no longer reads.
func ignoredEnv(environ []string, refs []byte) []string {
	var names []string
	for _, kv := range environ {
		name, _, _ := strings.Cut(kv, "=")
		if strings.HasPrefix(name, "MEDIANODE_") && !bytes.Contains(refs, []byte("${"+name)) &&
			!bytes.Contains(refs, []byte(secretref.Prefix+"env/"+name)) {
			names = append(names, name)
		}
	}
	sort.Strings(names)
	return names
}

// loadFile reads -config, else /config/medianode.yaml when it exists (unify-config-placeholders).
func loadFile() (*fileconfig.File, string) {
	path, explicit := fileconfig.PathFromArgs(os.Args[1:])
	if !explicit {
		path = fileconfig.DefaultPath
	}
	f, err := fileconfig.Load(path, explicit)
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(2)
	}
	if f == nil {
		return &fileconfig.File{}, ""
	}
	return f, path
}

func main() {
	hostname, _ := os.Hostname()
	fc, configPath := loadFile()
	flag.String("config", fileconfig.DefaultPath, "the config file (YAML or JSON; ${VAR} placeholders from the environment)")
	nodeID := flag.String("node-id", or(fc.NodeID, hostname), "node id used in media-control subjects")
	natsURL := flag.String("nats", or(fc.NATS.URL, nats.DefaultURL), "NATS URL")
	sipListen := flag.String("sip", or(fc.SIP.Listen, "0.0.0.0:5060"), "SIP listen address (UDP and TCP)")
	sipAdvertise := flag.String("sip-advertise", or(fc.SIP.Advertise, "127.0.0.1"), "host in Contact headers")
	rtpHost := flag.String("rtp", or(fc.RTP.Host, "0.0.0.0"), "address RTP sockets bind to")
	rtpAdvertise := flag.String("rtp-advertise", or(fc.RTP.Advertise, "127.0.0.1"), "address in SDP and rtp blocks")
	rtpMin := flag.Int("rtp-port-min", orInt(fc.RTP.PortMin, 0), "lowest RTP port (0 with -rtp-port-max 0: any port)")
	rtpMax := flag.Int("rtp-port-max", orInt(fc.RTP.PortMax, 0), "highest RTP port; publish exactly [min,max]/udp")
	registrar := flag.String("registrar", or(fc.Registration.Registrar, ""), "Routr host:port; empty disables REGISTER")
	domain := flag.String("domain", or(fc.Registration.Domain, ""), "registration domain")
	username := flag.String("username", or(fc.Registration.Username, "medianode"), "peer username at Routr")
	password := flag.String("password", or(fc.Registration.Password, ""), "peer password at Routr")
	outbound := flag.String("outbound-proxy", or(fc.OutboundProxy, ""), "host:port outbound INVITEs go to (Routr); empty disables dial and transfers")
	transport := flag.String("transport", or(fc.Registration.Transport, "udp"), "REGISTER transport (udp or tcp)")
	heartbeat := flag.Duration("heartbeat", 2*time.Second, "node.heartbeat period")
	registerEvery := flag.Duration("register-every", orDuration(fc.Registration.Every, 15*time.Second), "REGISTER interval (Expires is twice this); load changes of 5+ rooms re-register at once")
	debugAddr := flag.String("debug", or(fc.DebugAddr, ""), "host:port for a debug HTTP endpoint (GET /rooms); empty disables it")
	drainWait := flag.Duration("drain-wait", orDuration(fc.DrainWait, 10*time.Minute), "longest wait for rooms to end on SIGTERM")
	maxDuration := flag.Duration("max-duration", orDuration(fc.MaxDuration, 4*time.Hour), "longest call (ended with reason timeout); apps can lower it per call")
	maxParticipants := flag.Int("max-participants", orInt(fc.MaxParticipants, 10), "participants per room (room_full beyond it)")
	mediaTimeout := flag.Duration("media-timeout", orDuration(fc.MediaTimeout, 30*time.Second), "end an answered call with no caller RTP for this long")
	tlsListen := flag.String("tls", or(fc.TLS.Listen, ""), "SIP-over-TLS listen address; empty disables TLS")
	tlsCert := flag.String("tls-cert", or(fc.TLS.Cert, ""), "PEM certificate for the TLS listener")
	tlsKey := flag.String("tls-key", or(fc.TLS.Key, ""), "PEM key for the TLS listener")
	tlsCA := flag.String("tls-ca", or(fc.TLS.CA, ""), "PEM CA that signs the edge's certificate (dialing and registering over TLS)")
	tlsClientCA := flag.String("tls-client-ca", or(fc.TLS.ClientCA, ""), "PEM CA for mutual TLS: the TLS listener requires a client certificate it signed (the edge's); empty: no client certificates")
	sessionRegistry := flag.Bool("session-registry", orBool(fc.SessionRegistry, true), "write nodes.<id> and rooms.<ref> to the session registry (JetStream KV); off or unavailable keeps heartbeats only")
	natsUser := flag.String("nats-user", or(fc.NATS.User, ""), "NATS user (per-service users, add-platform 4.1); empty connects without one")
	natsPassword := flag.String("nats-password", or(fc.NATS.Password, ""), "NATS password (or a secret:// reference)")
	requireEnc := flag.Bool("require-encryption", orBool(fc.RequireEncryption, false), "SIP over TLS only and SRTP on every leg (MN6)")
	reregisterDelta := flag.Int("reregister-delta", 5, "re-register at once when the room count moves by this much")
	outboundTransport := flag.String("outbound-transport", or(fc.OutboundTransport, "udp"), "transport to the outbound proxy (udp, tcp, tls)")
	trustedSources := flag.String("trusted-sources", or(strings.Join(fc.TrustedSources, ","), ""), "comma-separated IPs, CIDRs or host names allowed to send INVITEs (the edge, Routr); empty accepts any source")
	flag.Parse()
	if *rtpMax != 0 {
		if *rtpMin <= 0 || *rtpMin > *rtpMax {
			fmt.Fprintln(os.Stderr, "invalid RTP port range")
			os.Exit(2)
		}
		rtpio.SetPortRange(*rtpMin, *rtpMax)
	}

	// OTLP: telemetry.otlpEndpoint in the file, else the standard OTEL_* variables; unset means
	// no-op (add-platform).
	if fc.Telemetry.OTLPEndpoint != "" {
		_ = os.Setenv("OTEL_EXPORTER_OTLP_ENDPOINT", fc.Telemetry.OTLPEndpoint)
	}
	shutdownOtel, otelLogs, err := telemetry.Setup(context.Background(), "fonoster-medianode", *nodeID)
	if err != nil {
		fmt.Fprintln(os.Stderr, "telemetry:", err)
		os.Exit(1)
	}
	defer func() { _ = shutdownOtel(context.Background()) }()
	logger := slog.New(telemetry.Tee(slog.NewJSONHandler(os.Stderr, nil), otelLogs)).With("nodeId", *nodeID)
	refs := []byte(strings.Join(os.Args[1:], " "))
	if configPath != "" {
		logger.Info("loaded config", "path", configPath)
		text, _ := os.ReadFile(configPath)
		refs = append(refs, text...)
	}
	if ignored := ignoredEnv(os.Environ(), refs); len(ignored) > 0 {
		// Names only, never values.
		logger.Warn("MEDIANODE_* variables are no longer read; set the values in "+fileconfig.DefaultPath+" or as flags", "variables", strings.Join(ignored, ","))
	}
	natsOpts := []nats.Option{nats.Name("medianode-" + *nodeID)}
	if *natsUser != "" {
		pass, err := secretref.Resolve(*natsPassword)
		if err != nil {
			logger.Error("nats password", "err", err)
			os.Exit(1)
		}
		natsOpts = append(natsOpts, nats.UserInfo(*natsUser, pass))
	}
	sipPassword, err := secretref.Resolve(*password)
	if err != nil {
		logger.Error("sip password", "err", err)
		os.Exit(1)
	}
	nc, err := nats.Connect(*natsURL, natsOpts...)
	if err != nil {
		logger.Error("nats", "err", err)
		os.Exit(1)
	}
	defer nc.Close()

	var reg node.Registry
	if *sessionRegistry {
		rctx, rcancel := context.WithTimeout(context.Background(), 5*time.Second)
		kv, err := registry.Open(rctx, nc, logger)
		rcancel()
		if err != nil {
			logger.Warn("session registry unavailable (is JetStream on?); heartbeats only", "err", err)
		} else {
			reg = kv
		}
	}
	n := node.New(nc, node.Config{Registry: reg, NodeID: *nodeID, RTPHost: *rtpHost, AdvertiseHost: *rtpAdvertise,
		Heartbeat: *heartbeat, MaxDuration: *maxDuration, MaxParticipants: *maxParticipants,
		MediaTimeout: *mediaTimeout, RequireEncryption: *requireEnc, Logger: logger,
		AllowedDestinations: allowedDestinations(fc)})
	// The PEM settings are file paths or secret:// references (edgetls, add-platform 4.2).
	edge, err := edgetls.Build(edgetls.Options{Cert: *tlsCert, Key: *tlsKey, CA: *tlsCA, ClientCA: *tlsClientCA})
	if err != nil {
		logger.Error("tls", "err", err)
		os.Exit(1)
	}
	if edge.Mutual {
		logger.Info("mutual TLS on the SIP listener: client certificates required", "listen", *tlsListen)
	}
	serverTLS, clientTLS := edge.Server, edge.Client
	_, portText, _ := net.SplitHostPort(*sipListen)
	port, _ := strconv.Atoi(portText)
	ua, err := sipua.New(n, sipua.Config{Listen: *sipListen, AdvertiseHost: *sipAdvertise, AdvertisePort: port,
		Registrar: *registrar, OutboundProxy: *outbound, Domain: *domain, Username: *username, Password: sipPassword, Transport: *transport,
		TLSListen: *tlsListen, TLSConfig: serverTLS, ClientTLS: clientTLS, RequireEncryption: *requireEnc,
		OutboundTransport: *outboundTransport, RegisterEvery: *registerEvery, ReregisterDelta: *reregisterDelta,
		TrustedSources: strings.Split(*trustedSources, ","), Logger: logger})
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
		// Bind before printing "ready", so a client that waits for it can reach the endpoint.
		debugListener, err := net.Listen("tcp", *debugAddr)
		if err != nil {
			logger.Error("debug listen", "addr", *debugAddr, "err", err)
			os.Exit(1)
		}
		go func() { _ = http.Serve(debugListener, mux) }()
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

// allowedDestinations: the file's list, else FONOSTER_ALLOWED_DESTINATIONS (comma-separated).
func allowedDestinations(fc *fileconfig.File) []string {
	if len(fc.AllowedDestinations) > 0 {
		return fc.AllowedDestinations
	}
	return strings.Split(os.Getenv("FONOSTER_ALLOWED_DESTINATIONS"), ",")
}
