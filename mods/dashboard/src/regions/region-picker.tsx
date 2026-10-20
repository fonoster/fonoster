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
import { Lock } from "lucide-react";
import { authInput } from "~/auth/auth-layout";
import { Field } from "~/components/ui/field";
import { Select } from "~/components/ui/select";
import { useRegions } from "./api";
import { DEFAULT_REGION, isUsable, type RegionStatus } from "./types";

const SUFFIX: Partial<Record<RegionStatus, string>> = {
  waiting: " (waiting)",
  offline: " (offline)",
  unsupported: " (needs upgrade)"
};

/** One select: Default plus the user's regions; waiting or offline ones are disabled. */
export function RegionPicker({
  value,
  onChange
}: {
  value: string;
  onChange: (region: string) => void;
}) {
  const { data } = useRegions();
  const regions = data?.length ? data : [DEFAULT_REGION];
  return (
    <Field
      label="Region"
      hint={
        <span className="flex items-center gap-1.5">
          <Lock className="size-3" aria-hidden /> You can't change the region
          later.
        </span>
      }
    >
      {(a11y) => (
        <Select
          {...a11y}
          className={authInput}
          value={value}
          onValueChange={onChange}
          options={regions.map((r) => ({
            value: r.id,
            label: `${r.displayName}${SUFFIX[r.status] ?? ""}`,
            disabled: !isUsable(r)
          }))}
        />
      )}
    </Field>
  );
}
