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
import {
  Check,
  Info,
  MessageSquare,
  Mic,
  Phone,
  PhoneOff,
  Smartphone
} from "lucide-react";
import { useEffect, useState } from "react";
import { Alert } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { Sheet, SheetContent } from "~/components/ui/sheet";
import { cn } from "~/lib/utils";
import { useBrowserCall, type CallStatus } from "./use-browser-call";

const STEPS: { status: CallStatus; label: string }[] = [
  { status: "dialing", label: "Dialing" },
  { status: "ringing", label: "Ringing" },
  { status: "connected", label: "Connected" }
];

const TITLES: Record<CallStatus, string> = {
  idle: "Ready to call",
  dialing: "Dialing…",
  ringing: "Ringing…",
  connected: "Connected in browser",
  ended: "Call ended",
  failed: "Call failed"
};

function elapsed(since: number | undefined, now: number) {
  if (!since) return "0:00";
  const seconds = Math.max(0, Math.floor((now - since) / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

/** Talk to the saved agent from the browser. Phone and chat come later. */
export function TalkDrawer({
  open,
  onOpenChange,
  appRef,
  name,
  dirty
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appRef: string;
  name: string;
  /** The editor has unsaved changes the call won't use. */
  dirty: boolean;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        title={`Talk to ${name}`}
        description="Tests the saved version"
        className="max-w-[440px]"
      >
        {open && <TalkBody appRef={appRef} dirty={dirty} />}
      </SheetContent>
    </Sheet>
  );
}

function TalkBody({ appRef, dirty }: { appRef: string; dirty: boolean }) {
  const call = useBrowserCall(appRef);
  const [now, setNow] = useState(() => Date.now());
  const live = ["dialing", "ringing", "connected"].includes(call.status);

  useEffect(() => {
    if (call.status !== "connected") return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [call.status]);

  const reached = STEPS.findIndex((step) => step.status === call.status);

  return (
    <>
      <div
        role="tablist"
        aria-label="How to talk"
        className="grid grid-cols-3 gap-1 rounded-control bg-muted p-1"
      >
        <ModeTab icon={Mic} label="In browser" selected />
        <ModeTab icon={Smartphone} label="Call my phone" />
        <ModeTab icon={MessageSquare} label="Chat" />
      </div>

      {dirty && (
        <Alert variant="warning">
          You have unsaved changes. Save first to test them.
        </Alert>
      )}

      <div className="flex items-center gap-2.5 rounded-control border border-border px-3 py-2.5 font-display text-[13px] text-muted-foreground">
        <Mic className="size-4" aria-hidden />
        Uses your default microphone. Your browser asks for access.
      </div>

      <section
        aria-label="Call"
        className="flex flex-col items-center gap-4 rounded-xl border border-border bg-background px-6 py-8 text-center"
      >
        <span
          className={cn(
            "flex size-[72px] items-center justify-center rounded-full",
            call.status === "connected" ? "bg-brand-subtle" : "bg-muted"
          )}
        >
          <span
            className={cn(
              "flex size-12 items-center justify-center rounded-full",
              live
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground",
              (call.status === "dialing" || call.status === "ringing") &&
                "animate-pulse"
            )}
          >
            <Phone className="size-5" aria-hidden />
          </span>
        </span>
        <div className="flex flex-col gap-1" aria-live="polite">
          <p className="font-display text-base font-medium">
            {TITLES[call.status]}
          </p>
          {call.status === "connected" && (
            <p
              className="font-mono text-sm text-muted-foreground"
              aria-label="Call time"
            >
              {elapsed(call.connectedAt, now)}
            </p>
          )}
        </div>
        {live && (
          <ol className="flex flex-wrap justify-center gap-3 font-display text-xs">
            {STEPS.map((step, index) => (
              <li
                key={step.status}
                className={cn(
                  "flex items-center gap-1",
                  index <= reached ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {index <= reached && <Check className="size-3" aria-hidden />}
                {step.label}
              </li>
            ))}
          </ol>
        )}
        {call.error && <Alert variant="error">{call.error}</Alert>}
        {live ? (
          <Button variant="destructive" onClick={() => void call.end()}>
            <PhoneOff aria-hidden /> End call
          </Button>
        ) : (
          <Button onClick={() => void call.start()}>
            <Phone aria-hidden />
            {call.status === "idle" ? "Start call" : "Call again"}
          </Button>
        )}
      </section>

      <p className="flex gap-2 font-display text-xs text-muted-foreground">
        <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        Uses the saved version. Calling a real phone and chatting with the agent
        are coming soon.
      </p>
      {/* Remote audio: the agent's voice. */}
      <audio ref={call.audioRef} autoPlay className="hidden" />
    </>
  );
}

function ModeTab({
  icon: Icon,
  label,
  selected
}: {
  icon: typeof Mic;
  label: string;
  selected?: boolean;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={Boolean(selected)}
      disabled={!selected}
      title={selected ? undefined : "Coming soon"}
      className={cn(
        "flex items-center justify-center gap-1.5 rounded-[6px] px-2 py-2 font-display text-xs disabled:cursor-not-allowed disabled:opacity-50",
        selected ? "bg-background text-foreground" : "text-muted-foreground"
      )}
    >
      <Icon className="size-3.5" aria-hidden />
      {label}
      {!selected && <span className="sr-only"> (coming soon)</span>}
    </button>
  );
}
