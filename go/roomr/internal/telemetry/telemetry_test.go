package telemetry

import (
	"context"
	"strings"
	"testing"

	"go.opentelemetry.io/otel"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	"go.opentelemetry.io/otel/sdk/trace/tracetest"
)

func TestDisabledIsNoop(t *testing.T) {
	for _, k := range []string{"OTEL_EXPORTER_OTLP_ENDPOINT", "OTEL_EXPORTER_OTLP_TRACES_ENDPOINT",
		"OTEL_EXPORTER_OTLP_METRICS_ENDPOINT"} {
		t.Setenv(k, "")
	}
	if Enabled() {
		t.Fatal("enabled without endpoint")
	}
	shutdown, err := Setup(context.Background(), "x", "n")
	if err != nil {
		t.Fatalf("setup: %v", err)
	}
	if err := shutdown(context.Background()); err != nil {
		t.Fatal(err)
	}
	_, end := StartCall(context.Background(), "x", "call-1")
	end()
	CallIncoming(context.Background(), "call-1", "claimed")
}

func TestEnabledWithEndpointAndSetup(t *testing.T) {
	t.Setenv("OTEL_EXPORTER_OTLP_ENDPOINT", "http://127.0.0.1:1")
	if !Enabled() {
		t.Fatal("expected enabled")
	}
	shutdown, err := Setup(context.Background(), "x", "n")
	if err != nil {
		t.Fatalf("setup: %v", err)
	}
	m, err := RegisterNode("n", func() int { return 0 })
	if err != nil {
		t.Fatal(err)
	}
	SetMeters(m)
	_, end := StartCall(context.Background(), "x", "call-1")
	end()
	_ = shutdown(context.Background())
	SetMeters(nil)
}

func TestTraceparentPropagation(t *testing.T) {
	rec := tracetest.NewSpanRecorder()
	tp := sdktrace.NewTracerProvider(sdktrace.WithSpanProcessor(rec))
	prev := otel.GetTracerProvider()
	otel.SetTracerProvider(tp)
	defer otel.SetTracerProvider(prev)

	if got := Traceparent(context.Background()); got != "" {
		t.Fatalf("traceparent without a span: %q", got)
	}
	const parent = "00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01"
	ctx := Extract(context.Background(), parent)
	ctx, end := StartSpan(ctx, "roomr.command")
	out := Traceparent(ctx)
	end()
	if !strings.HasPrefix(out, "00-0af7651916cd43dd8448eb211c80319c-") || out == parent {
		t.Fatalf("child traceparent %q does not continue %q", out, parent)
	}
	spans := rec.Ended()
	if len(spans) != 1 || spans[0].Parent().SpanID().String() != "b7ad6b7169203331" {
		t.Fatalf("span parent not taken from traceparent: %+v", spans)
	}
	if Extract(context.Background(), "garbage") == nil {
		t.Fatal("nil context")
	}
}
