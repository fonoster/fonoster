// Package edgetls builds the TLS settings between the Roomr node and the edge (Routr): the SIP
// listener's certificate, optional mutual TLS (client certificates required and verified against
// a CA, add-platform 4.2) and the client side the node uses when it dials or registers over TLS.
// Every PEM setting is a file path or a `secret://` reference (secretref).
package edgetls

import (
	"crypto/tls"
	"crypto/x509"
	"errors"
	"fmt"

	"github.com/fonoster/fonoster/go/roomr/internal/secretref"
)

// Options are the PEM settings (file paths or secret:// references; empty means unset).
type Options struct {
	// Cert and Key: the node's certificate, served on the TLS listener and presented to the edge
	// when the node connects over TLS (so the edge can verify the node too).
	Cert, Key string
	// CA verifies the edge's server certificate when the node dials or registers over TLS.
	CA string
	// ClientCA, when set, turns on mutual TLS on the listener: every connection must present a
	// client certificate signed by it (tls.RequireAndVerifyClientCert).
	ClientCA string
}

// Configs are the listener (nil without a certificate) and client (nil when nothing is set)
// settings.
type Configs struct {
	Server *tls.Config
	Client *tls.Config
	// Mutual reports whether the listener requires client certificates.
	Mutual bool
}

func pool(setting, name string) (*x509.CertPool, error) {
	pem, err := secretref.PEM(setting)
	if err != nil {
		return nil, fmt.Errorf("%s: %w", name, err)
	}
	p := x509.NewCertPool()
	if !p.AppendCertsFromPEM(pem) {
		return nil, fmt.Errorf("%s: no PEM certificate found", name)
	}
	return p, nil
}

// Build loads the settings. A client CA without a certificate is an error: mutual TLS needs the
// listener.
func Build(o Options) (Configs, error) {
	var c Configs
	var cert *tls.Certificate
	if o.Cert != "" || o.Key != "" {
		certPEM, err := secretref.PEM(o.Cert)
		if err != nil {
			return c, fmt.Errorf("tls certificate: %w", err)
		}
		keyPEM, err := secretref.PEM(o.Key)
		if err != nil {
			return c, fmt.Errorf("tls key: %w", err)
		}
		kp, err := tls.X509KeyPair(certPEM, keyPEM)
		if err != nil {
			return c, fmt.Errorf("tls certificate: %w", err)
		}
		cert = &kp
		c.Server = &tls.Config{Certificates: []tls.Certificate{kp}, MinVersion: tls.VersionTLS12}
	}
	if o.ClientCA != "" {
		if c.Server == nil {
			return c, errors.New("tls client CA set without a certificate and key for the listener")
		}
		p, err := pool(o.ClientCA, "tls client CA")
		if err != nil {
			return c, err
		}
		c.Server.ClientCAs = p
		c.Server.ClientAuth = tls.RequireAndVerifyClientCert
		c.Mutual = true
	}
	if o.CA != "" {
		p, err := pool(o.CA, "tls CA")
		if err != nil {
			return c, err
		}
		c.Client = &tls.Config{RootCAs: p, MinVersion: tls.VersionTLS12}
	}
	if cert != nil && c.Client != nil {
		c.Client.Certificates = []tls.Certificate{*cert}
	}
	return c, nil
}
