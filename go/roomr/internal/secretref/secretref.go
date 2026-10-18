// Package secretref resolves `secret://` references in the node's settings (add-platform D8,
// the Go side of @fonoster/common's resolveSecretRefs):
//
//	secret://env/NAME                 the environment variable NAME
//	secret://file/<absolute path>     a file's contents
//	secret://k8s/[<ns>/]<secret>#<key> <FONOSTER_SECRETS_DIR>/<secret>/<key>
//	                                  (default /var/run/fonoster/secrets)
//
// File contents lose one trailing newline. Errors name the reference, never the value.
package secretref

import (
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"strings"
)

// Prefix marks a reference.
const Prefix = "secret://"

// DefaultSecretsDir is where the Helm chart mounts Kubernetes Secrets.
const DefaultSecretsDir = "/var/run/fonoster/secrets"

var (
	envName = regexp.MustCompile(`^[A-Za-z_][A-Za-z0-9_]*$`)
	k8sName = regexp.MustCompile(`^[a-z0-9]([-a-z0-9.]*[a-z0-9])?$`)
	k8sKey  = regexp.MustCompile(`^[-._a-zA-Z0-9]+$`)
)

// IsRef reports whether v is a reference.
func IsRef(v string) bool { return strings.HasPrefix(v, Prefix) }

// Resolve returns v unchanged unless it is a reference, which it replaces by the secret.
func Resolve(v string) (string, error) {
	if !IsRef(v) {
		return v, nil
	}
	rest := strings.TrimPrefix(v, Prefix)
	kind, target, _ := strings.Cut(rest, "/")
	switch kind {
	case "env":
		if !envName.MatchString(target) {
			return "", fmt.Errorf("invalid variable name in %s", v)
		}
		val := os.Getenv(target)
		if val == "" {
			return "", fmt.Errorf("%s: environment variable %s is not set", v, target)
		}
		return val, nil
	case "file":
		if target == "" {
			return "", fmt.Errorf("%s: missing file path", v)
		}
		return readFile(v, filepath.Join("/", target))
	case "k8s":
		path, key, ok := strings.Cut(target, "#")
		if !ok {
			return "", fmt.Errorf("%s: missing #<key>", v)
		}
		parts := strings.Split(path, "/")
		if len(parts) > 2 {
			return "", fmt.Errorf("%s: expected secret://k8s/[<namespace>/]<secret>#<key>", v)
		}
		for _, p := range parts {
			if !k8sName.MatchString(p) {
				return "", fmt.Errorf("%s: expected secret://k8s/[<namespace>/]<secret>#<key>", v)
			}
		}
		if !k8sKey.MatchString(key) {
			return "", fmt.Errorf("%s: invalid key", v)
		}
		name := parts[len(parts)-1]
		if len(parts) == 2 {
			if ns := os.Getenv("POD_NAMESPACE"); ns != "" && ns != parts[0] {
				return "", fmt.Errorf("%s: Secrets of namespace %s are not mounted here (%s)", v, parts[0], ns)
			}
		}
		dir := os.Getenv("FONOSTER_SECRETS_DIR")
		if dir == "" {
			dir = DefaultSecretsDir
		}
		return readFile(v, filepath.Join(dir, name, key))
	}
	return "", fmt.Errorf("unsupported reference %s (use secret://env/NAME, secret://file/<path> or secret://k8s/<secret>#<key>)", v)
}

func readFile(ref, path string) (string, error) {
	b, err := os.ReadFile(path)
	if err != nil {
		return "", fmt.Errorf("%s: cannot read %s", ref, path)
	}
	s := strings.TrimSuffix(string(b), "\n")
	return strings.TrimSuffix(s, "\r"), nil
}

// PEM returns PEM bytes for a setting that is either a file path or a reference whose value is
// the PEM itself (secret://env, secret://k8s) or names a file (secret://file reads the file).
// Empty means unset.
func PEM(v string) ([]byte, error) {
	if v == "" {
		return nil, nil
	}
	if IsRef(v) {
		s, err := Resolve(v)
		if err != nil {
			return nil, err
		}
		return []byte(s + "\n"), nil
	}
	b, err := os.ReadFile(v)
	if err != nil {
		return nil, fmt.Errorf("cannot read %s: %w", v, err)
	}
	return b, nil
}
