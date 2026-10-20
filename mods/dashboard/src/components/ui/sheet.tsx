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
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { XIcon } from "lucide-react";
import { useRef, type ComponentProps, type ReactNode } from "react";
import { cn } from "~/lib/utils";

/** A right-side drawer (480px) with a header, scrolling body and footer. */
export const Sheet = DialogPrimitive.Root;

export function SheetContent({
  title,
  description,
  children,
  footer,
  monoTitle,
  className,
  onOpenAutoFocus,
  ...props
}: Omit<ComponentProps<typeof DialogPrimitive.Content>, "title"> & {
  title: ReactNode;
  description?: ReactNode;
  footer?: ReactNode;
  /** Sets the title in mono, for a drawer about a number, URL or key. */
  monoTitle?: boolean;
}) {
  const body = useRef<HTMLDivElement>(null);
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/65" />
      <DialogPrimitive.Content
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-full max-w-[480px] flex-col border-l border-border bg-card text-card-foreground shadow-xl outline-none",
          className
        )}
        onOpenAutoFocus={(event) => {
          onOpenAutoFocus?.(event);
          if (event.defaultPrevented) return;
          // Start on the first field, not the close button in the header.
          const field = body.current?.querySelector<HTMLElement>(
            "input:not([type=hidden]):not(:disabled), textarea:not(:disabled), button[role=combobox]:not(:disabled)"
          );
          if (field) {
            event.preventDefault();
            field.focus();
          }
        }}
        {...props}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
          <div className="flex min-w-0 flex-col gap-1">
            <DialogPrimitive.Title
              className={cn(
                "truncate text-lg font-medium",
                monoTitle ? "font-mono" : "font-display"
              )}
            >
              {title}
            </DialogPrimitive.Title>
            {description ? (
              <DialogPrimitive.Description className="font-display text-[13px] text-muted-foreground">
                {description}
              </DialogPrimitive.Description>
            ) : (
              <DialogPrimitive.Description className="sr-only">
                {String(title)}
              </DialogPrimitive.Description>
            )}
          </div>
          <DialogPrimitive.Close className="cursor-pointer rounded-control p-1 text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring">
            <XIcon className="size-[18px]" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        </div>
        <div
          ref={body}
          className="flex flex-1 flex-col gap-[22px] overflow-y-auto p-6"
        >
          {children}
        </div>
        {footer && (
          <div className="flex items-center justify-between gap-2.5 border-t border-border px-6 py-4">
            {footer}
          </div>
        )}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
