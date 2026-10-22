package e2e

import (
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/tls"
	"crypto/x509"
	"crypto/x509/pkix"
	"encoding/pem"
	"math/big"
	"net"
	"os"
	"path/filepath"
	"strconv"
	"testing"
	"time"

	"github.com/fonoster/fonoster/go/roomr/internal/caller"
	"github.com/fonoster/fonoster/go/roomr/internal/edgetls"
	"github.com/fonoster/fonoster/go/roomr/internal/sipua"
)

// testPKI is a throwaway CA with leaf certificates for the node and the edge (add-platform 4.2).
type testPKI struct {
	t      *testing.T
	dir    string
	ca     *x509.Certificate
	caKey  *ecdsa.PrivateKey
	serial int64
}

func newPKI(t *testing.T, name string) *testPKI {
	key, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	if err != nil {
		t.Fatal(err)
	}
	tmpl := &x509.Certificate{SerialNumber: big.NewInt(1), Subject: pkix.Name{CommonName: name},
		NotBefore: time.Now().Add(-time.Hour), NotAfter: time.Now().Add(time.Hour), IsCA: true,
		BasicConstraintsValid: true, KeyUsage: x509.KeyUsageCertSign | x509.KeyUsageDigitalSignature}
	der, err := x509.CreateCertificate(rand.Reader, tmpl, tmpl, &key.PublicKey, key)
	if err != nil {
		t.Fatal(err)
	}
	ca, _ := x509.ParseCertificate(der)
	p := &testPKI{t: t, dir: t.TempDir(), ca: ca, caKey: key, serial: 1}
	p.write("ca.pem", "CERTIFICATE", der)
	return p
}

func (p *testPKI) write(name, kind string, der []byte) string {
	path := filepath.Join(p.dir, name)
	if err := os.WriteFile(path, pem.EncodeToMemory(&pem.Block{Type: kind, Bytes: der}), 0o600); err != nil {
		p.t.Fatal(err)
	}
	return path
}

// leaf issues a certificate for 127.0.0.1 usable as server and client; returns cert and key paths.
func (p *testPKI) leaf(name string) (string, string) {
	key, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	if err != nil {
		p.t.Fatal(err)
	}
	p.serial++
	tmpl := &x509.Certificate{SerialNumber: big.NewInt(p.serial), Subject: pkix.Name{CommonName: name},
		NotBefore: time.Now().Add(-time.Hour), NotAfter: time.Now().Add(time.Hour),
		IPAddresses: []net.IP{net.ParseIP("127.0.0.1")}, DNSNames: []string{"localhost"},
		KeyUsage:    x509.KeyUsageDigitalSignature,
		ExtKeyUsage: []x509.ExtKeyUsage{x509.ExtKeyUsageServerAuth, x509.ExtKeyUsageClientAuth}}
	der, err := x509.CreateCertificate(rand.Reader, tmpl, p.ca, &key.PublicKey, p.caKey)
	if err != nil {
		p.t.Fatal(err)
	}
	kder, err := x509.MarshalECPrivateKey(key)
	if err != nil {
		p.t.Fatal(err)
	}
	return p.write(name+".pem", "CERTIFICATE", der), p.write(name+"-key.pem", "EC PRIVATE KEY", kder)
}

func (p *testPKI) caPath() string { return filepath.Join(p.dir, "ca.pem") }

// edgeTLS is the TLS client config of "Routr": its certificate (when given) and the CA it trusts.
func edgeTLS(t *testing.T, p *testPKI, certPath, keyPath string) *tls.Config {
	c, err := edgetls.Build(edgetls.Options{Cert: certPath, Key: keyPath, CA: p.caPath()})
	if err != nil {
		t.Fatal(err)
	}
	if c.Client == nil {
		t.Fatal("no client config")
	}
	return c.Client
}

// startTLS runs a node with the optional SIP-over-TLS listener (certificate only; no client
// certificates). The node's certificate and key come in as secret:// references.
func startTLS(t *testing.T, p *testPKI) *rig {
	nodeCert, nodeKey := p.leaf("node")
	t.Setenv("RB_TEST_NODE_KEY", string(mustRead(t, nodeKey)))
	edge, err := edgetls.Build(edgetls.Options{Cert: "secret://file" + nodeCert, Key: "secret://env/RB_TEST_NODE_KEY",
		CA: p.caPath()})
	if err != nil {
		t.Fatal(err)
	}
	tlsPort := freePort(t)
	r := startWith(t, rigOptions{
		uaCfg: func(c *sipua.Config) {
			c.TLSListen, c.TLSConfig, c.ClientTLS = "127.0.0.1:"+strconv.Itoa(tlsPort), edge.Server, edge.Client
		},
		botOpts: caller.Options{ClientTLS: edgeTLS(t, p, "", "")},
	})
	r.tlsAddr = "127.0.0.1:" + strconv.Itoa(tlsPort)
	return r
}

func mustRead(t *testing.T, path string) []byte {
	b, err := os.ReadFile(path)
	if err != nil {
		t.Fatal(err)
	}
	return b
}

func TestROM007_SIPTLSListenerAcceptsCalls(t *testing.T) {
	p := newPKI(t, "fonoster-edge-ca")
	r := startTLS(t, p)
	call, err := r.bot.DialWith(r.tlsAddr, "+15550003333", "", map[string]string{"X-App-Ref": "app-tls"}, caller.DialOptions{Transport: "tls"})
	if err != nil {
		t.Fatal(err)
	}
	if ac := r.app.callTo("+15550003333"); ac.start.GetHeaders()["X-App-Ref"] != "app-tls" {
		t.Fatalf("Start.headers = %v", ac.start.GetHeaders())
	}
	waitStatus(t, call, func(s caller.Status) bool { return s.State == "answered" }, 3*time.Second)
}

func TestROM007_EdgeTLSValidation(t *testing.T) {
	if _, err := edgetls.Build(edgetls.Options{ClientCA: "/nope.pem"}); err == nil {
		t.Fatal("client CA without a listener certificate accepted")
	}
	p := newPKI(t, "ca")
	cert, key := p.leaf("node")
	if _, err := edgetls.Build(edgetls.Options{Cert: cert, Key: key, ClientCA: key}); err == nil {
		t.Fatal("a key file accepted as client CA")
	}
	c, err := edgetls.Build(edgetls.Options{Cert: cert, Key: key})
	if err != nil || c.Mutual || c.Client != nil || c.Server == nil {
		t.Fatalf("plain TLS listener: %+v, %v", c, err)
	}
}
