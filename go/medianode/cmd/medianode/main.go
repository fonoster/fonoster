// Command medianode runs one Fonoster media node: SIP legs from Routr become rooms, mixed and
// driven over media-control on NATS (add-media-node).
package main

import (
	"context"
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
	"github.com/fonoster/fonoster/go/medianode/internal/sipua"
	"github.com/nats-io/nats.go"
)

func env(name, def string) string {
	if v := os.Getenv(name); v != "" {
		return v
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
	registrar := flag.String("registrar", env("MEDIANODE_REGISTRAR", ""), "Routr host:port; empty disables REGISTER")
	domain := flag.String("domain", env("MEDIANODE_DOMAIN", ""), "registration domain")
	username := flag.String("username", env("MEDIANODE_USERNAME", "medianode"), "peer username at Routr")
	password := flag.String("password", env("MEDIANODE_PASSWORD", ""), "peer password at Routr")
	outbound := flag.String("outbound-proxy", env("MEDIANODE_OUTBOUND_PROXY", ""), "host:port outbound INVITEs go to (Routr); empty disables dial and transfers")
	transport := flag.String("transport", env("MEDIANODE_TRANSPORT", "udp"), "REGISTER transport (udp or tcp)")
	heartbeat := flag.Duration("heartbeat", 2*time.Second, "node.heartbeat period")
	debugAddr := flag.String("debug", env("MEDIANODE_DEBUG_ADDR", ""), "host:port for a debug HTTP endpoint (GET /rooms); empty disables it")
	drainWait := flag.Duration("drain-wait", 10*time.Minute, "longest wait for rooms to end on SIGTERM")
	flag.Parse()

	logger := slog.New(slog.NewJSONHandler(os.Stderr, nil)).With("nodeId", *nodeID)
	nc, err := nats.Connect(*natsURL, nats.Name("medianode-"+*nodeID))
	if err != nil {
		logger.Error("nats", "err", err)
		os.Exit(1)
	}
	defer nc.Close()

	n := node.New(nc, node.Config{NodeID: *nodeID, RTPHost: *rtpHost, AdvertiseHost: *rtpAdvertise,
		Heartbeat: *heartbeat, Logger: logger})
	_, portText, _ := net.SplitHostPort(*sipListen)
	port, _ := strconv.Atoi(portText)
	ua, err := sipua.New(n, sipua.Config{Listen: *sipListen, AdvertiseHost: *sipAdvertise, AdvertisePort: port,
		Registrar: *registrar, OutboundProxy: *outbound, Domain: *domain, Username: *username, Password: *password, Transport: *transport,
		Logger: logger})
	if err != nil {
		logger.Error("sip", "err", err)
		os.Exit(1)
	}
	defer ua.Close()
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
		go func() { _ = http.ListenAndServe(*debugAddr, mux) }()
	}
	fmt.Printf("medianode %s ready sip=%s\n", *nodeID, *sipListen)

	signals := make(chan os.Signal, 1)
	signal.Notify(signals, syscall.SIGTERM, syscall.SIGINT)
	<-signals
	// Drain: report full, keep existing rooms, exit when they end or the wait runs out (MN9).
	logger.Info("draining", "rooms", n.ActiveRooms())
	n.Drain()
	deadline := time.Now().Add(*drainWait)
	for n.ActiveRooms() > 0 && time.Now().Before(deadline) {
		select {
		case <-signals:
			deadline = time.Now()
		case <-time.After(500 * time.Millisecond):
		}
	}
	n.Shutdown()
}
