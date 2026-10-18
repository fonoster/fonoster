package secretref

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestResolve(t *testing.T) {
	dir := t.TempDir()
	t.Setenv("FONOSTER_SECRETS_DIR", dir)
	t.Setenv("POD_NAMESPACE", "fonoster")
	t.Setenv("RB_TEST_SECRET", "s3cret")
	if err := os.MkdirAll(filepath.Join(dir, "nats"), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(dir, "nats", "password"), []byte("from-k8s\n"), 0o600); err != nil {
		t.Fatal(err)
	}
	file := filepath.Join(dir, "plain")
	if err := os.WriteFile(file, []byte("from-file\n"), 0o600); err != nil {
		t.Fatal(err)
	}
	cases := map[string]string{
		"plain":                               "plain",
		"secret://env/RB_TEST_SECRET":         "s3cret",
		"secret://file" + file:                "from-file",
		"secret://k8s/nats#password":          "from-k8s",
		"secret://k8s/fonoster/nats#password": "from-k8s",
	}
	for in, want := range cases {
		got, err := Resolve(in)
		if err != nil || got != want {
			t.Fatalf("Resolve(%q) = %q, %v; want %q", in, got, err, want)
		}
	}
	for _, bad := range []string{"secret://env/NOPE_NOT_SET", "secret://k8s/other/nats#password", "secret://vault/x", "secret://k8s/nats"} {
		_, err := Resolve(bad)
		if err == nil {
			t.Fatalf("Resolve(%q) succeeded", bad)
		}
		if strings.Contains(err.Error(), "from-k8s") {
			t.Fatalf("error leaks the value: %v", err)
		}
	}
	if b, err := PEM(file); err != nil || string(b) != "from-file\n" {
		t.Fatalf("PEM(path) = %q, %v", b, err)
	}
	if b, err := PEM("secret://env/RB_TEST_SECRET"); err != nil || string(b) != "s3cret\n" {
		t.Fatalf("PEM(ref) = %q, %v", b, err)
	}
}
