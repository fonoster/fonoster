package caller

import (
	"crypto/md5"
	"encoding/hex"
	"fmt"

	"github.com/emiago/sipgo/sip"
	"github.com/icholy/digest"
)

// The bot stands in for Routr as the node's outbound proxy: like Routr's connect processor for a
// Peer's call (checkAgentOrPeerAccess), it can challenge INVITEs with 401 and check the digest
// against one username and password.
const authRealm, authNonce = "caller-bot", "c0ffee"

// RequireAuth makes the bot challenge INVITEs it receives until they carry a valid digest for
// user and pass (an empty pass turns it off).
func (b *Bot) RequireAuth(user, pass string) {
	b.mu.Lock()
	defer b.mu.Unlock()
	b.authUser, b.authPass = user, pass
}

// authorized checks the request's digest response, as Routr does (MD5, with or without qop).
func authorized(req *sip.Request, user, pass string) bool {
	h := req.GetHeader("Authorization")
	if h == nil {
		h = req.GetHeader("Proxy-Authorization")
	}
	if h == nil {
		return false
	}
	cred, err := digest.ParseCredentials(h.Value())
	if err != nil || cred.Username != user || cred.Nonce != authNonce {
		return false
	}
	md := func(s string) string { sum := md5.Sum([]byte(s)); return hex.EncodeToString(sum[:]) }
	ha1 := md(fmt.Sprintf("%s:%s:%s", user, cred.Realm, pass))
	ha2 := md(fmt.Sprintf("%s:%s", req.Method, cred.URI))
	want := md(fmt.Sprintf("%s:%s:%s", ha1, cred.Nonce, ha2))
	if cred.QOP != "" {
		want = md(fmt.Sprintf("%s:%s:%08x:%s:%s:%s", ha1, cred.Nonce, cred.Nc, cred.Cnonce, cred.QOP, ha2))
	}
	return want == cred.Response
}

// challenge answers 401 (WWW-Authenticate) or, as a proxy does, 407 (Proxy-Authenticate) with a
// digest challenge.
func challenge(req *sip.Request, tx sip.ServerTransaction, status int) {
	reason, header := "Unauthorized", "WWW-Authenticate"
	if status == 407 {
		reason, header = "Proxy Authentication Required", "Proxy-Authenticate"
	} else {
		status = 401
	}
	res := sip.NewResponseFromRequest(req, status, reason, nil)
	res.AppendHeader(sip.NewHeader(header,
		fmt.Sprintf(`Digest realm="%s", nonce="%s", algorithm=MD5, qop="auth"`, authRealm, authNonce)))
	_ = tx.Respond(res)
}
