// Package fileconfig loads the Roomr node's config file (unify-config-placeholders): one YAML (or
// JSON) file, /config/roomr.yaml by default, whose values may be ${VAR} or ${VAR:-default}
// placeholders resolved from the environment, with the same rules as the TypeScript services'
// interpolateEnv: an unset or empty VAR without a default is an error naming the key path.
package fileconfig

import (
	"bytes"
	"errors"
	"fmt"
	"io"
	"os"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/fonoster/fonoster/go/roomr/internal/sipheader"
	"gopkg.in/yaml.v3"
)

// DefaultPath is where the bundle mounts the file.
const DefaultPath = "/config/roomr.yaml"

// Duration is a YAML duration such as 15s or 10m.
type Duration time.Duration

// UnmarshalYAML parses the scalar with time.ParseDuration.
func (d *Duration) UnmarshalYAML(n *yaml.Node) error {
	v, err := time.ParseDuration(n.Value)
	if err != nil {
		return fmt.Errorf("line %d: %q is not a duration (e.g. 15s, 10m)", n.Line, n.Value)
	}
	*d = Duration(v)
	return nil
}

// File is roomr.yaml, the node's only configuration: the node takes a single command-line
// argument, -config <path>. ROOMR_* variables are not read; reference one as a ${VAR}
// placeholder to use it. The keys follow design.md's "Minimal roomr.yaml"; unknown keys are
// errors.
type File struct {
	// NodeID is node_ref in heartbeats and events (default: the hostname).
	NodeID string `yaml:"nodeId"`
	// Region is reported in the heartbeat; controllers place calls only in the call's region.
	Region string `yaml:"region"`
	NATS   struct {
		URL      string `yaml:"url"`
		User     string `yaml:"user"`
		Password string `yaml:"password"` // or a secret:// reference
	} `yaml:"nats"`
	SIP struct {
		// Listen is host:port for UDP and TCP (default 0.0.0.0:5060); Advertise is the host in
		// Contact and Via (default 127.0.0.1).
		Listen    string `yaml:"listen"`
		Advertise string `yaml:"advertise"`
		// OutboundProxy is where dials go when CreateCall's to.proxy is empty: a SIP URI whose
		// transport parameter picks udp, tcp or tls (sip:host:port;transport=tcp).
		OutboundProxy string `yaml:"outboundProxy"`
		// CallRefHeader names the header that carries a call's call_ref (e.g. X-Call-Ref).
		CallRefHeader string `yaml:"callRefHeader"`
		// RoomHeader names the header whose value is a room to join or create (e.g. X-Room-Ref).
		RoomHeader string `yaml:"roomHeader"`
		// Registrations are the REGISTERs the node keeps; none (the default) sends no REGISTER.
		Registrations []Registration `yaml:"registrations"`
	} `yaml:"sip"`
	// TLS is the optional SIP-over-TLS listener (off unless listen is set) and, with ca, the
	// trust for TLS to the outbound proxy and registrars.
	TLS struct {
		Listen string `yaml:"listen"`
		Cert   string `yaml:"cert"`
		Key    string `yaml:"key"`
		CA     string `yaml:"ca"`
	} `yaml:"tls"`
	RTP struct {
		// Host is the address RTP sockets bind to (default 0.0.0.0); Advertise is the address
		// SDP and the control stream announce (default 127.0.0.1). One port range serves every
		// leg, SIP and app alike; publish exactly [portMin, portMax]/udp. Both 0: any port.
		Host      string `yaml:"host"`
		Advertise string `yaml:"advertise"`
		PortMin   int    `yaml:"portMin"`
		PortMax   int    `yaml:"portMax"`
	} `yaml:"rtp"`
	// Control is Roomr over gRPC and grpc.health.v1.Health on the same port.
	Control struct {
		GRPC struct {
			// Listen defaults to 0.0.0.0:50061.
			Listen string `yaml:"listen"`
			// Advertise is the host:port controllers dial (the heartbeat's control_addr);
			// empty: the listen port on sip.advertise's host.
			Advertise string `yaml:"advertise"`
			// TLS is optional (off unless cert is set); clientCa turns on mutual TLS.
			TLS struct {
				Cert     string `yaml:"cert"`     // file path or secret:// reference
				Key      string `yaml:"key"`      // file path or secret:// reference
				ClientCA string `yaml:"clientCa"` // set: mutual TLS, client certificates required
			} `yaml:"tls"`
		} `yaml:"grpc"`
	} `yaml:"control"`
	// SessionEndpoint is where each call's control stream goes (host:port). Required.
	SessionEndpoint string `yaml:"sessionEndpoint"`
	// SessionTLS is optional TLS on the control streams (off by default): ca verifies the
	// session endpoint, cert and key add a client certificate (mutual TLS).
	SessionTLS struct {
		CA   string `yaml:"ca"`
		Cert string `yaml:"cert"`
		Key  string `yaml:"key"`
	} `yaml:"sessionTls"`
	// MaxRooms is the most rooms the node holds at once (default 200).
	MaxRooms int `yaml:"maxRooms"`
	// MaxParticipants per room (default 10); CreateRoom can override it per room.
	MaxParticipants int `yaml:"maxParticipants"`
	// MaxDuration is the longest call (default 4h); CreateCall and Answer can lower it.
	MaxDuration Duration `yaml:"maxDuration"`
	// MediaTimeout ends an answered call whose caller or app leg sends no RTP for this long
	// (default 15s).
	MediaTimeout Duration `yaml:"mediaTimeout"`
	// AnswerTimeout is how long the app has to Answer or Reject an inbound call before the
	// caller gets 480 (default 10s).
	AnswerTimeout Duration `yaml:"answerTimeout"`
	// ReadyTimeout is how long the app has to send Ready on an answered outbound call (default
	// 10s).
	ReadyTimeout Duration `yaml:"readyTimeout"`
	// EmptyRoomTimeout ends a room with no participant and no dial in progress for this long
	// (default 30s; negative: never). CreateRoom can override it per room.
	EmptyRoomTimeout Duration `yaml:"emptyRoomTimeout"`
	// DrainWait is the longest wait for rooms to end after SIGTERM (default 1h).
	DrainWait Duration `yaml:"drainWait"`
	// HeartbeatInterval is the period of node.heartbeat (default 2s).
	HeartbeatInterval Duration `yaml:"heartbeatInterval"`
	// ReregisterDelta: every registration re-registers at once when the room count moved by this
	// much since its last accepted REGISTER (default 5).
	ReregisterDelta int `yaml:"reregisterDelta"`
	// Codecs are the SIP-leg codecs in offer order (default opus, g722, pcmu, pcma); leave opus
	// out to disable it.
	Codecs    []string `yaml:"codecs"`
	Telemetry struct {
		// OTLPEndpoint receives metrics and traces (OTLP/HTTP); logs go to stderr only.
		OTLPEndpoint string `yaml:"otlpEndpoint"`
	} `yaml:"telemetry"`
}

