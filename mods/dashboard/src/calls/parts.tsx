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
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight } from "lucide-react";
import { cn } from "~/lib/utils";
import {
  DIRECTION_LABEL,
  callDirection,
  callStatus,
  type Tone
} from "./format";

const DIRECTION_ICON = {
  inbound: ArrowDownLeft,
  outbound: ArrowUpRight,
  internal: ArrowLeftRight
};

/** A small arrow for the call's direction, with its name for screen readers. */
export function DirectionIcon({
  direction,
  className
}: {
  direction: string;
  className?: string;
}) {
  const kind = callDirection(direction);
  const Icon = DIRECTION_ICON[kind];
  return (
    <span className="inline-flex" title={DIRECTION_LABEL[kind]}>
      <Icon
        className={cn("size-3.5 text-muted-foreground", className)}
        aria-hidden
      />
      <span className="sr-only">{DIRECTION_LABEL[kind]}</span>
    </span>
  );
}

export const TONE_DOT: Record<Tone, string> = {
  success: "bg-primary",
  warning: "bg-warning-foreground",
  error: "bg-destructive",
  muted: "bg-muted-foreground"
};

export function StatusDot({ status }: { status: string }) {
  const { label, tone } = callStatus(status);
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap">
      <span
        className={cn("size-1.5 shrink-0 rounded-full", TONE_DOT[tone])}
        aria-hidden
      />
      {label}
    </span>
  );
}
