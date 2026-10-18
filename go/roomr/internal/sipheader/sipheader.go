// Package sipheader holds the one rule for headers the node passes through untouched
// (media-node, "The node knows no other component by name"): headers given with a dial
// (CreateCall's to.headers, participant.dial's and transfer's headers) go on the INVITE as they
// are, and registration header templates go on the REGISTER. A caller only cannot set a header the
// node itself owns on the request.
package sipheader

import (
	"fmt"
	"strings"
)

// reservedHeaders are the SIP headers the node owns on its requests (RFC 3261 names and their
// compact forms); any header whose name starts with "Content-" is reserved too.
var reservedHeaders = map[string]bool{
	"via": true, "from": true, "to": true, "call-id": true, "cseq": true, "contact": true,
	"max-forwards": true, "route": true, "record-route": true, "authorization": true,
	"proxy-authorization": true, "expires": true,
	// compact forms: Via, From, To, Call-ID, Contact, Content-Type, Content-Length, Content-Encoding
	"v": true, "f": true, "t": true, "i": true, "m": true, "c": true, "l": true, "e": true,
}

// Reserved reports whether name is a header the node sets itself (case-insensitive).
func Reserved(name string) bool {
	lower := strings.ToLower(name)
	return reservedHeaders[lower] || strings.HasPrefix(lower, "content-")
}

func validHeaderName(name string) bool {
	if name == "" {
		return false
	}
	for _, c := range name {
		ok := c == '-' || c == '_' || c == '.' || c == '!' || c == '%' || c == '*' || c == '+' ||
			c == '`' || c == '\'' || c == '~' || (c >= '0' && c <= '9') || (c >= 'a' && c <= 'z') ||
			(c >= 'A' && c <= 'Z')
		if !ok {
			return false
		}
	}
	return true
}

// Validate checks pass-through headers: every name a SIP token and not reserved, every
// value one line. Anything else (X-*, P-Asserted-Identity, Diversion, ...) is allowed.
func Validate(headers map[string]string) error {
	for k, v := range headers {
		if !validHeaderName(k) {
			return fmt.Errorf("header name %q is not a SIP token", k)
		}
		if Reserved(k) {
			return fmt.Errorf("header %s is set by the node", k)
		}
		if strings.ContainsAny(v, "\r\n") {
			return fmt.Errorf("header %s must be one line", k)
		}
	}
	return nil
}
