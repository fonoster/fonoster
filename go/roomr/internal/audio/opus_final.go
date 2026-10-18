//go:build cgo && !noopus

package audio

import "runtime"

func setOpusFinalizer(o *Opus) { runtime.SetFinalizer(o, (*Opus).free) }
