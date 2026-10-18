//go:build unix

package node

import (
	"syscall"
	"time"
)

// processCPU is the user and system CPU time this process has used.
func processCPU() time.Duration {
	var ru syscall.Rusage
	if syscall.Getrusage(syscall.RUSAGE_SELF, &ru) != nil {
		return 0
	}
	return time.Duration(ru.Utime.Nano() + ru.Stime.Nano())
}
