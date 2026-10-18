package e2e

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"testing"
	"time"

	"github.com/fonoster/fonoster/go/roomr/internal/node"
	"github.com/fonoster/fonoster/go/roomr/internal/registry"
	"github.com/nats-io/nats.go"
	"github.com/nats-io/nats.go/jetstream"
)

// The node's session-registry entries (add-media-node 3.2): nodes.<id> from the heartbeat,
// rooms.<ref> while the room lives, both gone after a clean shutdown. Needs JetStream:
// CONFORMANCE_JETSTREAM_URL (or a CONFORMANCE_NATS_URL server with JetStream).
func TestNodeWritesTheSessionRegistry(t *testing.T) {
	url := os.Getenv("CONFORMANCE_JETSTREAM_URL")
	if url == "" {
		url = os.Getenv("CONFORMANCE_NATS_URL")
	}
	if url == "" {
		t.Skip("set CONFORMANCE_JETSTREAM_URL to run")
	}
	nc, err := nats.Connect(url)
	if err != nil {
		t.Fatal(err)
	}
	defer nc.Close()
	ctx := context.Background()
	js, _ := jetstream.New(nc)
	if _, err := js.AccountInfo(ctx); err != nil {
		t.Skipf("no JetStream: %v", err)
	}
	w, err := registry.Open(ctx, nc, nil)
	if err != nil {
		t.Fatal(err)
	}
	kv, _ := registry.Bind(ctx, nc)
	id := fmt.Sprintf("reg-%d", time.Now().UnixNano())
	n := node.New(nc, node.Config{NodeID: id, Heartbeat: 100 * time.Millisecond, Registry: w, RoomRefresh: 200 * time.Millisecond})
	if err := n.Start(); err != nil {
		t.Fatal(err)
	}
	get := func(key string) (map[string]any, error) {
		e, err := kv.Get(ctx, key)
		if err != nil {
			return nil, err
		}
		var v map[string]any
		return v, json.Unmarshal(e.Value(), &v)
	}
	waitFor := func(what string, ok func() bool) {
		deadline := time.Now().Add(3 * time.Second)
		for !ok() {
			if time.Now().After(deadline) {
				t.Fatalf("timed out waiting for %s", what)
			}
			time.Sleep(50 * time.Millisecond)
		}
	}
	msg, err := nc.Request("media."+id+".commands", []byte(`{"type":"room.create","id":"c1"}`), 2*time.Second)
	if err != nil {
		t.Fatal(err)
	}
	var reply map[string]any
	_ = json.Unmarshal(msg.Data, &reply)
	room, _ := reply["roomRef"].(string)
	waitFor("room entry", func() bool {
		v, err := get(registry.Key("rooms", room))
		return err == nil && v["nodeId"] == id
	})
	waitFor("node entry with one room", func() bool {
		v, err := get(registry.Key("nodes", id))
		return err == nil && v["rooms"] == float64(1) && v["draining"] == false
	})
	if _, err := nc.Request("media."+id+".commands", []byte(`{"type":"room.end","id":"c2","roomRef":"`+room+`"}`), 2*time.Second); err != nil {
		t.Fatal(err)
	}
	waitFor("room entry removed", func() bool {
		_, err := get(registry.Key("rooms", room))
		return errors.Is(err, jetstream.ErrKeyNotFound)
	})
	n.Drain()
	waitFor("draining node entry", func() bool {
		v, err := get(registry.Key("nodes", id))
		return err == nil && v["draining"] == true
	})
	n.Shutdown()
	if _, err := get(registry.Key("nodes", id)); !errors.Is(err, jetstream.ErrKeyNotFound) {
		t.Fatalf("node entry after shutdown: %v", err)
	}
}
