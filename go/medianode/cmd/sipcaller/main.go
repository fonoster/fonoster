// Command sipcaller is the SIP caller bot behind a small HTTP API, so conformance harnesses in any
// language can drive real calls into a media node:
//
//	POST /calls               {"target":"127.0.0.1:5060","to":"+1555","from":"+1444","headers":{"X-App-Ref":"app-1"}}
//	                          (optional "requestHost": the Request-URI host, e.g. a Routr Trunk's inboundUri)
//	GET  /calls/{id}          {"sip":[100,180,200],"state":"answered","heardMs":..,"audibleMs":..}
//	POST /calls/{id}/dtmf     {"digits":"12#"}
//	POST /calls/{id}/audio    {"kind":"tone","ms":800}
//	POST /calls/{id}/hangup
package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"net"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/fonoster/fonoster/go/medianode/internal/caller"
)

func main() {
	listen := flag.String("listen", "127.0.0.1:0", "HTTP control address")
	host := flag.String("host", "127.0.0.1", "address for SIP and RTP")
	sipAdvertise := flag.String("sip-advertise", "", "host in Via and Contact when a proxy reaches the bot by another name (default: -host)")
	flag.Parse()

	bot, err := caller.NewWithOptions(caller.Options{Host: *host, SIPAdvertise: *sipAdvertise})
	if err != nil {
		log.Fatal(err)
	}
	defer bot.Close()

	mux := http.NewServeMux()
	mux.HandleFunc("POST /calls", func(w http.ResponseWriter, r *http.Request) {
		var req struct {
			Target, To, From string
			RequestHost      string
			Headers          map[string]string
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, err.Error(), 400)
			return
		}
		c, err := bot.DialVia(req.Target, req.RequestHost, req.To, req.From, req.Headers)
		if err != nil {
			http.Error(w, err.Error(), 502)
			return
		}
		writeJSON(w, c.Status())
	})
	withCall := func(f func(c *caller.Call, w http.ResponseWriter, r *http.Request)) http.HandlerFunc {
		return func(w http.ResponseWriter, r *http.Request) {
			c := bot.Get(r.PathValue("id"))
			if c == nil {
				http.Error(w, "no such call", 404)
				return
			}
			f(c, w, r)
		}
	}
	mux.HandleFunc("GET /calls/{id}", withCall(func(c *caller.Call, w http.ResponseWriter, r *http.Request) {
		// ?since=<unix ms> adds audio measurements from that time on.
		since := time.Time{}
		if ms, err := strconv.ParseInt(r.URL.Query().Get("since"), 10, 64); err == nil {
			since = time.UnixMilli(ms)
		}
		writeJSON(w, c.StatusSince(since))
	}))
	mux.HandleFunc("POST /calls/{id}/dtmf", withCall(func(c *caller.Call, w http.ResponseWriter, r *http.Request) {
		var req struct{ Digits string }
		_ = json.NewDecoder(r.Body).Decode(&req)
		go c.DTMF(req.Digits)
		writeJSON(w, c.Status())
	}))
	mux.HandleFunc("POST /calls/{id}/audio", withCall(func(c *caller.Call, w http.ResponseWriter, r *http.Request) {
		var req struct {
			Kind string
			Ms   int
		}
		_ = json.NewDecoder(r.Body).Decode(&req)
		c.Speak(req.Kind, req.Ms)
		writeJSON(w, c.Status())
	}))
	mux.HandleFunc("POST /calls/{id}/hangup", withCall(func(c *caller.Call, w http.ResponseWriter, _ *http.Request) {
		_ = c.Hangup()
		writeJSON(w, c.Status())
	}))

	mux.HandleFunc("GET /calls", func(w http.ResponseWriter, _ *http.Request) {
		writeJSON(w, map[string]any{"calls": bot.Calls(), "refers": bot.Refers()})
	})
	mux.HandleFunc("POST /callee", func(w http.ResponseWriter, r *http.Request) {
		var req struct {
			Mode    string
			AfterMs int
		}
		_ = json.NewDecoder(r.Body).Decode(&req)
		bot.Callee(req.Mode, time.Duration(req.AfterMs)*time.Millisecond)
		w.WriteHeader(204)
	})
	// The bot's own SIP address, for the node's outbound proxy in tests.
	mux.HandleFunc("GET /sip", func(w http.ResponseWriter, _ *http.Request) {
		writeJSON(w, map[string]string{"address": bot.Address()})
	})

	l, err := net.Listen("tcp", *listen)
	if err != nil {
		log.Fatal(err)
	}
	// The first stdout line tells the harness where to reach us.
	fmt.Println("listening " + strings.TrimSpace(l.Addr().String()))
	log.Fatal(http.Serve(l, mux))
}

func writeJSON(w http.ResponseWriter, v any) {
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(v)
}
