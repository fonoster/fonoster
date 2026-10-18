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

// startMutual runs a node whose TLS listener requires client certificates from the test CA. The
// node's own certificate and the CA come in as secret:// references and file paths.
func startMutual(t *testing.T, p *testPKI) *rig {
	nodeCert, nodeKey := p.leaf("node")
	t.Setenv("RB_TEST_NODE_KEY", string(mustRead(t, nodeKey)))
	edge, err := edgetls.Build(edgetls.Options{Cert: "secret://file" + nodeCert, Key: "secret://env/RB_TEST_NODE_KEY",
		CA: p.caPath(), ClientCA: p.caPath()})
	if err != nil {
		t.Fatal(err)
	}
	if !edge.Mutual || edge.Server.ClientAuth != tls.RequireAndVerifyClientCert {
		t.Fatalf("listener does not require client certificates: %+v", edge.Server)
	}
	routrCert, routrKey := p.leaf("routr")
	tlsPort := freePort(t)
	r := startWith(t, rigOptions{
		uaCfg: func(c *sipua.Config) {
			c.TLSListen, c.TLSConfig, c.ClientTLS = "127.0.0.1:"+strconv.Itoa(tlsPort), edge.Server, edge.Client
			// The allowlist stays as an extra check (RV-B7).
			c.TrustedSources = []string{"127.0.0.1"}
		},
		botOpts: caller.Options{ClientTLS: edgeTLS(t, p, routrCert, routrKey)},
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

func TestMutualTLSAcceptsTheEdge(t *testing.T) {
	p := newPKI(t, "fonoster-edge-ca")
	r := startMutual(t, p)
	if _, err := r.bot.DialWith(r.tlsAddr, "+15550003333", "", map[string]string{"X-App-Ref": "app-mtls"}, caller.DialOptions{Transport: "tls"}); err != nil {
		t.Fatal(err)
	}
	r.waitEvent(typed("call.incoming", "appRef", "app-mtls"), 3*time.Second)
}

func TestMutualTLSRefusesClientsWithoutAValidCertificate(t *testing.T) {
	p := newPKI(t, "fonoster-edge-ca")
	r := startMutual(t, p)
	other := newPKI(t, "someone-else")
	otherCert, otherKey := other.leaf("intruder")
	intruderTLS := edgeTLS(t, other, otherCert, otherKey)
	intruderTLS.RootCAs = edgeTLS(t, p, "", "").RootCAs // trusts the node, but its cert is foreign
	for name, cfg := range map[string]*tls.Config{
		"no certificate":      edgeTLS(t, p, "", ""),
		"foreign certificate": intruderTLS,
	} {
		bot, err := caller.NewWithOptions(caller.Options{Host: "127.0.0.1", ClientTLS: cfg})
		if err != nil {
			t.Fatal(err)
		}
		call, err := bot.DialWith(r.tlsAddr, "+15550004444", "", map[string]string{"X-App-Ref": "app-" + name}, caller.DialOptions{Transport: "tls"})
		if err == nil {
			time.Sleep(1500 * time.Millisecond)
			if s := call.Status(); s.State == "answered" || contains(s.SIP, 200) || contains(s.SIP, 180) {
				t.Fatalf("%s: INVITE got %v", name, s.SIP)
			}
			_ = call.Hangup()
		}
		bot.Close()
	}
	if n := r.count(typed("call.incoming")); n != 0 {
		t.Fatalf("%d calls reached the gateway without a valid client certificate", n)
	}
}

func TestEdgeTLSValidation(t *testing.T) {
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
