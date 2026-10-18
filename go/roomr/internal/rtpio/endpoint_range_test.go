package rtpio

import "testing"

func TestPortRange(t *testing.T) {
	SetPortRange(41000, 41001)
	defer SetPortRange(0, 0)
	a, err := Listen("127.0.0.1")
	if err != nil {
		t.Fatal(err)
	}
	b, err := Listen("127.0.0.1")
	if err != nil {
		t.Fatal(err)
	}
	if a.Port() == b.Port() || a.Port() < 41000 || b.Port() > 41001 {
		t.Fatalf("ports %d %d outside range", a.Port(), b.Port())
	}
	if _, err := Listen("127.0.0.1"); err == nil {
		t.Fatal("expected exhausted range")
	}
	a.conn.Close()
	if c, err := Listen("127.0.0.1"); err != nil {
		t.Fatal(err)
	} else {
		c.conn.Close()
	}
	b.conn.Close()
}
