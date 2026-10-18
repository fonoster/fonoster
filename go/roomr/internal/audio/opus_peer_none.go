//go:build !cgo || noopus

package audio

import "errors"

type fullbandPeer struct{}

func newFullbandPeer() (*fullbandPeer, error) { return nil, errors.New("opus not built in") }
func (*fullbandPeer) encode([]int16) []byte   { return nil }
func (*fullbandPeer) decode([]byte) []int16   { return nil }
func (*fullbandPeer) close()                  {}
