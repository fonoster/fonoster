package sipua

import (
	"context"
	"fmt"
	"net"
	"strings"
	"time"
)

// sourceFilter is the allowlist of SIP sources whose INVITEs the node accepts (RV-B7). Entries
// are IPs, CIDRs or host names; host names are resolved when an INVITE arrives, so a container
// address that changes on restart still matches.
type sourceFilter struct {
	nets  []*net.IPNet
	hosts []string
}

func newSourceFilter(entries []string) (*sourceFilter, error) {
	f := &sourceFilter{}
	for _, e := range entries {
		e = strings.TrimSpace(e)
		if e == "" {
			continue
		}
		if strings.Contains(e, "/") {
			_, n, err := net.ParseCIDR(e)
			if err != nil {
				return nil, fmt.Errorf("trusted SIP source %q: %w", e, err)
			}
			f.nets = append(f.nets, n)
			continue
		}
		if ip := net.ParseIP(e); ip != nil {
			f.nets = append(f.nets, hostNet(ip))
			continue
		}
		f.hosts = append(f.hosts, e)
	}
	if len(f.nets) == 0 && len(f.hosts) == 0 {
		return nil, nil
	}
	return f, nil
}

func hostNet(ip net.IP) *net.IPNet {
	if v4 := ip.To4(); v4 != nil {
		return &net.IPNet{IP: v4, Mask: net.CIDRMask(32, 32)}
	}
	return &net.IPNet{IP: ip, Mask: net.CIDRMask(128, 128)}
}

// allows reports whether source ("host:port") may send INVITEs; a nil filter allows everything.
func (f *sourceFilter) allows(source string) bool {
	if f == nil {
		return true
	}
	host, _, err := net.SplitHostPort(source)
	if err != nil {
		host = source
	}
	ip := net.ParseIP(host)
	if ip == nil {
		return false
	}
	for _, n := range f.nets {
		if n.Contains(ip) {
			return true
		}
	}
	for _, h := range f.hosts {
		ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
		addrs, err := net.DefaultResolver.LookupIPAddr(ctx, h)
		cancel()
		if err != nil {
			continue
		}
		for _, a := range addrs {
			if a.IP.Equal(ip) {
				return true
			}
		}
	}
	return false
}
