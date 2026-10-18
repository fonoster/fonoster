// Package fileconfig loads the media node's config file (unify-config-placeholders): one YAML (or
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
	"strings"
	"time"

	"github.com/fonoster/fonoster/go/roomr/internal/sipheader"
	"gopkg.in/yaml.v3"
)

// DefaultPath is where the bundle mounts the file.
const DefaultPath = "/config/roomr.yaml"

// File is roomr.yaml. Every key is optional; flags win over it. ROOMR_* variables are not
// read; reference one as a ${VAR} placeholder to use it.
type File struct {
	NodeID string `yaml:"nodeId"`
	NATS   struct {
		URL      string `yaml:"url"`
		User     string `yaml:"user"`
		Password string `yaml:"password"` // or a secret:// reference
	} `yaml:"nats"`
	SIP struct {
		Listen    string `yaml:"listen"`
		Advertise string `yaml:"advertise"`
		// Registrations are the REGISTERs the node keeps; none (the default) sends no REGISTER.
		Registrations []Registration `yaml:"registrations"`
	} `yaml:"sip"`
	RTP struct {
		Host      string `yaml:"host"`
		Advertise string `yaml:"advertise"`
		PortMin   int    `yaml:"portMin"`
		PortMax   int    `yaml:"portMax"`
	} `yaml:"rtp"`
	OutboundProxy     string `yaml:"outboundProxy"`
	OutboundTransport string `yaml:"outboundTransport"`
	DebugAddr         string `yaml:"debugAddr"`
	DrainWait         string `yaml:"drainWait"`
	MaxDuration       string `yaml:"maxDuration"`
	MaxParticipants   int    `yaml:"maxParticipants"`
	MaxRooms          int    `yaml:"maxRooms"`
	MediaTimeout      string `yaml:"mediaTimeout"`
	EmptyRoomTimeout  string `yaml:"emptyRoomTimeout"`
	OwnerTimeout      string `yaml:"ownerTimeout"`
	TLS               struct {
		Listen   string `yaml:"listen"`
		Cert     string `yaml:"cert"`
		Key      string `yaml:"key"`
		CA       string `yaml:"ca"`
		ClientCA string `yaml:"clientCa"`
	} `yaml:"tls"`
	// Control is Roomr over gRPC (redesign-media-node); off unless control.grpc.listen
	// is set.
	Control struct {
		GRPC struct {
			Listen string `yaml:"listen"`
			// Advertise is the host:port controllers dial (the heartbeat's control_addr);
			// empty: the listen port on sip.advertise's host.
			Advertise string `yaml:"advertise"`
			TLS       struct {
				Cert     string `yaml:"cert"`     // file path or secret:// reference
				Key      string `yaml:"key"`      // file path or secret:// reference
				ClientCA string `yaml:"clientCa"` // set: mutual TLS, client certificates required
			} `yaml:"tls"`
		} `yaml:"grpc"`
	} `yaml:"control"`
	SessionRegistry     *bool    `yaml:"sessionRegistry"`
	RequireEncryption   *bool    `yaml:"requireEncryption"`
	TrustedSources      []string `yaml:"trustedSources"`
	AllowedDestinations []string `yaml:"allowedDestinations"`
	// Codecs are the SIP-leg codecs in preference order (default opus, G722, PCMU, PCMA); leave
	// opus out to disable it.
	Codecs []string `yaml:"codecs"`
	// Region is the node's region in its heartbeat; controllers place a call only on nodes in
	// the call's region.
	Region    string `yaml:"region"`
	Telemetry struct {
		OTLPEndpoint string `yaml:"otlpEndpoint"`
	} `yaml:"telemetry"`
}

// Auth is a digest identity; Password may be a secret:// reference.
type Auth struct {
	Username string `yaml:"username"`
	Password string `yaml:"password"`
}

// Registration is one entry of sip.registrations (media-node, "Registration is optional and
// configured").
type Registration struct {
	// Registrar is host:port or a SIP URI (sip:host:port;transport=tcp). Required.
	Registrar string `yaml:"registrar"`
	// AOR is the address of record (sip:user@domain); default sip:medianode@<registrar host>.
	AOR string `yaml:"aor"`
	// Auth answers a digest challenge; without it a challenge fails the registration.
	Auth *Auth `yaml:"auth"`
	// Expires is the binding lifetime (default 30s); the node re-registers at half of it.
	Expires string `yaml:"expires"`
	// Headers are templates added to every REGISTER; "{sessions}" is the session count (the room
	// limit while draining or full).
	Headers map[string]string `yaml:"headers"`
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
	for name, d := range map[string]string{"drainWait": f.DrainWait, "maxDuration": f.MaxDuration, "mediaTimeout": f.MediaTimeout} {
		if d != "" {
			if _, err := time.ParseDuration(d); err != nil {
				return nil, fmt.Errorf("%s: %q is not a duration (e.g. 15s, 10m)", name, d)
			}
		}
	}
	for i, r := range f.SIP.Registrations {
		name := fmt.Sprintf("sip.registrations[%d]", i)
		if strings.TrimSpace(r.Registrar) == "" {
			return nil, fmt.Errorf("%s.registrar is required", name)
		}
		if r.Expires != "" {
			if d, err := time.ParseDuration(r.Expires); err != nil || d < time.Second {
				return nil, fmt.Errorf("%s.expires: %q is not a duration of at least 1s (e.g. 30s, 5m)", name, r.Expires)
			}
		}
		if err := sipheader.Validate(r.Headers); err != nil {
			return nil, fmt.Errorf("%s.headers: %w", name, err)
		}
	}
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

// PathFromArgs returns the -config / --config value in args, if any.
func PathFromArgs(args []string) (string, bool) {
	for i, a := range args {
		for _, name := range []string{"-config", "--config"} {
			if a == name && i+1 < len(args) {
				return args[i+1], true
			}
			if strings.HasPrefix(a, name+"=") {
				return strings.TrimPrefix(a, name+"="), true
			}
		}
	}
	return "", false
}
