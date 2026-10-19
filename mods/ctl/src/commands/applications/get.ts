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
import { AudioFilters } from "@fonoster/common";
import * as SDK from "@fonoster/sdk";
import { Application } from "@fonoster/types";
import { Args } from "@oclif/core";
import cliui from "cliui";
import moment from "moment";
import { AuthenticatedCommand } from "../../AuthenticatedCommand";
import errorHandler from "../../errorHandler";

const or = (value: unknown, fallback = "-") =>
  value === undefined || value === null || value === "" || value === 0
    ? fallback
    : String(value);

/** The nc provider behind the app's filter, or the filter names for anything else. */
function noiseCancelling(app: Application): string {
  const filters = app.filters ?? [];
  if (!filters.length) return "off";
  const providers = Object.entries(AudioFilters.FILTER_BY_PROVIDER);
  return filters
    .map((f) => providers.find(([, name]) => name === f.name)?.[0] ?? f.name)
    .join(", ");
}

export function formatApplication(app: Application): string {
  const speech = app.speech ?? {};
  const listeners = (app.listeners ?? [])
    .map((l) => `${l.url} (${l.tracks ?? "both"})`)
    .join(", ");
  const agent = app.intelligence?.config as
    | { languageModel?: { model?: string } }
    | undefined;
  const lines = [
    "APPLICATION DETAILS",
    "------------------",
    `NAME: \t${app.name}`,
    `REF: \t${app.ref}`,
    `KIND: \t${app.type === "AUTOPILOT" ? "Autopilot agent" : "Stream"}`,
    `URL: \t${or(app.url || app.endpoint)}`,
    `PROTOCOL: \t${or(app.protocol, "fonoster")}`,
    ...(app.type === "AUTOPILOT"
      ? [`MODEL: \t${or(agent?.languageModel?.model)}`]
      : []),
    `VOICE: \t${or(speech.voice)}`,
    `LANGUAGE: \t${or(speech.language)}`,
    `STT MODEL: \t${or(speech.sttModel, "default")}`,
    `TTS MODEL: \t${or(speech.ttsModel, "default")}`,
    `SILENCE TIMEOUT: \t${or(speech.silenceTimeoutMs, "default")}`,
    `PATIENCE: \t${or(speech.patience, "normal")}`,
    `AUDIO: \t${app.audio?.codec ? `${app.audio.codec} ${app.audio.rate} Hz` : "default"}`,
    `RECORDING: \t${or(app.recording, "off")}`,
    `AMD: \t${app.amd?.enabled ? `on (${app.amd.windowMs || 4000} ms)` : "off"}`,
    `NOISE CANCELLING: \t${noiseCancelling(app)}`,
    `FALLBACK APP: \t${or(app.fallbackAppRef)}`,
    `FALLBACK MESSAGE: \t${or(app.fallbackMessage)}`,
    `LISTENERS: \t${or(listeners)}`,
    `SIGNING SECRET: \t${or(app.signingSecretHint)}`,
    `CREATED: \t${moment(app.createdAt).format("YYYY-MM-DD HH:mm:ss")}`,
    `UPDATED: \t${moment(app.updatedAt).format("YYYY-MM-DD HH:mm:ss")}`
  ];
  return lines.join("\n");
}

export default class Get extends AuthenticatedCommand<typeof Get> {
  static override readonly description =
    "retrieve details of an Application by reference";
  static override readonly examples = [
    "<%= config.bin %> <%= command.id %> <ref>"
  ];
  static override readonly args = {
    ref: Args.string({
      description: "The Application to show details about",
      required: true
    })
  };

  public async run(): Promise<void> {
    const { args } = await this.parse(Get);

    try {
      const client = await this.createSdkClient();
      const applications = new SDK.Applications(client);
      const response = await applications.getApplication(args.ref);

      const ui = cliui({ width: 200 });
      ui.div(formatApplication(response));
      this.log(ui.toString());
    } catch (e) {
      errorHandler(e, this.error.bind(this));
    }
  }
}
