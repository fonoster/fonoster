//go:build !(linux || darwin || freebsd || netbsd || openbsd || dragonfly)

package sipua

import "syscall"

// reusePort is a no-op where SO_REUSEPORT is not available: outgoing TCP connections that must
// leave from the listening port then fail to bind (UDP is unaffected).
func reusePort(_, _ string, _ syscall.RawConn) error { return nil }
