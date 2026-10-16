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
import { type ReactNode, useId } from "react";
import { cn } from "~/lib/utils";
import { Label } from "./label";

/**
 * A label, a control and its error or hint. The control receives the ids it
 * needs for accessibility through the render prop.
 */
export function Field({
  label,
  error,
  hint,
  action,
  className,
  children
}: {
  label: string;
  error?: string;
  hint?: ReactNode;
  action?: ReactNode;
  className?: string;
  children: (props: {
    id: string;
    "aria-invalid": boolean;
    "aria-describedby"?: string;
  }) => ReactNode;
}) {
  const id = useId();
  const messageId = `${id}-message`;
  const message = error ?? hint;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center justify-between">
        <Label htmlFor={id}>{label}</Label>
        {action}
      </div>
      {children({
        id,
        "aria-invalid": Boolean(error),
        "aria-describedby": message ? messageId : undefined
      })}
      {message && (
        <p
          id={messageId}
          role={error ? "alert" : undefined}
          className={cn(
            "font-display text-[11px]",
            error ? "text-destructive" : "text-text-secondary"
          )}
        >
          {message}
        </p>
      )}
    </div>
  );
}
