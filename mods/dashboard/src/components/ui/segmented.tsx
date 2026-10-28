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
import type { ComponentType } from "react";
import { cn } from "~/lib/utils";

/** A choice between a few options, drawn as a row of buttons on a muted track. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  labelledBy
}: {
  options: {
    value: T;
    label: string;
    icon?: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  }[];
  value: T;
  onChange: (value: T) => void;
  /** The id of the element that names the choice. */
  labelledBy: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-labelledby={labelledBy}
      className="grid auto-cols-fr grid-flow-col gap-1 rounded-control bg-muted p-1"
    >
      {options.map(({ value: option, label, icon: Icon }) => {
        const active = option === value;
        return (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option)}
            className={cn(
              "flex cursor-pointer items-center justify-center gap-1.5 rounded-[6px] px-2 py-1.5 font-display text-[13px] text-text-secondary outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default disabled:opacity-50",
              active && "bg-background text-foreground shadow-sm"
            )}
          >
            {Icon && <Icon className="size-3.5" aria-hidden />}
            {label}
          </button>
        );
      })}
    </div>
  );
}
