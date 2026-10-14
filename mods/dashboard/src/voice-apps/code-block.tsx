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

/** A copy button for code (local; candidate for components/data). */
export function CopyButton({
  value,
  label,
  className
}: {
  value: string;
  label: string;
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
    <button
      type="button"
      onClick={() => void copy()}
      aria-label={label}
      className={cn(
        "inline-flex cursor-pointer items-center gap-1 rounded-[6px] px-1.5 py-0.5 font-display text-xs text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring",
        className
      )}
    >
      {copied ? (
        <Check className="size-3.5" aria-hidden />
      ) : (
        <Copy className="size-3.5" aria-hidden />
      )}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

/** A titled, copyable code block (local; candidate for components/data). */
export function CodeBlock({
  title,
  code,
  className
}: {
  title: string;
  code: string;
  className?: string;
}) {
  return (
    <figure
      className={cn(
        "flex min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-muted/40",
        className
      )}
    >
      <figcaption className="flex items-center justify-between gap-2 border-b border-border px-4 py-2.5">
        <span className="font-mono text-xs text-foreground">{title}</span>
        <CopyButton value={code} label={`Copy ${title}`} />
      </figcaption>
      <pre className="overflow-x-auto p-4 font-mono text-[11px] leading-[1.6] text-foreground">
        <code>{code}</code>
      </pre>
    </figure>
  );
}
