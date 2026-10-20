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
import type { ComponentProps } from "react";
import { useCapabilities } from "~/lib/capabilities";
import { cn } from "~/lib/utils";

/**
 * Where the install's SIP names live, as Twilio splits them: trunks (carriers)
 * under `pstn.<domain>`, domains (phones) under `sip.<domain>`. `strict` is
 * false when the operator set features.sip.names: any (any host or IP).
 */
export function useSipNameRule(kind: "pstn" | "sip") {
  const capabilities = useCapabilities();
  return {
    strict: capabilities.sip?.names !== "any",
    suffix: `.${kind}.${capabilities.domain}`
  };
}

/** The label of `name` under `suffix`; "" when empty, undefined for any other host. */
export function sipNameLabel(name: string, suffix: string): string | undefined {
  if (!name) return "";
  return name.endsWith(suffix) ? name.slice(0, -suffix.length) : undefined;
}

/** A name as a label: "Acme RD" → "acme-rd". */
export function toSipLabel(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 63)
    .replace(/-+$/, "");
}

/** One DNS label: lowercase letters, digits and inner dashes. */
export const SIP_LABEL = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;

/**
 * A full SIP name edited as a label next to its fixed suffix: `value` and
 * `onChange` carry the whole name (`acme.pstn.example.com`).
 */
export function SipNameInput({
  value,
  onChange,
  suffix,
  placeholder,
  disabled,
  className,
  ...a11y
}: Omit<ComponentProps<"input">, "value" | "onChange"> & {
  value: string;
  onChange: (name: string) => void;
  suffix: string;
}) {
  return (
    <div
      className={cn(
        "flex h-[38px] items-center rounded-control border border-input bg-background focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30",
        disabled && "opacity-50",
        className
      )}
    >
      <input
        {...a11y}
        value={sipNameLabel(value, suffix) ?? value}
        onChange={(event) => {
          const label = event.target.value.trim().toLowerCase();
          onChange(label ? label + suffix : "");
        }}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
        spellCheck={false}
        className="h-full min-w-0 flex-1 bg-transparent pl-3 font-mono text-[13px] outline-none placeholder:text-text-muted disabled:cursor-not-allowed"
      />
      <span className="shrink-0 pr-3 font-mono text-[13px] text-muted-foreground">
        {suffix}
      </span>
    </div>
  );
}
