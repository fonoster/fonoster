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
import { pausedSentence } from "~/billing/calls-paused";
import { errorMessage, grpcCode, GrpcCode } from "~/lib/errors";

export type TestCallStatus =
  | "idle"
  | "calling"
  | "ringing"
  | "answered"
  | "ended"
  | "busy"
  | "noAnswer"
  | "failed"
  | "lost";

/** The call is still going: the field is read-only and there is no button. */
export const LIVE: TestCallStatus[] = ["calling", "ringing", "answered"];

export const VIEWS: Record<
  Exclude<TestCallStatus, "idle">,
  { title: string; line?: string }
> = {
  calling: { title: "Calling…" },
  ringing: { title: "Ringing…" },
  answered: { title: "Answered" },
  ended: { title: "Call ended" },
  busy: { title: "Busy", line: "The line was busy. Try again later." },
  noAnswer: {
    title: "No answer",
    line: "Nobody answered. Try again, or check the number."
  },
  failed: {
    title: "Call failed",
    line: "The call couldn't be completed. Try again."
  },
  lost: {
    title: "Can't show progress",
    line: "The call may still be ringing. Check Calls for its result."
  }
};

/** A TrackCall status, as the SDK names it (NOANSWER arrives as "ERROR"). */
export function fromStreamStatus(
  status: string | undefined
): TestCallStatus | undefined {
  switch (status) {
    case "TRYING":
      return "calling";
    case "PROGRESS":
      return "ringing";
    case "ANSWER":
      return "answered";
    case "BUSY":
      return "busy";
    case "ERROR":
      return "noAnswer";
    case "FAILED":
      return "failed";
  }
}

const E164 = /^\+[1-9][0-9]{6,14}$/;

/** The number to call in E.164, or undefined when it isn't one. Spaces and dashes are dropped. */
export function toE164(input: string): string | undefined {
  const number = input.trim().replace(/[\s().-]/g, "");
  return E164.test(number) ? number : undefined;
}

/** The Number's telUrl as CreateCall's `from`, which takes E.164 without "tel:". */
export function fromNumber(telUrl: string): string {
  return telUrl.replace(/^tel:/, "");
}

/** Billing's refusals that pause every call in the workspace (the bar says the same). */
const PAUSES = ["trial_ended", "insufficient_balance"];

const REFUSALS: Record<string, string> = {
  trial_ended: pausedSentence("trial_ended"),
  insufficient_balance: pausedSentence("insufficient_balance"),
  concurrency_limit:
    "Too many calls at once. Wait for one to end, then try again."
};

/** Why CreateCall refused the call (FAILED_PRECONDITION "refused: <reason>"), if it did. */
function refusal(error: unknown): string | undefined {
  if (grpcCode(error) !== GrpcCode.FAILED_PRECONDITION) return undefined;
  const message = String((error as { message?: unknown })?.message ?? "");
  return /refused: ([a-z_]+)/.exec(message)?.[1];
}

/** CreateCall was refused because billing paused calls: the paused state needs a refresh. */
export function pausedByBilling(error: unknown): boolean {
  const reason = refusal(error);
  return Boolean(reason && PAUSES.includes(reason));
}

/** What the drawer says when CreateCall fails. */
export function testCallError(error: unknown): string {
  if (grpcCode(error) === GrpcCode.RESOURCE_EXHAUSTED)
    return "No line is free to place the call. Try again in a minute.";
  const reason = refusal(error);
  if (reason && REFUSALS[reason]) return REFUSALS[reason];
  return errorMessage(error);
}
