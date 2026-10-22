package e2e

import (
	"bufio"
	"context"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"syscall"
	"testing"
	"time"

	"github.com/fonoster/fonoster/go/roomr/internal/caller"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	healthpb "google.golang.org/grpc/health/grpc_health_v1"
)

// TestROM032_SIGTERMDrainsTheRealBinary runs the roomr binary from a config file alone (-config is its
// only flag) and checks the rollout model: on SIGTERM the health service turns NOT_SERVING, the
// registration is removed (REGISTER Expires 0), the heartbeats stop with node.down, the live
// room keeps running, and the process exits once the room has ended.
func TestROM032_SIGTERMDrainsTheRealBinary(t *testing.T) {
	url := os.Getenv("CONFORMANCE_NATS_URL")
	if url == "" {
		t.Skip("set CONFORMANCE_NATS_URL to run")
	}
	dir := t.TempDir()
	bin := filepath.Join(dir, "roomr")
	if out, err := exec.Command("go", "build", "-o", bin, "../cmd/roomr").CombinedOutput(); err != nil {
		t.Fatalf("go build: %v\n%s", err, out)
	}
	nodeID := fmt.Sprintf("drain-%d", time.Now().UnixNano())
	sipPort, grpcPort := freePort(t), freePort(t)
	reg := startRegistrar(t, "", "")
	app := startApp(t) // answers every call, so the room stays up
	cfg := fmt.Sprintf(`
nodeId: %s
nats: { url: "%s" }
sip:
  listen: 127.0.0.1:%d
  advertise: 127.0.0.1
  registrations:
    - registrar: %s
      expires: 2s
      headers: { X-Session-Count: "{sessions}" }
rtp: { host: 127.0.0.1, advertise: 127.0.0.1 }
control: { grpc: { listen: "127.0.0.1:%d" } }
sessionEndpoint: "%s"
heartbeatInterval: 200ms
drainWait: 30s
`, nodeID, url, sipPort, reg.addr, grpcPort, app.addr)
	cfgPath := filepath.Join(dir, "roomr.yaml")
	if err := os.WriteFile(cfgPath, []byte(cfg), 0o600); err != nil {
		t.Fatal(err)
	}

	cmd := exec.Command(bin, "-config", cfgPath)
	stdout, _ := cmd.StdoutPipe()
	cmd.Stderr = os.Stderr
	if err := cmd.Start(); err != nil {
		t.Fatal(err)
	}
	exited := make(chan error, 1)
	go func() { exited <- cmd.Wait() }()
	t.Cleanup(func() { _ = cmd.Process.Kill() })
	ready := make(chan struct{})
	go func() {
		sc := bufio.NewScanner(stdout)
		for sc.Scan() {
			if strings.Contains(sc.Text(), " ready ") {
				close(ready)
				break
			}
		}
		for sc.Scan() {
		}
	}()
	select {
	case <-ready:
	case err := <-exited:
		t.Fatalf("roomr exited before it was ready: %v", err)
	case <-time.After(20 * time.Second):
		t.Fatal("roomr was not ready")
	}

	beats := replica(t, "roomr.nodes."+nodeID+".heartbeat")

	conn, err := grpc.NewClient(fmt.Sprintf("127.0.0.1:%d", grpcPort), grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		t.Fatal(err)
	}
	defer conn.Close()
	health := healthpb.NewHealthClient(conn)
	check := func() (healthpb.HealthCheckResponse_ServingStatus, error) {
		ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
		defer cancel()
		res, err := health.Check(ctx, &healthpb.HealthCheckRequest{})
		if err != nil {
			return 0, err
		}
		return res.Status, nil
	}
	if st, err := check(); err != nil || st != healthpb.HealthCheckResponse_SERVING {
		t.Fatalf("health before the drain = %v, %v", st, err)
	}

	bot, err := caller.NewWithOptions(caller.Options{Host: "127.0.0.1"})
	if err != nil {
		t.Fatal(err)
	}
	defer bot.Close()
	call, err := bot.Dial(fmt.Sprintf("127.0.0.1:%d", sipPort), "+15550009999", "", nil)
	if err != nil {
		t.Fatal(err)
	}
	app.callTo("+15550009999")
	waitRooms := func(want float64) {
		t.Helper()
		deadline := time.After(5 * time.Second)
		for {
			select {
			case ev := <-beats:
				if ev["type"] == "node.heartbeat" && ev["rooms"] == want {
					return
				}
			case <-deadline:
				t.Fatalf("heartbeat never reported %v rooms", want)
			}
		}
	}
	waitRooms(1)

	if err := cmd.Process.Signal(syscall.SIGTERM); err != nil {
		t.Fatal(err)
	}
	// Health turns NOT_SERVING.
	deadline := time.Now().Add(3 * time.Second)
	for {
		st, err := check()
		if err == nil && st == healthpb.HealthCheckResponse_NOT_SERVING {
			break
		}
		if time.Now().After(deadline) {
			t.Fatalf("health after SIGTERM = %v, %v; want NOT_SERVING", st, err)
		}
		time.Sleep(50 * time.Millisecond)
	}
	// node.down is published and no heartbeat follows it.
	down := time.After(3 * time.Second)
	for seen := false; !seen; {
		select {
		case ev := <-beats:
			seen = ev["type"] == "node.down" && ev["node_ref"] == nodeID
		case <-down:
			t.Fatal("no node.down after SIGTERM")
		}
	}
	select {
	case ev := <-beats:
		t.Fatalf("a heartbeat after node.down: %v", ev)
	case <-time.After(800 * time.Millisecond):
	}
	// The registration is removed.
	removed := false
	for _, r := range reg.snapshot() {
		if r.expires == "0" {
			removed = true
		}
	}
	if !removed {
		t.Fatalf("no REGISTER with Expires 0: %+v", reg.snapshot())
	}
	// The live room keeps the process up.
	select {
	case err := <-exited:
		t.Fatalf("roomr exited with a live room: %v", err)
	case <-time.After(1500 * time.Millisecond):
	}
	// The room ends; the process exits cleanly.
	_ = call.Hangup()
	select {
	case err := <-exited:
		if err != nil {
			t.Fatalf("roomr exit: %v", err)
		}
	case <-time.After(10 * time.Second):
		t.Fatal("roomr did not exit after the last room ended")
	}
}
