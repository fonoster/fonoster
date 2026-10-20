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
import { cva, type VariantProps } from "class-variance-authority";
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "~/lib/utils";

const alertVariants = cva(
  "flex items-start gap-3 rounded-control border px-4 py-3 font-display text-[13px] text-foreground [&_svg]:mt-0.5 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      // Outlined, as in the designs: the border and icon carry the color, the text stays readable.
      variant: {
        info: "border-border bg-muted [&_svg]:text-muted-foreground",
        success: "border-(--fn-success) [&_svg]:text-(--fn-success)",
        warning: "border-(--fn-warning) [&_svg]:text-(--fn-warning)",
        error: "border-destructive [&_svg]:text-destructive",
        /** A muted hint, e.g. the notes under forms in the designs. */
        note: "border-transparent bg-muted text-xs text-muted-foreground"
      }
    },
    defaultVariants: { variant: "info" }
  }
);

const ICONS = {
  info: Info,
  success: CheckCircle2,
  warning: TriangleAlert,
  error: AlertCircle,
  note: Info
};

export function Alert({
  className,
  variant = "info",
  children,
  ...props
}: ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  const Icon = ICONS[variant ?? "info"];
  return (
    <div
      data-slot="alert"
      role={variant === "error" ? "alert" : "status"}
      className={cn(alertVariants({ variant }), className)}
      {...props}
    >
      <Icon aria-hidden />
      <div className="flex-1">{children}</div>
    </div>
  );
}
