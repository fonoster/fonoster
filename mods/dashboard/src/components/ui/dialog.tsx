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
import {
  Children,
  isValidElement,
  type ComponentProps,
  type ReactNode
} from "react";
import { cn } from "~/lib/utils";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

/**
 * "sectioned" (forms): header and footer bands with dividers, the rest in a padded body,
 * and a close button. "plain" (secrets shown once): one padded block, no close button,
 * so the only way out is the dialog's own action.
 */
export function DialogContent({
  className,
  children,
  variant = "sectioned",
  ...props
}: ComponentProps<typeof DialogPrimitive.Content> & {
  variant?: "sectioned" | "plain";
}) {
  const parts = Children.toArray(children);
  const isPart = (child: ReactNode, part: unknown) =>
    isValidElement(child) && child.type === part;
  const header = parts.filter((c) => isPart(c, DialogHeader));
  const footer = parts.filter((c) => isPart(c, DialogFooter));
  const body = parts.filter(
    (c) => !isPart(c, DialogHeader) && !isPart(c, DialogFooter)
  );
  const sectioned = variant === "sectioned";
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60" />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          "fixed left-1/2 top-1/2 z-50 flex max-h-[calc(100%-2rem)] w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-y-auto rounded-2xl border border-border bg-card shadow-lg outline-none sm:max-w-[480px]",
          sectioned ? "gap-0" : "gap-5 p-7",
          className
        )}
        {...props}
      >
        {sectioned ? (
          <>
            {header.length > 0 && (
              <div className="border-b border-border py-6 pl-6 pr-14">
                {header}
              </div>
            )}
            {body.length > 0 && (
              <div className="flex flex-col gap-4 px-6 py-6">{body}</div>
            )}
            {footer.length > 0 && (
              <div className="border-t border-border px-6 py-4">{footer}</div>
            )}
            <DialogPrimitive.Close className="absolute right-5 top-6 cursor-pointer rounded-control p-1 text-text-secondary hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring">
              <XIcon className="size-5" />
              <span className="sr-only">Close</span>
            </DialogPrimitive.Close>
          </>
        ) : (
          children
        )}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export function DialogHeader({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-1.5", className)} {...props} />;
}

export function DialogFooter({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    />
  );
}

export function DialogTitle({
  className,
  ...props
}: ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      className={cn("font-display text-lg font-semibold", className)}
      {...props}
    />
  );
}

export function DialogDescription({
  className,
  ...props
}: ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      className={cn("font-display text-[13px] text-text-secondary", className)}
      {...props}
    />
  );
}
