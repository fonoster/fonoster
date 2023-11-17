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
import opentelemetry, { Context, Span, Tracer } from "@opentelemetry/api";
import { Resource } from "@opentelemetry/resources";
import { SemanticResourceAttributes } from "@opentelemetry/semantic-conventions";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base";
const { NodeTracerProvider } = require("@opentelemetry/sdk-trace-node");

export class VoiceTracer {
  callTracer: Tracer;
  parentSpan: Span;
  ctx: Context;
  constructor(otlSpanExporters: Array<any>) {
    // Configure span processor to send spans to the exporter
    const provider = new NodeTracerProvider({
      resource: new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: "voice-service"
      })
    });

    for (const exp of otlSpanExporters) {
      const exporter = new exp.exporter(exp.config);
      provider.addSpanProcessor(new BatchSpanProcessor(exporter));
    }

    provider.register();
    this.callTracer = opentelemetry.trace.getTracer("call_tracer");
  }

  init() {
    this.parentSpan = this.callTracer.startSpan("call");
    this.ctx = opentelemetry.trace.setSpan(
      opentelemetry.context.active(),
      this.parentSpan
    );
  }

  close() {
    this.parentSpan.end();
  }

  createSpan(name: string): Span {
    return this.callTracer.startSpan(name, undefined, this.ctx);
  }
}
