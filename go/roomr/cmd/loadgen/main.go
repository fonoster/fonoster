// Command loadgen is the media node's load harness (add-media-node 1.5 and 1.6). It plays both
// the callers and the gateway against a running node:
//
//   - a caller bot places -calls SIP calls (one codec, -codec) at -rate calls per second;
//   - for each call it claims call.incoming on NATS, adds a session participant (L16/16000 RTP
//     from this process) and answers, like the gateway;
//   - both sides send audio every 20 ms for -duration; every -dtmf-every each caller presses a
//     key (RFC 4733), and the harness counts the dtmf events the node reports;
//   - optional impairment on the caller → node direction: -loss, -jitter, -reorder.
//
// At the end it prints one JSON report: frames the session side expected and received (sequence
// gaps), the node's own counters (GET /stats on its debug endpoint: missed clock ticks, jitter
// buffer late/overflow/lost), keypresses injected and reported, and the node's CPU when -pid is
// given. Start the node with GOMAXPROCS=2 to approximate 2 vCPU.
package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"math"
	"math/rand"
	"net/http"
	"os"
	"os/exec"
	"strconv"
	"strings"
	"sync"
	"sync/atomic"
	"time"

	"github.com/fonoster/fonoster/go/roomr/internal/audio"
	"github.com/fonoster/fonoster/go/roomr/internal/caller"
	"github.com/fonoster/fonoster/go/roomr/internal/rtpio"
	"github.com/nats-io/nats.go"
	"github.com/pion/rtp"
)

type session struct {
	room     string
	ep       *rtpio.Endpoint
	mu       sync.Mutex
	started  bool
	lastSeq  uint16
	received uint64
	gaps     uint64
	first    time.Time
	last     time.Time
}

func (s *session) packet(p *rtp.Packet) {
	s.mu.Lock()
	defer s.mu.Unlock()
	now := time.Now()
	if !s.started {
		s.started, s.first = true, now
	} else if d := p.SequenceNumber - s.lastSeq; d > 1 && d < 1000 {
		s.gaps += uint64(d - 1)
	}
	s.lastSeq, s.last = p.SequenceNumber, now
	s.received++
}

type report struct {
	Calls        int     `json:"calls"`
	Answered     int     `json:"answered"`
	Codec        string  `json:"codec"`
	DurationSec  float64 `json:"durationSec"`
	Impairment   string  `json:"impairment"`
	SessionSide  any     `json:"sessionSide"`
	CallerSide   any     `json:"callerSide"`
	Node         any     `json:"node"`
	DTMF         any     `json:"dtmf"`
	NodeCPU      any     `json:"nodeCpu,omitempty"`
	SetupErrors  int64   `json:"setupErrors"`
	SetupSeconds float64 `json:"setupSeconds"`
}

