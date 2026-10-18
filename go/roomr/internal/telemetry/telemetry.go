// Package telemetry wires OpenTelemetry traces, metrics and logs for the media node
// (add-platform observability). It is driven by the standard OTEL_* environment variables and is
// a complete no-op when no OTLP endpoint is configured: the node then serves normally and only
// writes JSON logs to standard error.
package telemetry

import (
	"context"
	"errors"
	"log/slog"
	"os"
	"time"

	"go.opentelemetry.io/contrib/bridges/otelslog"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/exporters/otlp/otlplog/otlploghttp"
	"go.opentelemetry.io/otel/exporters/otlp/otlpmetric/otlpmetrichttp"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracehttp"
	"go.opentelemetry.io/otel/metric"
	"go.opentelemetry.io/otel/propagation"
	sdklog "go.opentelemetry.io/otel/sdk/log"
	sdkmetric "go.opentelemetry.io/otel/sdk/metric"
	"go.opentelemetry.io/otel/sdk/resource"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	"go.opentelemetry.io/otel/trace"
)

// CallRefKey is the attribute every call-scoped span, log record and metric carries.
const CallRefKey = "fonoster.call_ref"

const scope = "github.com/fonoster/fonoster/go/roomr"

// Enabled reports whether an OTLP endpoint is configured (and OTEL_SDK_DISABLED is not true).
func Enabled() bool {
	if os.Getenv("OTEL_SDK_DISABLED") == "true" {
		return false
	}
	for _, k := range []string{"OTEL_EXPORTER_OTLP_ENDPOINT", "OTEL_EXPORTER_OTLP_TRACES_ENDPOINT",
		"OTEL_EXPORTER_OTLP_METRICS_ENDPOINT", "OTEL_EXPORTER_OTLP_LOGS_ENDPOINT"} {
		if os.Getenv(k) != "" {
			return true
		}
	}
	return false
}

// CallAttr is the call correlation attribute.
func CallAttr(callRef string) attribute.KeyValue { return attribute.String(CallRefKey, callRef) }

// Setup installs the global providers. It returns the shutdown func (flushes exporters) and an
// slog.Handler to fan logs to, or nil when telemetry is disabled.
func Setup(ctx context.Context, service, nodeID string) (func(context.Context) error, slog.Handler, error) {
	if !Enabled() {
		return func(context.Context) error { return nil }, nil, nil
	}
	res, err := resource.Merge(resource.Default(), resource.NewSchemaless(
		attribute.String("service.name", envOr("OTEL_SERVICE_NAME", service)),
		attribute.String("service.instance.id", nodeID)))
	if err != nil {
		return nil, nil, err
	}
	te, err := otlptracehttp.New(ctx)
	if err != nil {
		return nil, nil, err
	}
	tp := sdktrace.NewTracerProvider(sdktrace.WithBatcher(te), sdktrace.WithResource(res))
	me, err := otlpmetrichttp.New(ctx)
	if err != nil {
		return nil, nil, err
	}
	mp := sdkmetric.NewMeterProvider(sdkmetric.WithResource(res),
		sdkmetric.WithReader(sdkmetric.NewPeriodicReader(me, sdkmetric.WithInterval(15*time.Second))))
	le, err := otlploghttp.New(ctx)
	if err != nil {
		return nil, nil, err
	}
	lp := sdklog.NewLoggerProvider(sdklog.WithResource(res), sdklog.WithProcessor(sdklog.NewBatchProcessor(le)))
	otel.SetTracerProvider(tp)
	otel.SetMeterProvider(mp)
	shutdown := func(ctx context.Context) error {
		ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
		defer cancel()
		return errors.Join(tp.Shutdown(ctx), mp.Shutdown(ctx), lp.Shutdown(ctx))
	}
	return shutdown, otelslog.NewHandler(scope, otelslog.WithLoggerProvider(lp)), nil
}

// Tee sends every record to both handlers (stderr JSON and OTLP).
func Tee(a, b slog.Handler) slog.Handler {
	if b == nil {
		return a
	}
	return tee{a, b}
}

type tee struct{ a, b slog.Handler }

