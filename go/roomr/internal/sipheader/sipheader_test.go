package sipheader

import "testing"

func TestValidate(t *testing.T) {
	ok := []map[string]string{
		nil,
		{"X-DOD-Number": "+15550002", "X-Foo": "bar"},
		{"P-Asserted-Identity": "<sip:+15550001@carrier>", "Diversion": "<sip:1@a>;reason=unknown"},
		{"User-to-User": "abc;encoding=hex"},
	}
	for _, h := range ok {
		if err := Validate(h); err != nil {
			t.Errorf("Validate(%v) = %v", h, err)
		}
	}
	bad := []map[string]string{
		{"Via": "SIP/2.0/UDP x"}, {"via": "x"}, {"From": "x"}, {"To": "x"}, {"Call-ID": "x"},
		{"CSeq": "1 INVITE"}, {"Contact": "x"}, {"Max-Forwards": "1"}, {"Content-Type": "x"},
		{"content-length": "0"}, {"Content-Disposition": "session"}, {"Route": "x"}, {"Expires": "1"},
		{"Authorization": "x"}, {"i": "x"}, {"m": "x"},
		{"X Bad": "x"}, {"": "x"}, {"X-Inject": "a\r\nVia: evil"},
	}
	for _, h := range bad {
		if err := Validate(h); err == nil {
			t.Errorf("Validate(%v) accepted", h)
		}
	}
}
