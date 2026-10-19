/*
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
import type { AudioFilterSetting, CatalogEntry } from "./types";

// Noise cancelling (dashboard "Call handling offers noise cancelling from the catalog"): one
// select, None or a noise-cancelling (`nc`) provider the catalog offers. The app stores it as its
// filters list; this table is the dashboard's copy of @fonoster/common's FILTER_BY_PROVIDER.

export const NOISE_CANCELLING_FILTERS: Record<string, string> = {
  aicoustics: "aiCoustics"
};

export const NC_NONE = "none";

/** The nc provider behind the app's filters, or the first filter's name when none matches. */
export function noiseCancellingOf(
  filters: AudioFilterSetting[] | undefined
): string {
  const first = filters?.[0];
  if (!first) return NC_NONE;
  const provider = Object.entries(NOISE_CANCELLING_FILTERS).find(
    ([, name]) => name === first.name
  )?.[0];
  return provider ?? first.name;
}

/** The select's options: None, the offered nc providers, and the saved one when not offered. */
export function noiseCancellingOptions(
  providers: CatalogEntry[],
  filters: AudioFilterSetting[] | undefined
): { value: string; label: string }[] {
  const offered = providers.filter((p) => p.capabilities?.includes("nc"));
  const current = noiseCancellingOf(filters);
  const options = [
    { value: NC_NONE, label: "None" },
    ...offered.map((p) => ({ value: p.id, label: p.label }))
  ];
  if (current !== NC_NONE && !offered.some((p) => p.id === current))
    options.push({ value: current, label: `${current} (unavailable)` });
  return options;
}

/** The filters for a select value; an unavailable saved value keeps the filters as they are. */
export function filtersFor(
  value: string,
  current: AudioFilterSetting[] | undefined
): AudioFilterSetting[] {
  if (value === NC_NONE) return [];
  const name = NOISE_CANCELLING_FILTERS[value];
  return name ? [{ name }] : (current ?? []);
}
