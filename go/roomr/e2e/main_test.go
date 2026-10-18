package e2e

// SIP_DEBUG=true prints every SIP message (sipgo tracing) and debug logs.

import (
	"log/slog"
	"os"
	"testing"

	"github.com/emiago/sipgo/sip"
)

func TestMain(m *testing.M) {
	if os.Getenv("SIP_DEBUG") == "true" {
		sip.SIPDebug = true
		slog.SetLogLoggerLevel(slog.LevelDebug)
	}
	os.Exit(m.Run())
}
