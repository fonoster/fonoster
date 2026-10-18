package main

import (
	"encoding/json"
	"errors"
	"log/slog"
	"net"
	"strings"
	"time"

	"github.com/fonoster/fonoster/go/medianode/internal/fileconfig"
	"github.com/fonoster/fonoster/go/medianode/internal/secretref"
	"github.com/fonoster/fonoster/go/medianode/internal/sipua"
	"github.com/nats-io/nats.go"
)

// legacyRegistration is the single Routr registration of earlier releases: the `registration`
// block and the -registrar, -domain, -username, -password, -transport and -register-every flags.
// It still works, as one sip.registrations entry that templates X-Session-Count: "{sessions}".
type legacyRegistration struct {
	Registrar, Domain, Username, Password, Transport string
	Every                                            time.Duration
}

// sipSettings is what the SIP side gets from the file and the flags.
type sipSettings struct {
	Registrations []sipua.Registration
	// Domain, Username and Password are the Peer identity of participant.dial and transfer
	// INVITEs (the NATS media-control path, unchanged until it is retired): the legacy
	// registration's, else the first registration's AOR and auth.
	Domain, Username, Password string
	// Legacy is set when the legacy registration was used (main logs a deprecation warning).
	Legacy bool
}

func hostOf(addr string) string {
	addr = strings.TrimPrefix(strings.TrimPrefix(addr, "sips:"), "sip:")
	if i := strings.Index(addr, ";"); i >= 0 {
		addr = addr[:i]
	}
	if i := strings.Index(addr, "@"); i >= 0 {
		addr = addr[i+1:]
	}
	if h, _, err := net.SplitHostPort(addr); err == nil {
		return h
	}
	return addr
}

func userOf(aor string) string {
	aor = strings.TrimPrefix(strings.TrimPrefix(aor, "sips:"), "sip:")
	if i := strings.Index(aor, "@"); i >= 0 {
		return aor[:i]
	}
	return ""
}

// buildSIP resolves sip.registrations (passwords may be secret:// references) and the legacy
// registration.
func buildSIP(fc *fileconfig.File, legacy legacyRegistration) (sipSettings, error) {
	var out sipSettings
	if len(fc.SIP.Registrations) > 0 && legacy.Registrar != "" {
		return out, errors.New("-registrar (or registration) and sip.registrations are both set; keep sip.registrations only")
	}
	for _, r := range fc.SIP.Registrations {
		reg := sipua.Registration{Registrar: r.Registrar, AOR: r.AOR, Headers: r.Headers}
		if r.Expires != "" {
			reg.Expires, _ = time.ParseDuration(r.Expires) // checked by fileconfig.Parse
		}
		if r.Auth != nil {
			pass, err := secretref.Resolve(r.Auth.Password)
			if err != nil {
				return out, errors.New("sip.registrations " + r.Registrar + ": auth.password: " + err.Error())
			}
			reg.Username, reg.Password = r.Auth.Username, pass
		}
		out.Registrations = append(out.Registrations, reg)
	}
	legacyPass, err := secretref.Resolve(legacy.Password)
	if err != nil {
		return out, errors.New("registration password: " + err.Error())
	}
	user := legacy.Username
	if user == "" {
		user = "medianode"
	}
	domain := legacy.Domain
	if domain == "" {
		domain = hostOf(legacy.Registrar)
	}
	out.Domain, out.Username, out.Password = domain, user, legacyPass
	if legacy.Registrar != "" {
		out.Legacy = true
		every := legacy.Every
		if every <= 0 {
			every = 15 * time.Second
		}
		registrar := legacy.Registrar
		if t := strings.ToLower(legacy.Transport); t != "" && t != "udp" {
			registrar = "sip:" + registrar + ";transport=" + t
		}
		out.Registrations = append(out.Registrations, sipua.Registration{Registrar: registrar,
			AOR: "sip:" + user + "@" + domain, Username: user, Password: legacyPass, Expires: 2 * every,
			Headers: map[string]string{"X-Session-Count": sipua.SessionsPlaceholder}})
	} else if legacy.Domain == "" && legacy.Username == "" && legacyPass == "" && len(out.Registrations) > 0 {
		// The node dials as the Peer it registers as.
		first := out.Registrations[0]
		out.Domain = hostOf(orAOR(first))
		out.Username = first.Username
		if out.Username == "" {
			out.Username = userOf(first.AOR)
		}
		if out.Username == "" {
			out.Username = "medianode"
		}
		out.Password = first.Password
	}
	return out, nil
}

func orAOR(r sipua.Registration) string {
	if r.AOR != "" {
		return r.AOR
	}
	return r.Registrar
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
