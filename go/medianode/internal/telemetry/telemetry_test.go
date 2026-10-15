package telemetry

import (
	"context"
	"log/slog"
	"os"
	"testing"
)

func TestDisabledIsNoop(t *testing.T) {
	for _, k := range []string{"OTEL_EXPORTER_OTLP_ENDPOINT", "OTEL_EXPORTER_OTLP_TRACES_ENDPOINT",
		"OTEL_EXPORTER_OTLP_METRICS_ENDPOINT", "OTEL_EXPORTER_OTLP_LOGS_ENDPOINT"} {
		t.Setenv(k, "")
	}
	if Enabled() {
		t.Fatal("enabled without endpoint")
	}
	shutdown, h, err := Setup(context.Background(), "x", "n")
	if err != nil || h != nil {
		t.Fatalf("setup: %v %v", err, h)
	}
	if err := shutdown(context.Background()); err != nil {
		t.Fatal(err)
	}
	base := slog.NewJSONHandler(os.Stderr, nil)
	if Tee(base, nil) != slog.Handler(base) {
		t.Fatal("tee with nil must return the base handler")
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
	shutdown, h, err := Setup(context.Background(), "x", "n")
	if err != nil || h == nil {
		t.Fatalf("setup: %v %v", err, h)
	}
	m, err := RegisterNode("n", func() int { return 0 }, func() bool { return false })
	if err != nil {
		t.Fatal(err)
	}
	SetMeters(m)
	_, end := StartCall(context.Background(), "x", "call-1")
	end()
	_ = shutdown(context.Background())
	SetMeters(nil)
}
