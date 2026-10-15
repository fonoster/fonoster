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
// The one-time cutover migration (`fonoster-migrate-legacy`): legacy rows become the rebuild's
// model once. Every step is idempotent: a re-run finds nothing left to convert and changes nothing.

/** The apiserver's Prisma client (with the field-encryption extension in production). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type MigrationDb = any;

export type LegacyNotice = {
  /** What the notice is about: an app ref, a provider id, a credentialRef. */
  ref: string;
  workspaceRef?: string;
  level: "info" | "action";
  message: string;
};

export type StepReport = {
  step: string;
  /** Converted (or, in a dry run, would be). */
  changed: string[];
  /** Already in the new model. */
  unchanged: string[];
  /** Could not be converted; see the notices. */
  skipped: string[];
  notices: LegacyNotice[];
};

export const newStepReport = (step: string): StepReport => ({
  step,
  changed: [],
  unchanged: [],
  skipped: [],
  notices: []
});

export type StepOptions = {
  /** Report only; write nothing. */
  dryRun?: boolean;
};
