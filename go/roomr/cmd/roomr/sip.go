package main

import (
	"encoding/json"
	"errors"
	"log/slog"
	"time"

	"github.com/fonoster/fonoster/go/roomr/internal/fileconfig"
	"github.com/fonoster/fonoster/go/roomr/internal/secretref"
	"github.com/fonoster/fonoster/go/roomr/internal/sipua"
	"github.com/nats-io/nats.go"
)

// buildRegistrations resolves sip.registrations; auth passwords may be secret:// references.
func buildRegistrations(fc *fileconfig.File) ([]sipua.Registration, error) {
	var out []sipua.Registration
	for _, r := range fc.SIP.Registrations {
		reg := sipua.Registration{Registrar: r.Registrar, AOR: r.AOR, Headers: r.Headers}
		if r.Expires != "" {
			reg.Expires, _ = time.ParseDuration(r.Expires) // checked by fileconfig.Parse
		}
		if r.Auth != nil {
			pass, err := secretref.Resolve(r.Auth.Password)
			if err != nil {
				return nil, errors.New("sip.registrations " + r.Registrar + ": auth.password: " + err.Error())
			}
			reg.Username, reg.Password = r.Auth.Username, pass
		}
		out = append(out, reg)
	}
	return out, nil
}

// registrationStatePublisher publishes registration.state on roomr.nodes.<id>.events
// (media-control, "Events on NATS are keyed by call with sequence numbers and labels").
func registrationStatePublisher(nc *nats.Conn, nodeID string, logger *slog.Logger) func(sipua.RegistrationState) {
	subject := "roomr.nodes." + nodeID + ".events"
	return func(s sipua.RegistrationState) {
		ev := map[string]any{"type": "registration.state", "node_ref": nodeID, "registrar": s.Registrar,
			"aor": s.AOR, "state": s.State, "timestamp": time.Now().UTC().Format(time.RFC3339Nano)}
		if s.SIPStatus != 0 {
			ev["sip_status"] = s.SIPStatus
		}
		if s.Error != "" {
			ev["error"] = s.Error
		}
		data, _ := json.Marshal(ev)
		if err := nc.Publish(subject, data); err != nil {
			logger.Warn("registration.state publish", "err", err)
		}
		logger.Info("registration", "registrar", s.Registrar, "aor", s.AOR, "state", s.State, "sipStatus", s.SIPStatus)
	}
}