// Defaults fills what the node needs to run without a key. The node package defaults the rest
// (limits, timeouts, heartbeat interval).
func (f *File) Defaults() {
	set := func(s *string, def string) {
		if *s == "" {
			*s = def
		}
	}
	set(&f.SIP.Listen, "0.0.0.0:5060")
	set(&f.SIP.Advertise, "127.0.0.1")
	set(&f.RTP.Host, "0.0.0.0")
	set(&f.RTP.Advertise, "127.0.0.1")
	set(&f.Control.GRPC.Listen, "0.0.0.0:50061")
	if f.DrainWait == 0 {
		f.DrainWait = Duration(time.Hour)
	}
}

// Auth is a digest identity; Password may be a secret:// reference.
type Auth struct {
	Username string `yaml:"username"`
	Password string `yaml:"password"`
}

// Registration is one entry of sip.registrations (roomr, "Registration is optional and
// configured").
type Registration struct {
	// Registrar is host:port or a SIP URI (sip:host:port;transport=tcp). Required.
	Registrar string `yaml:"registrar"`
	// AOR is the address of record (sip:user@domain); default sip:roomr@<registrar host>.
	AOR string `yaml:"aor"`
	// Auth answers a digest challenge; without it a challenge fails the registration.
	Auth *Auth `yaml:"auth"`
	// Expires is the binding lifetime, a duration or whole seconds (default 30s); the node
	// re-registers at half of it.
	Expires string `yaml:"expires"`
	// Headers are templates added to every REGISTER; "{sessions}" is the active room count.
	Headers map[string]string `yaml:"headers"`
}