func (t tee) Enabled(ctx context.Context, l slog.Level) bool {
	return t.a.Enabled(ctx, l) || t.b.Enabled(ctx, l)
}
func (t tee) Handle(ctx context.Context, r slog.Record) error {
	_ = t.b.Handle(ctx, r.Clone())
	return t.a.Handle(ctx, r)
}
func (t tee) WithAttrs(as []slog.Attr) slog.Handler { return tee{t.a.WithAttrs(as), t.b.WithAttrs(as)} }
func (t tee) WithGroup(n string) slog.Handler       { return tee{t.a.WithGroup(n), t.b.WithGroup(n)} }

// StartCall starts a span tagged with the call ref and returns the func that ends it. Without
// Setup the global provider is a no-op, so this costs nothing.
func StartCall(ctx context.Context, name, callRef string) (context.Context, func()) {
	ctx, span := otel.Tracer(scope).Start(ctx, name, trace.WithAttributes(CallAttr(callRef)))
	return ctx, func() { span.End() }
}

// Meters holds the node's instruments.
type Meters struct {
	incoming metric.Int64Counter
}

// RegisterNode creates the node's metrics: active rooms and draining as gauges read at export
// time, and a counter of incoming calls by outcome.
func RegisterNode(nodeID string, activeRooms func() int, draining func() bool) (*Meters, error) {
	m := otel.Meter(scope)
	base := metric.WithAttributes(attribute.String("fonoster.node_id", nodeID))
	_, err := m.Int64ObservableGauge("fonoster.roomr.rooms.active",
		metric.WithDescription("Rooms that have not ended"),
		metric.WithInt64Callback(func(_ context.Context, o metric.Int64Observer) error {
			o.Observe(int64(activeRooms()), base)
			return nil
		}))
	if err != nil {
		return nil, err
	}
	_, err = m.Int64ObservableGauge("fonoster.roomr.draining",
		metric.WithDescription("1 while the node is draining"),
		metric.WithInt64Callback(func(_ context.Context, o metric.Int64Observer) error {
			v := int64(0)
			if draining() {
				v = 1
			}
			o.Observe(v, base)
			return nil
		}))
	if err != nil {
		return nil, err
	}
	c, err := m.Int64Counter("fonoster.roomr.calls.incoming", metric.WithDescription("Incoming calls by outcome"))
	return &Meters{incoming: c}, err
}

var meters *Meters

// SetMeters makes the counters reachable from the node package.
func SetMeters(m *Meters) { meters = m }

// CallIncoming counts an incoming call; outcome is claimed, unclaimed or refused.
func CallIncoming(ctx context.Context, callRef, outcome string) {
	if meters == nil || meters.incoming == nil {
		return
	}
	meters.incoming.Add(ctx, 1, metric.WithAttributes(CallAttr(callRef), attribute.String("outcome", outcome)))
}

func envOr(k, def string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return def
}

// TraceparentHeader is the NATS header carrying the W3C trace context between services (the
// gateway sends it on media-control commands; the node sends it on call.incoming).
const TraceparentHeader = "traceparent"

var traceContext = propagation.TraceContext{}

// Extract returns ctx with the remote span context of a W3C traceparent (unchanged when empty or
// invalid), so spans started from it join the sender's trace.
func Extract(ctx context.Context, traceparent string) context.Context {
	if traceparent == "" {
		return ctx
	}
	return traceContext.Extract(ctx, propagation.MapCarrier{TraceparentHeader: traceparent})
}

// Traceparent returns the W3C traceparent of ctx's span, or "" when there is no recording span.
func Traceparent(ctx context.Context) string {
	c := propagation.MapCarrier{}
	traceContext.Inject(ctx, c)
	return c[TraceparentHeader]
}

// StartSpan starts a span (not call-scoped) under ctx and returns the func that ends it.
func StartSpan(ctx context.Context, name string, attrs ...attribute.KeyValue) (context.Context, func()) {
	ctx, span := otel.Tracer(scope).Start(ctx, name, trace.WithAttributes(attrs...))
	return ctx, func() { span.End() }
}
