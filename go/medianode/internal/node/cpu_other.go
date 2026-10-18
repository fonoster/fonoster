//go:build !unix

package node

import "time"

// processCPU is unknown here: cpu_idle reads as fully idle.
func processCPU() time.Duration { return 0 }
