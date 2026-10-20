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
/** The unit a meter counts in. */
export type UsageUnit = "second" | "character" | "token" | "count" | "byte";

/** How a meter's lines combine: added up, or a point-in-time reading (take the latest). */
export type UsageAggregation = "sum" | "snapshot";

/** The component that measures a meter. */
export type UsageReporter = "appbridge" | "autopilot" | "apiserver";

export type MeterDefinition = {
  unit: UsageUnit;
  aggregation: UsageAggregation;
  reporter: UsageReporter;
  /** A third-party vendor does the work, so every line says whose key was used. */
  vendor: boolean;
};

/**
 * The declared meters (add-usage-metering, usage-metering spec). Usage for any other name is
 * rejected. Adding a meter is adding an entry here.
 */
export const METERS = {
  "call.seconds": {
    unit: "second",
    aggregation: "sum",
    reporter: "appbridge",
    vendor: false
  },
  "stt.seconds": {
    unit: "second",
    aggregation: "sum",
    reporter: "appbridge",
    vendor: true
  },
  "tts.characters": {
    unit: "character",
    aggregation: "sum",
    reporter: "appbridge",
    vendor: true
  },
  "llm.tokens.in": {
    unit: "token",
    aggregation: "sum",
    reporter: "autopilot",
    vendor: true
  },
  "llm.tokens.out": {
    unit: "token",
    aggregation: "sum",
    reporter: "autopilot",
    vendor: true
  },
  "llm.tokens.cached": {
    unit: "token",
    aggregation: "sum",
    reporter: "autopilot",
    vendor: true
  },
  "embedding.tokens": {
    unit: "token",
    aggregation: "sum",
    reporter: "autopilot",
    vendor: true
  },
  "nc.seconds": {
    unit: "second",
    aggregation: "sum",
    reporter: "appbridge",
    vendor: true
  },
  "amd.detections": {
    unit: "count",
    aggregation: "sum",
    reporter: "appbridge",
    vendor: false
  },
  "amd.seconds": {
    unit: "second",
    aggregation: "sum",
    reporter: "appbridge",
    vendor: false
  },
  "recording.seconds": {
    unit: "second",
    aggregation: "sum",
    reporter: "appbridge",
    vendor: false
  },
  "storage.bytes": {
    unit: "byte",
    aggregation: "snapshot",
    reporter: "apiserver",
    vendor: false
  }
} as const satisfies Record<string, MeterDefinition>;

export type MeterName = keyof typeof METERS;

export const METER_NAMES = Object.keys(METERS) as MeterName[];

export function isMeter(name: string): name is MeterName {
  return Object.prototype.hasOwnProperty.call(METERS, name);
}

export function meterOf(name: MeterName): MeterDefinition {
  return METERS[name];
}