func main() {
	natsURL := flag.String("nats", "nats://127.0.0.1:4222", "NATS URL")
	nodeID := flag.String("node-id", "", "the node's id")
	target := flag.String("sip", "127.0.0.1:5060", "the node's SIP address")
	debug := flag.String("debug", "", "the node's debug address (for /stats)")
	calls := flag.Int("calls", 200, "concurrent calls")
	rate := flag.Float64("rate", 20, "new calls per second")
	duration := flag.Duration("duration", time.Minute, "how long all calls stay up together")
	codec := flag.String("codec", audio.NamePCMU, "the callers' codec")
	dtmfEvery := flag.Duration("dtmf-every", 5*time.Second, "keypress interval per call (0: none)")
	loss := flag.Float64("loss", 0, "packet loss, 0..1, caller → node")
	jitterMax := flag.Duration("jitter", 0, "uniform random delay up to this, caller → node")
	reorder := flag.Float64("reorder", 0, "share of packets held back 40 ms (reordered), caller → node")
	pid := flag.Int("pid", 0, "node process id, to sample its CPU with ps")
	flag.Parse()
	if *nodeID == "" {
		log.Fatal("-node-id is required")
	}

	nc, err := nats.Connect(*natsURL)
	if err != nil {
		log.Fatal(err)
	}
	defer nc.Close()
	bot, err := caller.New("127.0.0.1")
	if err != nil {
		log.Fatal(err)
	}
	defer bot.Close()

	command := func(cmd map[string]any) (map[string]any, error) {
		data, _ := json.Marshal(cmd)
		msg, err := nc.Request("media."+*nodeID+".commands", data, 5*time.Second)
		if err != nil {
			return nil, err
		}
		var reply map[string]any
		err = json.Unmarshal(msg.Data, &reply)
		return reply, err
	}

	var (
		mu         sync.Mutex
		sessions   = map[string]*session{}
		dtmfByRoom = map[string]int{}
		setupErrs  atomic.Int64
	)
	// The gateway: claim, add the session participant, answer.
	_, err = nc.Subscribe("gateway.incoming", func(m *nats.Msg) {
		var ev map[string]any
		if json.Unmarshal(m.Data, &ev) != nil || ev["nodeId"] != *nodeID {
			return
		}
		_ = m.Respond([]byte(fmt.Sprintf(`{"type":"claimed","id":%q}`, ev["id"])))
		room, _ := ev["roomRef"].(string)
		go func() {
			ep, err := rtpio.Listen("127.0.0.1")
			if err != nil {
				setupErrs.Add(1)
				return
			}
			s := &session{room: room, ep: ep}
			rep, err := command(map[string]any{"type": "participant.add", "id": "s-" + room, "roomRef": room, "kind": "session",
				"rtp": map[string]any{"host": "127.0.0.1", "port": ep.Port(), "codec": audio.NameL16, "payloadType": 96, "ptime": 20, "ssrc": 1}})
			if err != nil || rep["type"] != "ack" {
				setupErrs.Add(1)
				ep.Close()
				return
			}
			block := rep["rtp"].(map[string]any)
			_ = ep.Configure(audio.L16{}, 96, -1, "127.0.0.1", int(block["port"].(float64)))
			go ep.Serve(rtpio.Handlers{Packet: s.packet})
			mu.Lock()
			sessions[room] = s
			mu.Unlock()
			if rep, err := command(map[string]any{"type": "answer", "id": "a-" + room, "roomRef": room}); err != nil || rep["type"] != "ack" {
				setupErrs.Add(1)
			}
		}()
	})
	if err != nil {
		log.Fatal(err)
	}
	_, _ = nc.Subscribe("media."+*nodeID+".events.*", func(m *nats.Msg) {
		var ev map[string]any
		if json.Unmarshal(m.Data, &ev) != nil || ev["type"] != "dtmf" {
			return
		}
		mu.Lock()
		dtmfByRoom[ev["roomRef"].(string)]++
		mu.Unlock()
	})
	_ = nc.Flush()

	impair := ""
	if *loss > 0 || *jitterMax > 0 || *reorder > 0 {
		impair = fmt.Sprintf("loss=%.1f%% jitter<=%v reorder=%.1f%%", *loss*100, *jitterMax, *reorder*100)
	}
	impairFn := func() (int, time.Duration) {
		if *loss > 0 && rand.Float64() < *loss {
			return 0, 0
		}
		var d time.Duration
		if *jitterMax > 0 {
			d = time.Duration(rand.Int63n(int64(*jitterMax)))
		}
		if *reorder > 0 && rand.Float64() < *reorder {
			d += 40 * time.Millisecond
		}
		return 1, d
	}

	// Place the calls.
	setupStart := time.Now()
	placed := []*caller.Call{}
	interval := time.Duration(float64(time.Second) / *rate)
	for i := 0; i < *calls; i++ {
		c, err := bot.DialWith(*target, fmt.Sprintf("+1555%07d", i), "", map[string]string{"X-App-Ref": "load"},
			caller.DialOptions{Codecs: []string{*codec}})
		if err != nil {
			setupErrs.Add(1)
			continue
		}
		if impair != "" {
			c.SetImpair(impairFn)
		}
		placed = append(placed, c)
		time.Sleep(interval)
	}
	// Wait for answers.
	deadline := time.Now().Add(30 * time.Second)
	answered := 0
	for time.Now().Before(deadline) {
		answered = 0
		for _, c := range placed {
			if c.Status().State == "answered" {
				answered++
			}
		}
		if answered == len(placed) {
			break
		}
		time.Sleep(200 * time.Millisecond)
	}
	setupSecs := time.Since(setupStart).Seconds()
	log.Printf("%d/%d calls answered in %.1fs; holding for %v", answered, len(placed), setupSecs, *duration)

	// Reset counters at the start of the measured window.
	stats0 := nodeStats(*debug)
	mu.Lock()
	for _, s := range sessions {
		s.mu.Lock()
		s.received, s.gaps = 0, 0
		s.mu.Unlock()
	}
	for k := range dtmfByRoom {
		delete(dtmfByRoom, k)
	}
	mu.Unlock()
	heard0 := map[string]int{}
	for _, c := range placed {
		heard0[c.ID] = c.Status().HeardMs
	}

	// Hold: callers talk (a tone), sessions send audio, keypresses every dtmfEvery.
	stop := make(chan struct{})
	var wg sync.WaitGroup
	mu.Lock()
	all := make([]*session, 0, len(sessions))
	for _, s := range sessions {
		all = append(all, s)
	}
	mu.Unlock()
	wg.Add(1)
	go func() {
		defer wg.Done()
		t := time.NewTicker(audio.FrameMs * time.Millisecond)
		defer t.Stop()
		frame := audio.Silence()
		for i := range frame {
			frame[i] = int16(3000 * math.Sin(2*math.Pi*300*float64(i)/audio.Rate))
		}
		for {
			select {
			case <-stop:
				return
			case <-t.C:
			}
			for _, s := range all {
				s.ep.Send(frame)
			}
		}
	}()
	injected := 0
	windowStart := time.Now()
	cpu := []float64{}
	nextDTMF := time.Now().Add(*dtmfEvery)
	if *dtmfEvery == 0 {
		nextDTMF = time.Now().Add(time.Hour * 24)
	}
	for _, c := range placed {
		c.Speak("tone:440", int(duration.Milliseconds()))
	}
	for time.Since(windowStart) < *duration {
		time.Sleep(time.Second)
		if *pid > 0 {
			if v, err := psCPU(*pid); err == nil {
				cpu = append(cpu, v)
			}
		}
		if time.Now().After(nextDTMF) && time.Until(windowStart.Add(*duration)) > 2*time.Second {
			for _, c := range placed {
				if c.Status().State == "answered" {
					go c.DTMFVia(string("0123456789*#"[injected%12]), "rfc4733")
				}
			}
			injected++
			nextDTMF = nextDTMF.Add(*dtmfEvery)
		}
	}
	window := time.Since(windowStart)
	// Session side: frames expected from the node versus received, in the window.
	var received, gaps uint64
	for _, s := range all {
		s.mu.Lock()
		received += s.received
		gaps += s.gaps
		s.mu.Unlock()
	}
	heardTotal, heardExpected := 0, 0
	for _, c := range placed {
		heardTotal += c.Status().HeardMs - heard0[c.ID]
		heardExpected += int(window.Milliseconds())
	}
	stats1 := nodeStats(*debug)
	time.Sleep(time.Second) // let the last keypresses land
	close(stop)
	wg.Wait()
	mu.Lock()
	dtmfReported, rooms, roomsExact := 0, 0, 0
	for _, n := range dtmfByRoom {
		dtmfReported += n
		rooms++
		if n == injected {
			roomsExact++
		}
	}
	mu.Unlock()
	expected := uint64(window/(audio.FrameMs*time.Millisecond)) * uint64(len(all))
	r := report{
		Calls: len(placed), Answered: answered, Codec: *codec, DurationSec: window.Seconds(), Impairment: impair,
		SetupErrors: setupErrs.Load(), SetupSeconds: setupSecs,
		SessionSide: map[string]any{"expectedFrames": expected, "receivedFrames": received, "sequenceGaps": gaps},
		CallerSide:  map[string]any{"heardMs": heardTotal, "expectedMs": heardExpected},
		DTMF: map[string]any{"injectedPerCall": injected, "expected": injected * answered, "reported": dtmfReported,
			"roomsExact": roomsExact, "roomsWithAny": rooms},
		Node: diffStats(stats0, stats1),
	}
	if len(cpu) > 0 {
		var sum, peak float64
		for _, v := range cpu {
			sum += v
			peak = math.Max(peak, v)
		}
		r.NodeCPU = map[string]any{"avgPercent": sum / float64(len(cpu)), "peakPercent": peak, "samples": len(cpu)}
	}
	out, _ := json.MarshalIndent(r, "", "  ")
	fmt.Println(string(out))

	for _, c := range placed {
		_ = c.Hangup()
	}
	time.Sleep(time.Second)
}

func nodeStats(debug string) map[string]any {
	if debug == "" {
		return nil
	}
	res, err := http.Get("http://" + debug + "/stats")
	if err != nil {
		return nil
	}
	defer res.Body.Close()
	var s map[string]any
	_ = json.NewDecoder(res.Body).Decode(&s)
	return s
}

// diffStats subtracts numeric counters (nested one level) so the report covers the window only.
func diffStats(a, b map[string]any) map[string]any {
	if b == nil {
		return nil
	}
	out := map[string]any{}
	for k, v := range b {
		switch bv := v.(type) {
		case float64:
			av, _ := a[k].(float64)
			out[k] = bv - av
		case map[string]any:
			am, _ := a[k].(map[string]any)
			out[k] = diffStats(am, bv)
		}
	}
	out["rooms"] = b["rooms"]
	return out
}

func psCPU(pid int) (float64, error) {
	out, err := exec.Command("ps", "-o", "%cpu=", "-p", strconv.Itoa(pid)).Output()
	if err != nil {
		return 0, err
	}
	return strconv.ParseFloat(strings.TrimSpace(string(out)), 64)
}

func init() { log.SetOutput(os.Stderr) }
