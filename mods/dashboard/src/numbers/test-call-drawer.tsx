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
import type { INumber } from "@fonoster/types";
import { Lock, Phone, PhoneMissed, PhoneOff } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Alert } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { Field } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { Sheet, SheetContent } from "~/components/ui/sheet";
import { cn } from "~/lib/utils";
import { formatNumber } from "./routing";
import {
  fromNumber,
  testCallError,
  toE164,
  VIEWS,
  type TestCallStatus
} from "./test-call";
import { useTestCall } from "./use-test-call";

function elapsed(since: number | undefined, now: number) {
  if (!since) return "0:00";
  const seconds = Math.max(0, Math.floor((now - since) / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export function TestCallDrawer({
  number,
  appName,
  onOpenChange,
  returnFocusTo
}: {
  /** The Number to call from; the drawer is open while it's set. */
  number?: INumber;
  /** The Agent or app the Number routes to. */
  appName: string;
  onOpenChange: (open: boolean) => void;
  /** The row's actions button: the menu item that opened this is gone by now. */
  returnFocusTo: (number: INumber) => HTMLElement | null;
}) {
  return (
    <Sheet open={Boolean(number)} onOpenChange={onOpenChange}>
      {number && (
        <TestCall
          number={number}
          appName={appName}
          returnFocusTo={returnFocusTo}
        />
      )}
    </Sheet>
  );
}

/** Mounted while the drawer is open: closing it stops reading the call's stream. */
function TestCall({
  number,
  appName,
  returnFocusTo
}: {
  number: INumber;
  appName: string;
  returnFocusTo: (number: INumber) => HTMLElement | null;
}) {
  const call = useTestCall();
  const [to, setTo] = useState("");
  const [invalid, setInvalid] = useState(false);
  const alertRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (call.error) alertRef.current?.focus();
  }, [call.error]);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (call.live) return;
    const e164 = toE164(to);
    setInvalid(!e164);
    if (!e164 || !number.appRef) return;
    void call.start({
      from: fromNumber(number.telUrl),
      to: e164,
      appRef: number.appRef
    });
  };

  return (
    <SheetContent
      monoTitle
      title={formatNumber(number.telUrl)}
      description={`Test call. ${appName} answers the call.`}
      onCloseAutoFocus={(event) => {
        const target = returnFocusTo(number);
        if (!target) return;
        event.preventDefault();
        target.focus();
      }}
      footer={
        // No button while the call is live: there is no hang-up.
        !call.live && (
          <>
            <span />
            <Button type="submit" form="test-call-form">
              <Phone aria-hidden />
              {call.status === "idle" ? "Call" : "Call again"}
            </Button>
          </>
        )
      }
    >
      <form
        id="test-call-form"
        onSubmit={onSubmit}
        className="flex flex-col gap-[22px]"
        noValidate
      >
        <Field
          label="Number to call"
          error={
            invalid ? "Enter a number to call, e.g. +18095550100" : undefined
          }
        >
          {(a11y) => (
            <div className="relative">
              <Input
                {...a11y}
                value={to}
                onChange={(event) => setTo(event.target.value)}
                readOnly={call.live}
                placeholder="+18095550100"
                inputMode="tel"
                autoComplete="off"
                className={cn(
                  "font-mono",
                  call.live && "bg-muted pr-9 text-muted-foreground"
                )}
              />
              {call.live && (
                <Lock
                  className="absolute top-1/2 right-3 size-3.5 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
              )}
            </div>
          )}
        </Field>
        {call.status !== "idle" && <CallStatus {...call} />}
        {call.live && (
          <Alert variant="note">
            Closing this panel doesn't end the call. Hang up the phone to end
            it.
          </Alert>
        )}
        {call.error && (
          <Alert variant="error" ref={alertRef} tabIndex={-1}>
            {testCallError(call.error)}
          </Alert>
        )}
      </form>
    </SheetContent>
  );
}

const ICONS: Partial<Record<TestCallStatus, typeof Phone>> = {
  ended: PhoneOff,
  busy: PhoneMissed,
  noAnswer: PhoneMissed,
  failed: PhoneMissed,
  lost: PhoneMissed
};

function CallStatus({
  status,
  answeredAt,
  endedAt
}: {
  status: TestCallStatus;
  answeredAt?: number;
  endedAt?: number;
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (status !== "answered") return;
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [status]);

  if (status === "idle") return null;
  const view = VIEWS[status];
  const Icon = ICONS[status] ?? Phone;
  const timed = status === "answered" || status === "ended";

  return (
    <section
      aria-label="Call status"
      className="flex flex-col items-center gap-3.5 rounded-xl border border-border bg-background px-6 py-7 text-center"
    >
      <span className="flex size-16 items-center justify-center rounded-full bg-muted">
        <span
          className={cn(
            "flex size-11 items-center justify-center rounded-full bg-card",
            status === "answered" ? "text-primary" : "text-muted-foreground",
            (status === "calling" || status === "ringing") && "animate-pulse"
          )}
        >
          <Icon className="size-5" aria-hidden />
        </span>
      </span>
      <div className="flex flex-col gap-1" aria-live="polite">
        <p className="font-display text-[15px] font-medium">{view.title}</p>
        {timed ? (
          <p
            className="font-mono text-sm text-muted-foreground"
            aria-label="Call time"
          >
            {elapsed(answeredAt, status === "ended" ? (endedAt ?? now) : now)}
          </p>
        ) : (
          view.line && (
            <p className="font-display text-[13px] text-muted-foreground">
              {view.line}
            </p>
          )
        )}
      </div>
    </section>
  );
}
