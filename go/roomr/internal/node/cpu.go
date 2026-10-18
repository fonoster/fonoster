package node

import (
	"bufio"
	"os"
	"runtime"
	"strconv"
	"strings"
	"sync"
	"time"
)

// cpuSampler reports the share of CPU left idle since the previous sample (the heartbeat's
// cpu_idle, 0 to 1): the host's from /proc/stat where it exists, else what this process left of
// its CPUs.
type cpuSampler struct {
	mu                 sync.Mutex
	idle, total        uint64 // /proc/stat jiffies at the last sample
	proc               time.Duration
	at                 time.Time
	last               float64
	procStatUnreadable bool
}

// sample returns the idle share since the last call (1 on the first call).
func (c *cpuSampler) sample() float64 {
	c.mu.Lock()
	defer c.mu.Unlock()
	if !c.procStatUnreadable {
		if idle, total, ok := readProcStat(); ok {
			if c.total != 0 && total > c.total {
				c.last = float64(idle-c.idle) / float64(total-c.total)
			} else if c.total == 0 {
				c.last = 1
			}
			c.idle, c.total = idle, total
			return clamp01(c.last)
		}
		c.procStatUnreadable = true
	}
	now, used := time.Now(), processCPU()
	if !c.at.IsZero() && now.After(c.at) {
		wall := now.Sub(c.at) * time.Duration(runtime.NumCPU())
		c.last = 1 - float64(used-c.proc)/float64(wall)
	} else {
		c.last = 1
	}
	c.at, c.proc = now, used
	return clamp01(c.last)
}

func clamp01(f float64) float64 {
	switch {
	case f < 0:
		return 0
	case f > 1:
		return 1
	}
	return f
}

// readProcStat reads the aggregate cpu line of /proc/stat: idle (idle + iowait) and total jiffies.
func readProcStat() (idle, total uint64, ok bool) {
	f, err := os.Open("/proc/stat")
	if err != nil {
		return 0, 0, false
	}
	defer f.Close()
	sc := bufio.NewScanner(f)
	if !sc.Scan() {
		return 0, 0, false
	}
	fields := strings.Fields(sc.Text())
	if len(fields) < 5 || fields[0] != "cpu" {
		return 0, 0, false
	}
	for i, s := range fields[1:] {
		v, err := strconv.ParseUint(s, 10, 64)
		if err != nil {
			return 0, 0, false
		}
		total += v
		if i == 3 || i == 4 { // idle, iowait
			idle += v
		}
	}
	return idle, total, true
}
