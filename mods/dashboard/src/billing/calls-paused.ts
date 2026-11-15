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
import type { Workspace } from "@fonoster/types";

/** The note next to a disabled Call button. */
export const CALLS_PAUSED = "Calls are paused in this workspace.";

/** A browser call refused for billing (402) while billing says calls aren't paused. */
export const CALL_NOT_STARTED = "The call couldn't start. Try again.";

const LEADS: Record<string, string> = {
  trial_ended: "The Trial has ended.",
  insufficient_balance: "Credits have run out."
};

/** The one sentence the bar, the notes and the refusals use for why calls are paused. */
export function pausedSentence(reason?: string): string {
  const lead = reason ? LEADS[reason] : undefined;
  return lead ? `${lead} ${CALLS_PAUSED}` : CALLS_PAUSED;
}

/** Whom someone other than the owner asks: the owner's name, else email. */
export function ownerLabel(workspace: Workspace): string {
  return (
    workspace.owner?.name || workspace.owner?.email || "the workspace owner"
  );
}
