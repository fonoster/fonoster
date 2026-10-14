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
  "flex items-start gap-3 rounded-control px-4 py-3 text-sm [&_svg]:mt-0.5 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        info: "bg-info text-info-foreground",
        success: "bg-success text-success-foreground",
        warning: "bg-warning text-warning-foreground",
        error: "bg-error text-error-foreground"
      }
    },
    defaultVariants: { variant: "info" }
  }
);

const ICONS = {
  info: Info,
  success: CheckCircle2,
  warning: TriangleAlert,
  error: AlertCircle
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
