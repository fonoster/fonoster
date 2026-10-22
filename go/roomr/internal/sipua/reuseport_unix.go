//go:build linux || darwin || freebsd || netbsd || openbsd || dragonfly

package sipua

import (
	"syscall"

	"golang.org/x/sys/unix"
)

// reusePort lets the SIP TCP listener and the node's outgoing TCP and TLS connections share the
// listening port, so requests leave from it (sharedPortDialer).
func reusePort(_, _ string, c syscall.RawConn) error {
	var serr error
	err := c.Control(func(fd uintptr) {
		if serr = unix.SetsockoptInt(int(fd), unix.SOL_SOCKET, unix.SO_REUSEADDR, 1); serr != nil {
			return
		}
		serr = unix.SetsockoptInt(int(fd), unix.SOL_SOCKET, unix.SO_REUSEPORT, 1)
	})
	if err != nil {
		return err
	}
	return serr
}
