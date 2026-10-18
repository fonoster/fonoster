package netguard

import (
	"errors"
	"net/http"
	"net/http/httptest"
	"net/netip"
	"testing"
	"time"
)

func TestIsPrivate(t *testing.T) {
	for _, s := range []string{"127.0.0.1", "10.0.0.1", "172.31.255.1", "192.168.0.1", "169.254.169.254",
		"100.64.0.1", "0.0.0.0", "224.0.0.1", "::1", "::", "fe80::1", "fd00::1", "::ffff:127.0.0.1"} {
		if !IsPrivate(netip.MustParseAddr(s)) {
			t.Errorf("%s should be private", s)
		}
	}
	for _, s := range []string{"8.8.8.8", "2606:4700:4700::1111"} {
		if IsPrivate(netip.MustParseAddr(s)) {
			t.Errorf("%s should be public", s)
		}
	}
}

func TestCheckURL(t *testing.T) {
	g := New(nil)
	for _, u := range []string{"file:///etc/passwd", "http://127.0.0.1/x.wav", "http://169.254.169.254/",
		"http://[::1]/", "http://localhost/", "http://minio:9000/a.wav", "https://metadata.google.internal/"} {
		if _, err := g.CheckURL(u); !errors.Is(err, ErrUnsafe) {
			t.Errorf("%s: want ErrUnsafe, got %v", u, err)
		}
	}
	if _, err := g.CheckURL("https://8.8.8.8/music.wav"); err != nil {
		t.Fatal(err)
	}
	if _, err := New([]string{"10.0.0.0/8", "minio"}).CheckURL("http://minio:9000/a.wav"); err != nil {
		t.Fatal(err)
	}
}

func TestClientRefusesPrivateAndRedirects(t *testing.T) {
	hits := 0
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		hits++
		if r.URL.Path == "/redirect" {
			http.Redirect(w, r, "http://169.254.169.254/latest", http.StatusFound)
			return
		}
		_, _ = w.Write([]byte("ok"))
	}))
	defer srv.Close()

	strict := New(nil)
	if _, err := strict.Get(strict.Client(time.Second), srv.URL+"/"); !errors.Is(err, ErrUnsafe) {
		t.Fatalf("want ErrUnsafe, got %v", err)
	}
	// The dial check alone (no URL check) also refuses: rebinding cannot get past it.
	if _, err := strict.Client(time.Second).Get(srv.URL + "/"); err == nil {
		t.Fatal("guarded client connected to a loopback address")
	}
	if hits != 0 {
		t.Fatalf("%d requests reached the server", hits)
	}
	allowed := New([]string{"127.0.0.1"})
	c := allowed.Client(time.Second)
	res, err := allowed.Get(c, srv.URL+"/")
	if err != nil {
		t.Fatal(err)
	}
	res.Body.Close()
	if _, err := allowed.Get(c, srv.URL+"/redirect"); !errors.Is(err, ErrUnsafe) {
		t.Fatalf("redirect to metadata: want ErrUnsafe, got %v", err)
	}
}
