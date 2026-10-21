/**
 * Copyright (C) 2025 by Fonoster Inc (https://fonoster.com)
 * http://github.com/fonoster/fonoster
 *
 * This file is part of Fonoster
 *
 * Licensed under the MIT License (the "License");
 * you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 *
 *    https://opensource.org/licenses/MIT
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/*
 * The call's recording as a waveform: play and pause, click the waveform to seek, the time,
 * and a download. The bars are the recording's own peaks, decoded in the browser.
 */
import { Download, Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "~/lib/utils";
import { clock } from "./records";

const BARS = 96;

/** The loudest sample in each of `count` equal slices, scaled so the loudest slice is 1. */
export function peaks(samples: Float32Array, count = BARS): number[] {
  const size = Math.max(1, Math.floor(samples.length / count));
  const out: number[] = [];
  for (let i = 0; i < count; i++) {
    let peak = 0;
    for (let j = i * size; j < Math.min(samples.length, (i + 1) * size); j++)
      peak = Math.max(peak, Math.abs(samples[j]));
    out.push(peak);
  }
  const max = Math.max(...out);
  return max > 0 ? out.map((p) => p / max) : out;
}

async function decode(url: string): Promise<number[] | undefined> {
  const Context = window.AudioContext;
  if (!Context) return undefined;
  const context = new Context();
  try {
    const data = await (await fetch(url)).arrayBuffer();
    const audio = await context.decodeAudioData(data);
    return peaks(audio.getChannelData(0));
  } catch {
    return undefined;
  } finally {
    void context.close();
  }
}

export function WaveformPlayer({
  url,
  filename,
  durationMs
}: {
  url: string;
  filename: string;
  /** The call's length, shown until the audio reports its own. */
  durationMs: number;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [bars, setBars] = useState<number[]>();
  const [playing, setPlaying] = useState(false);
  const [at, setAt] = useState(0);
  const [length, setLength] = useState(durationMs);

  useEffect(() => {
    let live = true;
    void decode(url).then((b) => live && setBars(b));
    return () => {
      live = false;
    };
  }, [url]);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) void audio.play().catch(() => setPlaying(false));
    else audio.pause();
  };
  const seek = (fraction: number) => {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(audio.duration)) return;
    audio.currentTime = fraction * audio.duration;
    setAt(audio.currentTime * 1000);
  };
  const progress = length > 0 ? Math.min(1, at / length) : 0;
  const shown = bars ?? Array.from({ length: BARS }, () => 0.15);

  return (
    <div className="flex items-center gap-4">
      <audio
        ref={audioRef}
        src={url}
        aria-label="Call recording"
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onTimeUpdate={(e) => setAt(e.currentTarget.currentTime * 1000)}
        onLoadedMetadata={(e) => {
          const d = e.currentTarget.duration;
          if (Number.isFinite(d) && d > 0) setLength(d * 1000);
        }}
      />
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? "Pause" : "Play"}
        className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-foreground text-background outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {playing ? (
          <Pause className="size-4" aria-hidden />
        ) : (
          <Play className="ml-0.5 size-4" aria-hidden />
        )}
      </button>
      <div
        role="slider"
        tabIndex={0}
        aria-label="Seek"
        aria-valuemin={0}
        aria-valuemax={Math.round(length / 1000)}
        aria-valuenow={Math.round(at / 1000)}
        aria-valuetext={`${clock(at)} of ${clock(length)}`}
        onClick={(e) => {
          const box = e.currentTarget.getBoundingClientRect();
          seek((e.clientX - box.left) / box.width);
        }}
        onKeyDown={(e) => {
          const step = length > 0 ? 5000 / length : 0;
          if (e.key === "ArrowRight") seek(Math.min(1, progress + step));
          if (e.key === "ArrowLeft") seek(Math.max(0, progress - step));
        }}
        className="flex h-9 min-w-0 flex-1 cursor-pointer items-center gap-[2px] outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {shown.map((p, i) => (
          <span
            key={i}
            className={cn(
              "w-[2px] flex-1 rounded-full",
              i / shown.length < progress
                ? "bg-foreground"
                : "bg-muted-foreground/50"
            )}
            style={{ height: `${Math.max(8, p * 100)}%` }}
          />
        ))}
      </div>
      <span className="shrink-0 font-mono text-xs text-muted-foreground tabular-nums">
        {clock(at)} / {clock(length)}
      </span>
      <a
        href={url}
        download={filename}
        aria-label="Download"
        title="Download the recording"
        className="flex size-8 shrink-0 items-center justify-center rounded-control text-muted-foreground outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Download className="size-4" aria-hidden />
      </a>
    </div>
  );
}
