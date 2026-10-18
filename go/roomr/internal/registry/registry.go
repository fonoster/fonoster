// Package registry writes the media node's entries in the session registry: a NATS JetStream KV
// bucket (add-platform 2.3, add-media-node 3.2, decision D3). Keys are `nodes.<nodeId>` and
// `rooms.<roomRef>` (the gateway writes `calls.` and `gateways.`). Entries are leases: the bucket
// keeps a value for TTL after its last write, so owners refresh them and a crashed owner's
// entries expire on their own. Writes go through one goroutine and never block the media path.
package registry

import (
	"context"
	"encoding/json"
	"errors"
	"log/slog"
	"regexp"
	"sync"
	"time"

	"github.com/nats-io/nats.go"
	"github.com/nats-io/nats.go/jetstream"
)

// Bucket is the session registry's KV bucket (the same in every service).
const Bucket = "fonoster_sessions"

// TTL is how long an entry lives after its last write (the bucket's max age). Owners refresh
// their entries well within it.
const TTL = 15 * time.Second

var unsafe = regexp.MustCompile(`[^-_=/.a-zA-Z0-9]`)

// Key builds `<kind>.<id>` with characters KV keys do not allow replaced by `_`.
func Key(kind, id string) string { return kind + "." + unsafe.ReplaceAllString(id, "_") }

type op struct {
	key  string
	data []byte // nil: delete
	done chan struct{}
}

// KV is the session registry seen by one writer.
type KV struct {
	kv   jetstream.KeyValue
	ops  chan op
	log  *slog.Logger
	once sync.Once
	wg   sync.WaitGroup
	mu   sync.Mutex
	// closed: writes after Close are ignored.
	closed bool
}

// Bind opens the bucket, creating it when it does not exist yet.
func Bind(ctx context.Context, nc *nats.Conn) (jetstream.KeyValue, error) {
	return BindBucket(ctx, nc, Bucket, TTL)
}

// BindBucket is Bind for another bucket name and TTL (tests).
func BindBucket(ctx context.Context, nc *nats.Conn, bucket string, ttl time.Duration) (jetstream.KeyValue, error) {
	js, err := jetstream.New(nc)
	if err != nil {
		return nil, err
	}
	kv, err := js.KeyValue(ctx, bucket)
	if errors.Is(err, jetstream.ErrBucketNotFound) {
		kv, err = js.CreateKeyValue(ctx, jetstream.KeyValueConfig{Bucket: bucket, History: 1, TTL: ttl,
			Description: "Fonoster session registry: nodes, rooms, calls, gateways (leases)"})
		if errors.Is(err, jetstream.ErrBucketExists) {
			kv, err = js.KeyValue(ctx, bucket)
		}
	}
	return kv, err
}

// Open binds the bucket and starts the writer.
func Open(ctx context.Context, nc *nats.Conn, log *slog.Logger) (*KV, error) {
	kv, err := Bind(ctx, nc)
	if err != nil {
		return nil, err
	}
	return NewWriter(kv, log), nil
}

// NewWriter starts a writer on a bound bucket.
func NewWriter(kv jetstream.KeyValue, log *slog.Logger) *KV {
	if log == nil {
		log = slog.Default()
	}
	r := &KV{kv: kv, ops: make(chan op, 1024), log: log}
	r.wg.Add(1)
	go r.run()
	return r
}

func (r *KV) run() {
	defer r.wg.Done()
	for o := range r.ops {
		if o.done != nil {
			close(o.done)
			continue
		}
		ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
		var err error
		if o.data == nil {
			err = r.kv.Delete(ctx, o.key)
		} else {
			_, err = r.kv.Put(ctx, o.key, o.data)
		}
		cancel()
		if err != nil {
			r.log.Warn("session registry write failed", "key", o.key, "err", err)
		}
	}
}

func (r *KV) enqueue(o op) {
	r.mu.Lock()
	defer r.mu.Unlock()
	if r.closed {
		return
	}
	select {
	case r.ops <- o:
	default:
		// The registry is behind (NATS slow or down); entries are refreshed later anyway.
		r.log.Warn("session registry queue full; write dropped", "key", o.key)
	}
}

// Put writes value as JSON under Key(kind, id) (asynchronously).
func (r *KV) Put(kind, id string, value any) {
	data, err := json.Marshal(value)
	if err != nil {
		return
	}
	r.enqueue(op{key: Key(kind, id), data: data})
}

// Delete removes Key(kind, id) (asynchronously).
func (r *KV) Delete(kind, id string) { r.enqueue(op{key: Key(kind, id)}) }

// Flush waits until every write queued so far is done (or the timeout passes).
func (r *KV) Flush(timeout time.Duration) {
	done := make(chan struct{})
	r.mu.Lock()
	if r.closed {
		r.mu.Unlock()
		return
	}
	select {
	case r.ops <- op{done: done}:
	case <-time.After(timeout):
		r.mu.Unlock()
		return
	}
	r.mu.Unlock()
	select {
	case <-done:
	case <-time.After(timeout):
	}
}

// Close flushes and stops the writer.
func (r *KV) Close() {
	r.once.Do(func() {
		r.Flush(2 * time.Second)
		r.mu.Lock()
		r.closed = true
		close(r.ops)
		r.mu.Unlock()
		r.wg.Wait()
	})
}
