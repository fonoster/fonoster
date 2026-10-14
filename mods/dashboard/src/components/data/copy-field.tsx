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
import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "~/components/ui/sonner";
import { cn } from "~/lib/utils";

/** A read-only value with a copy button (keys, refs, secrets shown once). */
export function CopyField({
  label,
  value,
  className
}: {
  label: string;
  value: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Couldn't copy. Select the text and copy it instead.");
    }
  };

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <span className="font-display text-xs text-muted-foreground">
        {label}
      </span>
      <div className="flex h-10 items-center gap-2.5 rounded-control border border-input bg-background px-3">
        <code
          className="flex-1 truncate text-[13px] text-foreground"
          aria-label={label}
        >
          {value}
        </code>
        <button
          type="button"
          onClick={() => void copy()}
          aria-label={`Copy ${label}`}
          className="cursor-pointer rounded-[6px] p-1 text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          {copied ? (
            <Check className="size-[15px]" />
          ) : (
            <Copy className="size-[15px]" />
          )}
        </button>
      </div>
    </div>
  );
}
