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

/** A resource's icon in a square tile: small in list rows, large in page headers. */
export function IconTile({
  icon: Icon,
  size = "sm"
}: {
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  size?: "sm" | "lg";
}) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center bg-secondary",
        size === "lg" ? "size-11 rounded-[10px]" : "size-8 rounded-lg"
      )}
    >
      <Icon
        className={cn("text-foreground", size === "lg" ? "size-6" : "size-4")}
        aria-hidden
      />
    </span>
  );
}
