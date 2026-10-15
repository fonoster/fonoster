// Package netguard keeps tenant-chosen URLs (hold music) off the platform's own network: the
// same rule as @fonoster/common's assertPublicDestination (RV-B2). http/https only, no internal
// names, and every address the connection goes to must be public unless the operator allowed
// it (FONOSTER_ALLOWED_DESTINATIONS: host names, IPs or CIDRs).
package netguard

import (
	"context"
	"errors"
	"fmt"
	"net"
	"net/http"
	"net/netip"
	"net/url"
	"strings"
	"syscall"
	"time"
)

// ErrUnsafe is returned for destinations the guard refuses.
var ErrUnsafe = errors.New("unsafe destination")

var blocked = func() []netip.Prefix {
	var out []netip.Prefix
	for _, p := range []string{
		"0.0.0.0/8", "10.0.0.0/8", "100.64.0.0/10", "127.0.0.0/8", "169.254.0.0/16",
		"172.16.0.0/12", "192.0.0.0/24", "192.0.2.0/24", "192.168.0.0/16", "198.18.0.0/15",
		"198.51.100.0/24", "203.0.113.0/24", "224.0.0.0/4", "240.0.0.0/4",
		"::/128", "::1/128", "64:ff9b::/96", "100::/64", "2001:db8::/32", "fc00::/7",
		"fe80::/10", "ff00::/8",
	} {
		out = append(out, netip.MustParsePrefix(p))
	}
	return out
}()

var internalSuffixes = []string{".localhost", ".local", ".internal", ".intranet", ".lan",
	".home.arpa", ".cluster.local", ".svc"}

// IsPrivate reports whether addr is loopback, private, link-local, ULA, CGNAT, multicast,
// unspecified or reserved (IPv4-mapped IPv6 addresses are checked as IPv4).
func IsPrivate(addr netip.Addr) bool {
	addr = addr.Unmap()
	for _, p := range blocked {
		if p.Contains(addr) {
			return true
		}
	}
	return false
}

// Guard checks destinations against the operator's allow list.
type Guard struct {
	hosts    map[string]bool
	prefixes []netip.Prefix
}

// New builds a guard; entries are host names, IPs or CIDRs allowed although private.
func New(allow []string) *Guard {
	g := &Guard{hosts: map[string]bool{}}
	for _, e := range allow {
		e = strings.ToLower(strings.TrimSpace(e))
		if e == "" {
			continue
		}
		if p, err := netip.ParsePrefix(e); err == nil {
			g.prefixes = append(g.prefixes, p.Masked())
		} else if a, err := netip.ParseAddr(e); err == nil {
			g.prefixes = append(g.prefixes, netip.PrefixFrom(a, a.BitLen()))
		} else {
			g.hosts[e] = true
		}
	}
	return g
}

func (g *Guard) addrAllowed(host string, addr netip.Addr) bool {
	if !IsPrivate(addr) || g.hosts[host] {
		return true
	}
	for _, p := range g.prefixes {
		if p.Contains(addr.Unmap()) || p.Contains(addr) {
			return true
		}
	}
	return false
}

// CheckURL refuses non-http(s) URLs, internal names and private literal addresses. Resolved
// addresses are checked when the connection is made (Client).
func (g *Guard) CheckURL(raw string) (*url.URL, error) {
	u, err := url.Parse(raw)
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrUnsafe, err)
	}
	if u.Scheme != "http" && u.Scheme != "https" {
		return nil, fmt.Errorf("%w: scheme %q", ErrUnsafe, u.Scheme)
	}
	host := strings.ToLower(u.Hostname())
	if host == "" {
		return nil, fmt.Errorf("%w: missing host", ErrUnsafe)
	}
	if addr, err := netip.ParseAddr(host); err == nil {
		if !g.addrAllowed(host, addr) {
			return nil, fmt.Errorf("%w: %s is not public", ErrUnsafe, host)
		}
		return u, nil
	}
	if g.hosts[host] {
		return u, nil
	}
	name := strings.TrimSuffix(host, ".")
	if !strings.Contains(name, ".") || name == "localhost" {
		return nil, fmt.Errorf("%w: %s is an internal name", ErrUnsafe, host)
	}
	for _, s := range internalSuffixes {
		if strings.HasSuffix(name, s) {
			return nil, fmt.Errorf("%w: %s is an internal name", ErrUnsafe, host)
		}
	}
	return u, nil
}

// Client is an HTTP client with a timeout whose connections only go to allowed addresses (the
// check runs on the resolved address, so DNS rebinding cannot reach a private one) and whose
// redirects are re-checked.
func (g *Guard) Client(timeout time.Duration) *http.Client {
	dialer := &net.Dialer{Timeout: timeout}
	transport := &http.Transport{
		Proxy: nil,
		DialContext: func(ctx context.Context, network, address string) (net.Conn, error) {
			host, _, err := net.SplitHostPort(address)
			if err != nil {
				return nil, err
			}
			host = strings.ToLower(host)
			d := *dialer
			d.Control = func(_, addr string, _ syscall.RawConn) error {
				ip, _, err := net.SplitHostPort(addr)
				if err != nil {
					return err
				}
				a, err := netip.ParseAddr(ip)
				if err != nil || !g.addrAllowed(host, a) {
					return fmt.Errorf("%w: %s resolves to %s", ErrUnsafe, host, ip)
				}
				return nil
			}
			return d.DialContext(ctx, network, address)
		},
		TLSHandshakeTimeout:   timeout,
		ResponseHeaderTimeout: timeout,
	}
	return &http.Client{
		Timeout:   timeout,
		Transport: transport,
		CheckRedirect: func(req *http.Request, via []*http.Request) error {
			if len(via) >= 3 {
				return fmt.Errorf("%w: too many redirects", ErrUnsafe)
			}
			_, err := g.CheckURL(req.URL.String())
			return err
		},
	}
}

// Get checks the URL and fetches it with the guarded client.
func (g *Guard) Get(c *http.Client, raw string) (*http.Response, error) {
	u, err := g.CheckURL(raw)
	if err != nil {
		return nil, err
	}
	return c.Get(u.String())
}
