package node

import "testing"

func TestSipTargetCheck(t *testing.T) {
	ok := []SipTarget{
		{URI: "sip:+15551234567@carrier"},
		{URI: "sip:a@b", Proxy: "sip:proxy:5060", Headers: map[string]string{"X-Tenant": "t1", "P-Asserted-Identity": "<sip:+1@x>"}},
	}
	for _, tc := range ok {
		if err := tc.check(); err != nil {
			t.Errorf("%+v: %v", tc, err)
		}
	}
	bad := []SipTarget{
		{},
		{URI: "  "},
		{URI: "sip:a@b\r\nVia: x"},
		{URI: "sip:a@b", Headers: map[string]string{"Via": "SIP/2.0/UDP evil"}},
		{URI: "sip:a@b", Headers: map[string]string{"call-id": "x"}},
		{URI: "sip:a@b", Headers: map[string]string{"X-A": "one\r\nBYE sip:x SIP/2.0"}},
		{URI: "sip:a@b", Headers: map[string]string{"X A": "v"}},
		{URI: "sip:a@b", Headers: map[string]string{"": "v"}},
	}
	for _, tc := range bad {
		err := tc.check()
		if e, isErr := err.(*Error); !isErr || e.Code != CodeBadMessage {
			t.Errorf("%+v: got %v, want bad_message", tc, err)
		}
	}
}

func TestValidDigits(t *testing.T) {
	for _, d := range []string{"0", "12#", "*9A", "D"} {
		if !validDigits(d) {
			t.Errorf("%q refused", d)
		}
	}
	for _, d := range []string{"", "1x", "12 3"} {
		if validDigits(d) {
			t.Errorf("%q accepted", d)
		}
	}
}

func TestFailCause(t *testing.T) {
	for status, want := range map[int]string{486: "busy", 600: "busy", 408: "no_answer", 480: "no_answer",
		487: "no_answer", 403: ReasonRejected, 503: ReasonRejected, 603: ReasonRejected} {
		if got := failCause(status); got != want {
			t.Errorf("%d: %s, want %s", status, got, want)
		}
	}
}
