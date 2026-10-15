#!/usr/bin/env node
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
import { CallRecordWriter } from "@fonoster/callrecord";
import { getLogger } from "@fonoster/logger";
import { loadConfig } from "./config";
import { Gateway } from "./Gateway";
import { CallRecordSink, JsonlCallRecordSink } from "./record/CallRecordSink";
import { createRecordWriter } from "./record/createRecordWriter";

const logger = getLogger({ service: "gateway", filePath: __filename });

async function main() {
  const file =
    process.env.GATEWAY_CONFIG ??
    process.argv[2] ??
    "/etc/fonoster/gateway.yaml";
  const config = loadConfig(file);
  let record: CallRecordSink | undefined;
  let writer: CallRecordWriter | undefined;
  let sweeper: ReturnType<typeof setInterval> | undefined;
  // eslint-disable-next-line prefer-const
  let gateway: Gateway | undefined;
  if (config.callRecord) {
    writer = createRecordWriter(config.callRecord, (entry) =>
      gateway?.onRecordSealed(entry)
    );
    record = writer;
  } else if (process.env.GATEWAY_RECORD_DIR) {
    record = new JsonlCallRecordSink(process.env.GATEWAY_RECORD_DIR);
  }
  gateway = await new Gateway({ config, record }).start();
  if (writer) {
    const w = writer;
    // Records of calls whose gateway died are sealed by whichever replica sweeps first.
    void w.sweep();
    sweeper = setInterval(
      () => void w.sweep(),
      config.callRecord?.sweepIntervalMs ?? 10_000
    );
  }

  const shutdown = async () => {
    logger.info("shutting down");
    if (sweeper) clearInterval(sweeper);
    await gateway?.stop();
    await writer?.flush();
    process.exit(0);
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

main().catch((e) => {
  logger.error(e.message);
  process.exit(1);
});
