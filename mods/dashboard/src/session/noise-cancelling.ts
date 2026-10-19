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
import type { AudioFilterSetting } from "./types";

// Noise cancelling (dashboard "Noise cancelling is one select fed by the catalog"): None or a
// noise-cancelling (`nc`) provider the catalog offers. The app stores it as one entry of its
// filters list; this table is the dashboard's copy of @fonoster/common's FILTER_BY_PROVIDER.

export const NOISE_CANCELLING_FILTERS: Record<string, string> = {
  aicoustics: "aiCoustics"
};

export const NC_NONE = "none";

/** A noise-cancelling provider the catalog offers: its id and label. */
export type NoiseCancellingProvider = { id: string; label: string };

const isNoiseCancelling = (f: AudioFilterSetting) =>
  Object.values(NOISE_CANCELLING_FILTERS).includes(f.name);

const providerOf = (f: AudioFilterSetting) =>
  Object.entries(NOISE_CANCELLING_FILTERS).find(
    ([, name]) => name === f.name
  )?.[0];

/** The nc provider behind the app's filters, or None (other filters are not this select's). */
export function noiseCancellingOf(
  filters: AudioFilterSetting[] | undefined
): string {
  const current = filters?.find(isNoiseCancelling);
  return (current && providerOf(current)) ?? NC_NONE;
}

/** The select's options: None, the offered nc providers, and the saved one when not offered. */
export function noiseCancellingOptions(
  offered: NoiseCancellingProvider[],
  filters: AudioFilterSetting[] | undefined
): { value: string; label: string }[] {
  const current = noiseCancellingOf(filters);
  const options = [
    { value: NC_NONE, label: "None" },
    ...offered.map((p) => ({ value: p.id, label: p.label }))
  ];
  if (current !== NC_NONE && !offered.some((p) => p.id === current))
    options.push({ value: current, label: `${current} (unavailable)` });
  return options;
}

/**
 * The filters for a select value. Only the noise-cancelling entry changes: other filters stay,
 * and the current entry keeps its options (set through the API) when the provider is the same.
 */
export function filtersFor(
  value: string,
  current: AudioFilterSetting[] | undefined
): AudioFilterSetting[] {
  const list = current ?? [];
  const others = list.filter((f) => !isNoiseCancelling(f));
  if (value === NC_NONE) return others;
  const name = NOISE_CANCELLING_FILTERS[value];
  if (!name) return list;
  const existing = list.find((f) => f.name === name);
  return [existing ?? { name }, ...others];
}
