package registry

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"testing"
	"time"

	"github.com/nats-io/nats.go"
	"github.com/nats-io/nats.go/jetstream"
)

// jsConn connects to a NATS server with JetStream (CONFORMANCE_JETSTREAM_URL, else
// CONFORMANCE_NATS_URL) or skips.
func jsConn(t *testing.T) *nats.Conn {
	url := os.Getenv("CONFORMANCE_JETSTREAM_URL")
	if url == "" {
		url = os.Getenv("CONFORMANCE_NATS_URL")
	}
	if url == "" {
		t.Skip("set CONFORMANCE_JETSTREAM_URL (a NATS server with JetStream) to run")
	}
	nc, err := nats.Connect(url)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(nc.Close)
	js, _ := jetstream.New(nc)
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()
	if _, err := js.AccountInfo(ctx); err != nil {
		t.Skipf("no JetStream on %s: %v", url, err)
	}
	return nc
}

func TestKeySanitizes(t *testing.T) {
	if got := Key("rooms", "room-a b*c>d"); got != "rooms.room-a_b_c_d" {
		t.Fatalf("Key = %q", got)
	}
}

func TestWriterPutsDeletesAndEntriesExpire(t *testing.T) {
	nc := jsConn(t)
	bucket := fmt.Sprintf("test_sessions_%d", time.Now().UnixNano())
	ctx := context.Background()
	kv, err := BindBucket(ctx, nc, bucket, time.Second)
	if err != nil {
		t.Fatal(err)
	}
	js, _ := jetstream.New(nc)
	t.Cleanup(func() { _ = js.DeleteKeyValue(context.Background(), bucket) })
	// A second bind of the same bucket (another node starting) succeeds.
	if _, err := BindBucket(ctx, nc, bucket, time.Second); err != nil {
		t.Fatal(err)
	}
	w := NewWriter(kv, nil)
	w.Put("nodes", "n1", map[string]any{"nodeId": "n1", "rooms": 3})
	w.Put("rooms", "r1", map[string]any{"roomRef": "r1", "nodeId": "n1"})
	w.Flush(time.Second)
	e, err := kv.Get(ctx, "nodes.n1")
	if err != nil {
		t.Fatal(err)
	}
	var v map[string]any
	_ = json.Unmarshal(e.Value(), &v)
	if v["rooms"] != float64(3) {
		t.Fatalf("nodes.n1 = %v", v)
	}
	w.Delete("rooms", "r1")
	w.Flush(time.Second)
	if _, err := kv.Get(ctx, "rooms.r1"); !errors.Is(err, jetstream.ErrKeyNotFound) {
		t.Fatalf("rooms.r1 after delete: %v", err)
	}
	// Not refreshed: the lease runs out.
	deadline := time.Now().Add(5 * time.Second)
	for {
		if _, err := kv.Get(ctx, "nodes.n1"); errors.Is(err, jetstream.ErrKeyNotFound) {
			break
		}
		if time.Now().After(deadline) {
			t.Fatal("nodes.n1 never expired")
		}
		time.Sleep(200 * time.Millisecond)
	}
	w.Close()
	w.Put("nodes", "n1", map[string]any{}) // ignored after Close, no panic
}