// ParseExpires reads a registration's expires: a duration (30s, 5m) or whole seconds (60), at
// least 1s.
func ParseExpires(s string) (time.Duration, error) {
	d, err := time.ParseDuration(s)
	if err != nil {
		n, nerr := strconv.Atoi(s)
		if nerr != nil {
			return 0, fmt.Errorf("%q is not a duration of at least 1s (e.g. 30s, 5m, 60)", s)
		}
		d = time.Duration(n) * time.Second
	}
	if d < time.Second {
		return 0, fmt.Errorf("%q is not a duration of at least 1s (e.g. 30s, 5m, 60)", s)
	}
	return d, nil
}

var ref = regexp.MustCompile(`\$\{([A-Za-z_][A-Za-z0-9_]*)(:-([^}]*))?\}`)

// Expand replaces ${VAR} and ${VAR:-default} in s. Anything else passes through unchanged.
func Expand(s string, lookup func(string) (string, bool)) (string, error) {
	var missing []string
	out := ref.ReplaceAllStringFunc(s, func(m string) string {
		g := ref.FindStringSubmatch(m)
		if v, ok := lookup(g[1]); ok && v != "" {
			return v
		}
		if strings.Contains(m, ":-") {
			return g[3]
		}
		missing = append(missing, g[1])
		return ""
	})
	if len(missing) > 0 {
		return "", fmt.Errorf("references undefined environment variable ${%s} and no default was given", missing[0])
	}
	return out, nil
}

// expandNode expands placeholders in every scalar below n. A scalar that held one is retyped from
// its value ("11000" becomes a number), as if the value had been written there.
func expandNode(n *yaml.Node, path string, lookup func(string) (string, bool)) error {
	switch n.Kind {
	case yaml.DocumentNode, yaml.SequenceNode:
		for i, c := range n.Content {
			p := path
			if n.Kind == yaml.SequenceNode {
				p = fmt.Sprintf("%s[%d]", path, i)
			}
			if err := expandNode(c, p, lookup); err != nil {
				return err
			}
		}
	case yaml.MappingNode:
		for i := 0; i+1 < len(n.Content); i += 2 {
			p := n.Content[i].Value
			if path != "" {
				p = path + "." + p
			}
			if err := expandNode(n.Content[i+1], p, lookup); err != nil {
				return err
			}
		}
	case yaml.ScalarNode:
		if !ref.MatchString(n.Value) {
			return nil
		}
		v, err := Expand(n.Value, lookup)
		if err != nil {
			if path == "" {
				path = "(root)"
			}
			return fmt.Errorf("%s: %w", path, err)
		}
		n.Value, n.Tag, n.Style = v, "", 0
	}
	return nil
}

// Parse reads a config file's content. Unknown keys are errors.
func Parse(data []byte, lookup func(string) (string, bool)) (*File, error) {
	var doc yaml.Node
	if err := yaml.Unmarshal(data, &doc); err != nil {
		return nil, err
	}
	f := &File{}
	if doc.Kind == 0 {
		f.Defaults()
		return f, nil
	}
	if err := expandNode(&doc, "", lookup); err != nil {
		return nil, err
	}
	expanded, err := yaml.Marshal(&doc)
	if err != nil {
		return nil, err
	}
	dec := yaml.NewDecoder(bytes.NewReader(expanded))
	dec.KnownFields(true)
	if err := dec.Decode(f); err != nil && !errors.Is(err, io.EOF) {
		return nil, err
	}
	for i, r := range f.SIP.Registrations {
		name := fmt.Sprintf("sip.registrations[%d]", i)
		if strings.TrimSpace(r.Registrar) == "" {
			return nil, fmt.Errorf("%s.registrar is required", name)
		}
		if r.Expires != "" {
			if _, err := ParseExpires(r.Expires); err != nil {
				return nil, fmt.Errorf("%s.expires: %w", name, err)
			}
		}
		if err := sipheader.Validate(r.Headers); err != nil {
			return nil, fmt.Errorf("%s.headers: %w", name, err)
		}
	}
	f.Defaults()
	return f, nil
}

// Load reads path; a missing file at the default path is not an error (nil, nil).
func Load(path string, explicit bool) (*File, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		if os.IsNotExist(err) && !explicit {
			return nil, nil
		}
		return nil, fmt.Errorf("unable to read roomr config at %s: %w", path, err)
	}
	f, err := Parse(data, os.LookupEnv)
	if err != nil {
		return nil, fmt.Errorf("invalid roomr config at %s: %w", path, err)
	}
	return f, nil
}
