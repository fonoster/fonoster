package rtpio

import (
	"crypto/rand"
	"encoding/base64"
	"fmt"

	"github.com/pion/srtp/v3"
)

// SRTPSuite is the only SDES suite the node offers and accepts.
const SRTPSuite = "AES_CM_128_HMAC_SHA1_80"

const keyLen, saltLen = 16, 14

// NewSRTPKey returns a fresh base64 master key and salt (30 bytes) for SDES.
func NewSRTPKey() string {
	b := make([]byte, keyLen+saltLen)
	_, _ = rand.Read(b)
	return base64.StdEncoding.EncodeToString(b)
}

func newContext(key string) (*srtp.Context, error) {
	raw, err := base64.StdEncoding.DecodeString(key)
	if err != nil {
		raw, err = base64.RawStdEncoding.DecodeString(key)
	}
	if err != nil || len(raw) != keyLen+saltLen {
		return nil, fmt.Errorf("srtp key must be %d bytes of base64", keyLen+saltLen)
	}
	return srtp.CreateContext(raw[:keyLen], raw[keyLen:], srtp.ProtectionProfileAes128CmHmacSha1_80)
}

// ValidSRTPKey reports whether key is a usable base64 SDES key.
func ValidSRTPKey(key string) bool {
	_, err := newContext(key)
	return err == nil
}
