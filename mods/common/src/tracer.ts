/*
 * Copyright (C) 2022 by Fonoster Inc (https://fonoster.com)
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
import { diag, DiagConsoleLogger, DiagLogLevel } from "@opentelemetry/api";
diag.setLogger(new DiagConsoleLogger(), getLogLevel());

import opentelemetry from "@opentelemetry/api";
import { registerInstrumentations } from "@opentelemetry/instrumentation";
import { NodeTracerProvider } from "@opentelemetry/sdk-trace-node";
import { Resource } from "@opentelemetry/resources";
import { SemanticResourceAttributes } from "@opentelemetry/semantic-conventions";
import { SimpleSpanProcessor } from "@opentelemetry/sdk-trace-base";
import { JaegerExporter } from "@opentelemetry/exporter-jaeger";
import { GrpcInstrumentation } from "@opentelemetry/instrumentation-grpc";

function getLogLevel() {
  switch (process.env.LOGS_LEVEL?.toLowerCase()) {
    case "debug":
      return DiagLogLevel.DEBUG;
    case "info":
      return DiagLogLevel.INFO;
    case "warn":
      return DiagLogLevel.WARN;
    case "error":
      return DiagLogLevel.ERROR;
    default:
      return DiagLogLevel.NONE;
  }
}

export const init = (serviceName: string) => {
  const provider = new NodeTracerProvider({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: serviceName
    })
  });

  const exporter = new JaegerExporter({
    endpoint:
      process.env.TRACING_ENDPOINT || "http://localhost:14268/api/traces"
  });

  provider.addSpanProcessor(new SimpleSpanProcessor(exporter));
  provider.register();

  registerInstrumentations({
    instrumentations: [new GrpcInstrumentation()]
  });

  return opentelemetry.trace.getTracer("fonoster-tracer");
};
