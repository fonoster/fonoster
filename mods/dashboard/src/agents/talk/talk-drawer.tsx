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
import { Mic, MicOff, Phone, PhoneOff } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CopyField } from "~/components/data/copy-field";
import { Alert } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { Sheet, SheetContent } from "~/components/ui/sheet";
import { cn } from "~/lib/utils";
import { useWorkspace } from "~/lib/workspace";
import { useAllNumbers } from "../agents.service";
import {
  canCallFromBrowser,
  useBrowserCall,
  type CallStatus
} from "./use-browser-call";

const TITLES: Record<CallStatus, string> = {
  idle: "Talk in the browser",
  connecting: "Connecting…",
  ringing: "Ringing…",
  connected: "Connected",
  ended: "Call ended",
  failed: "Call failed"
};

function elapsed(since: number | undefined, now: number) {
  if (!since) return "0:00";
  const seconds = Math.max(0, Math.floor((now - since) / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

/**
 * Talk to the saved agent: from the browser (WebRTC through Routr to the media nodes,
 * add-talk-in-browser) or by calling one of its numbers.
 */
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
        description="Calls reach the saved version"
        className="max-w-[440px]"
      >
        {open && (
          <>
            {dirty && (
              <Alert variant="warning">
                You have unsaved changes. Save first: calls reach the saved
                version.
              </Alert>
            )}
            {canCallFromBrowser() ? (
              <BrowserCall appRef={appRef} />
            ) : (
              <Alert variant="note">
                Calls from the browser need HTTPS or localhost. Open the
                dashboard at localhost on this machine, or call a number below.
              </Alert>
            )}
            <Numbers appRef={appRef} />
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function BrowserCall({ appRef }: { appRef: string }) {
  const call = useBrowserCall(appRef);
  const [now, setNow] = useState(() => Date.now());
  const live = ["connecting", "ringing", "connected"].includes(call.status);

  useEffect(() => {
    if (call.status !== "connected") return;
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [call.status]);

  return (
    <section
      aria-label="Talk in the browser"
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
            (call.status === "connecting" || call.status === "ringing") &&
              "animate-pulse"
          )}
        >
          {call.muted ? (
            <MicOff className="size-5" aria-hidden />
          ) : (
            <Mic className="size-5" aria-hidden />
          )}
        </span>
      </span>
      <div className="flex flex-col gap-1" aria-live="polite">
        <p className="font-display text-base font-medium">
          {TITLES[call.status]}
        </p>
        {call.status === "connected" ? (
          <p
            className="font-mono text-sm text-muted-foreground"
            aria-label="Call time"
          >
            {elapsed(call.connectedAt, now)}
          </p>
        ) : (
          call.status === "idle" && (
            <p className="font-display text-sm text-muted-foreground">
              Uses your microphone and speakers.
            </p>
          )
        )}
      </div>
      {call.error && <Alert variant="error">{call.error}</Alert>}
      {live ? (
        <div className="flex gap-3">
          {call.status === "connected" && (
            <Button
              variant="outline"
              aria-pressed={call.muted}
              onClick={call.toggleMute}
            >
              {call.muted ? <Mic aria-hidden /> : <MicOff aria-hidden />}
              {call.muted ? "Unmute" : "Mute"}
            </Button>
          )}
          <Button variant="destructive" onClick={() => void call.end()}>
            <PhoneOff aria-hidden /> Hang up
          </Button>
        </div>
      ) : (
        <Button onClick={() => void call.start()}>
          <Phone aria-hidden />
          {call.status === "idle" ? "Call" : "Call again"}
        </Button>
      )}
      {/* Remote audio: the agent's voice. */}
      <audio ref={call.audioRef} autoPlay className="hidden" />
    </section>
  );
}

const display = (telUrl: string) => telUrl.replace(/^tel:/, "");

function Numbers({ appRef }: { appRef: string }) {
  const workspace = useWorkspace();
  const numbers = useAllNumbers();
  const linked = (numbers.data ?? []).filter((n) => n.appRef === appRef);

  return (
    <section
      aria-label="Call this number"
      className="flex flex-col gap-4 rounded-xl border border-border bg-background px-5 py-6"
    >
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Phone className="size-4" aria-hidden />
        </span>
        <p className="font-display text-base font-medium">Call this number</p>
      </div>

      {numbers.isPending ? (
        <p className="font-display text-sm text-muted-foreground">
          Loading numbers…
        </p>
      ) : numbers.isError ? (
        <Alert variant="error">Couldn't load this agent's numbers.</Alert>
      ) : linked.length > 0 ? (
        <div className="flex flex-col gap-3">
          {linked.map((n) => (
            <CopyField
              key={n.ref}
              label={n.name || "Number"}
              value={display(n.telUrl)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="font-display text-sm text-muted-foreground">
            No phone number is linked to this agent yet. Link one to call it.
          </p>
          <Button asChild variant="outline">
            <Link to={`/w/${workspace.ref}/numbers`}>Go to Numbers</Link>
          </Button>
        </div>
      )}
    </section>
  );
}
