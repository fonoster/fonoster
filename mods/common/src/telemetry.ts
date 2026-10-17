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
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */

/**
 * OpenTelemetry bootstrap shared by the TypeScript services (add-platform, observability).
 *
 * Driven by the standard OTEL_* variables and a complete no-op when no OTLP endpoint is set:
 * nothing is loaded, nothing is sent, and the service only writes its normal logs. Signals go
 * over OTLP/HTTP with JSON bodies (collector port 4318) using only `@opentelemetry/api`,
 * `sdk-trace-base`, `sdk-trace-node` and `resources`, so no exporter package is needed.
 *
 * Every call-scoped span, log record and metric carries `fonoster.call_ref`.
 */
export const CALL_REF_ATTR = "fonoster.call_ref";

type Attrs = Record<string, string | number | boolean>;

export interface CallSpan {
  /** Adds a timeline event to the call's span. */
  event(name: string, attrs?: Attrs): void;
  /** Ends the span; `error` marks it failed. */
  end(attrs?: Attrs, error?: string): void;
}

/** A span not tied to a call (a gRPC request, a registry command), optionally continuing a trace. */
export interface Span extends CallSpan {
  /** The W3C `traceparent` of this span, to send with outgoing messages ("" when disabled). */
  traceparent: string;
}

/** NATS/gRPC header carrying the W3C trace context between services. */
export const TRACEPARENT_HEADER = "traceparent";

export interface Telemetry {
  enabled: boolean;
  /**
   * Starts the span of one call; the returned handle is a no-op when disabled. `parent` (a W3C
   * traceparent from another service, e.g. the media node) makes it a child in that trace.
   */
  startCall(
    callRef: string,
    name: string,
    attrs?: Attrs,
    parent?: string
  ): CallSpan;
  /**
   * Starts a span; with `parent` (a W3C traceparent received from another service) it joins that
   * trace. A no-op handle when disabled.
   */
  startSpan(name: string, attrs?: Attrs, parent?: string): Span;
  /** The W3C traceparent of a call's span (to propagate over NATS), when one is active. */
  traceparent(callRef: string): string | undefined;
  /** An OTLP log record correlated by call ref (and the active trace, when any). */
  log(
    level: "debug" | "info" | "warn" | "error",
    message: string,
    attrs?: Attrs & { callRef?: string }
  ): void;
  /** Adds to a monotonic counter. */
  count(name: string, value?: number, attrs?: Attrs): void;
  /** Reads `fn` at every export and reports it as a gauge. */
  gauge(name: string, fn: () => number, attrs?: Attrs): void;
  /** Flushes and stops the exporters. */
  shutdown(): Promise<void>;
}

const NOOP_SPAN: Span = {
  event: () => undefined,
  end: () => undefined,
  traceparent: ""
};
const NOOP: Telemetry = {
  enabled: false,
  startCall: () => NOOP_SPAN,
  startSpan: () => NOOP_SPAN,
  traceparent: () => undefined,
  log: () => undefined,
  count: () => undefined,
  gauge: () => undefined,
  shutdown: async () => undefined
};

/** True when any OTLP endpoint is configured and the SDK is not disabled. */
export function telemetryEnabled(env = process.env): boolean {
  if (env.OTEL_SDK_DISABLED === "true") return false;
  return [
    "OTEL_EXPORTER_OTLP_ENDPOINT",
    "OTEL_EXPORTER_OTLP_TRACES_ENDPOINT",
    "OTEL_EXPORTER_OTLP_METRICS_ENDPOINT",
    "OTEL_EXPORTER_OTLP_LOGS_ENDPOINT"
  ].some((k) => !!env[k]);
}

function toValue(v: string | number | boolean) {
  if (typeof v === "number")
    return Number.isInteger(v) ? { intValue: String(v) } : { doubleValue: v };
  if (typeof v === "boolean") return { boolValue: v };
  return { stringValue: String(v) };
}

function toAttrs(a: Record<string, any> = {}) {
  return Object.entries(a)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([key, value]) => ({ key, value: toValue(value) }));
}

const hrToNano = (t: [number, number]) =>
  (BigInt(t[0]) * BigInt(1000000000) + BigInt(t[1])).toString();

function signalUrl(
  env: Record<string, string | undefined>,
  signal: "traces" | "metrics" | "logs"
): string | undefined {
  const specific = env[`OTEL_EXPORTER_OTLP_${signal.toUpperCase()}_ENDPOINT`];
  if (specific) return specific;
  const base = env.OTEL_EXPORTER_OTLP_ENDPOINT;
  return base ? `${base.replace(/\/$/, "")}/v1/${signal}` : undefined;
}

function headers(
  env: Record<string, string | undefined>
): Record<string, string> {
  const h: Record<string, string> = { "content-type": "application/json" };
  for (const pair of (env.OTEL_EXPORTER_OTLP_HEADERS ?? "")
    .split(",")
    .filter(Boolean)) {
    const i = pair.indexOf("=");
    if (i > 0) h[pair.slice(0, i).trim()] = pair.slice(i + 1).trim();
  }
  return h;
}

/**
 * Starts telemetry for one service. Safe to call once at startup; returns a no-op handle when no
 * OTLP endpoint is configured or the OpenTelemetry packages are not installed.
 */
export function initTelemetry(
  service: string,
  instanceId = process.env.HOSTNAME ?? String(process.pid),
  env: Record<string, string | undefined> = process.env
): Telemetry {
  if (!telemetryEnabled(env)) return NOOP;
  let api: any, base: any, nodeSdk: any, resources: any;
  try {
    api = require("@opentelemetry/api");
    base = require("@opentelemetry/sdk-trace-base");
    nodeSdk = require("@opentelemetry/sdk-trace-node");
    resources = require("@opentelemetry/resources");
  } catch {
    return NOOP;
  }
  const resourceAttrs = {
    "service.name": env.OTEL_SERVICE_NAME ?? service,
    "service.instance.id": instanceId
  };
  const resource = { attributes: toAttrs(resourceAttrs) };
  const hdrs = headers(env);
  const post = (url: string | undefined, body: unknown) => {
    if (!url) return Promise.resolve();
    return fetch(url, {
      method: "POST",
      headers: hdrs,
      body: JSON.stringify(body)
    })
      .then(() => undefined)
      .catch(() => undefined);
  };

  // Traces
  const tracesUrl = signalUrl(env, "traces");
  const exporter = {
    export(spans: any[], done: (r: { code: number }) => void) {
      const body = {
        resourceSpans: [
          {
            resource,
            scopeSpans: [
              {
                scope: { name: "fonoster" },
                spans: spans.map((s) => ({
                  traceId: s.spanContext().traceId,
                  spanId: s.spanContext().spanId,
                  parentSpanId: s.parentSpanContext?.spanId || undefined,
                  name: s.name,
                  kind: 1 + (s.kind ?? 0),
                  startTimeUnixNano: hrToNano(s.startTime),
                  endTimeUnixNano: hrToNano(s.endTime),
                  attributes: toAttrs(s.attributes),
                  events: s.events.map((e: any) => ({
                    name: e.name,
                    timeUnixNano: hrToNano(e.time),
                    attributes: toAttrs(e.attributes)
                  })),
                  status:
                    s.status.code === 2
                      ? { code: 2, message: s.status.message }
                      : { code: s.status.code }
                }))
              }
            ]
          }
        ]
      };
      void post(tracesUrl, body).then(() => done({ code: 0 }));
    },
    shutdown: async () => undefined
  };
  const provider = new nodeSdk.NodeTracerProvider({
    resource: resources.resourceFromAttributes(resourceAttrs),
    spanProcessors: [new base.BatchSpanProcessor(exporter)]
  });
  provider.register();
  // The provider's own tracer: the global one stays the first registered (tests init twice).
  const tracer = provider.getTracer("fonoster");

  // Logs
  const logsUrl = signalUrl(env, "logs");
  const logQueue: any[] = [];
  const severity = { debug: 5, info: 9, warn: 13, error: 17 };
  const flushLogs = () => {
    if (!logQueue.length) return Promise.resolve();
    const records = logQueue.splice(0);
    return post(logsUrl, {
      resourceLogs: [
        {
          resource,
          scopeLogs: [{ scope: { name: "fonoster" }, logRecords: records }]
        }
      ]
    });
  };

  // Metrics
  const metricsUrl = signalUrl(env, "metrics");
  const startNs = (BigInt(Date.now()) * BigInt(1000000)).toString();
  const counters = new Map<string, { attrs: Attrs; value: number }[]>();
  const gauges: { name: string; fn: () => number; attrs?: Attrs }[] = [];
  const flushMetrics = () => {
    const now = (BigInt(Date.now()) * BigInt(1000000)).toString();
    const metrics: any[] = [];
    for (const [name, series] of counters) {
      metrics.push({
        name,
        sum: {
          aggregationTemporality: 2,
          isMonotonic: true,
          dataPoints: series.map((s) => ({
            asInt: String(s.value),
            startTimeUnixNano: startNs,
            timeUnixNano: now,
            attributes: toAttrs(s.attrs)
          }))
        }
      });
    }
    for (const g of gauges) {
      let v = 0;
      try {
        v = g.fn();
      } catch {
        continue;
      }
      metrics.push({
        name: g.name,
        gauge: {
          dataPoints: [
            { asDouble: v, timeUnixNano: now, attributes: toAttrs(g.attrs) }
          ]
        }
      });
    }
    if (!metrics.length) return Promise.resolve();
    return post(metricsUrl, {
      resourceMetrics: [
        {
          resource,
          scopeMetrics: [{ scope: { name: "fonoster" }, metrics }]
        }
      ]
    });
  };

  const timer = setInterval(
    () => {
      void flushLogs();
      void flushMetrics();
    },
    Number(env.OTEL_METRIC_EXPORT_INTERVAL ?? 15000)
  );
  timer.unref();

  const spanOf = new Map<string, any>();
  const contextOf = (parent?: string) =>
    parent
      ? api.propagation.extract(api.context.active(), {
          [TRACEPARENT_HEADER]: parent
        })
      : api.context.active();
  const traceparentOf = (span: any): string => {
    const carrier: Record<string, string> = {};
    api.propagation.inject(
      api.trace.setSpan(api.context.active(), span),
      carrier
    );
    return carrier[TRACEPARENT_HEADER] ?? "";
  };
  return {
    enabled: true,
    startSpan(name, attrs, parent) {
      const span = tracer.startSpan(
        name,
        { attributes: attrs },
        contextOf(parent)
      );
      return {
        traceparent: traceparentOf(span),
        event: (n, a) => span.addEvent(n, a),
        end: (a, error) => {
          if (a) span.setAttributes(a);
          if (error) span.setStatus({ code: 2, message: error });
          span.end();
        }
      };
    },
    traceparent(callRef) {
      const span = spanOf.get(callRef);
      return span ? traceparentOf(span) : undefined;
    },
    startCall(callRef, name, attrs, parent) {
      const span = tracer.startSpan(
        name,
        { attributes: { [CALL_REF_ATTR]: callRef, ...attrs } },
        contextOf(parent)
      );
      spanOf.set(callRef, span);
      return {
        event: (n, a) => span.addEvent(n, { [CALL_REF_ATTR]: callRef, ...a }),
        end: (a, error) => {
          if (a) span.setAttributes(a);
          if (error) span.setStatus({ code: 2, message: error });
          span.end();
          spanOf.delete(callRef);
        }
      };
    },
    log(level, message, attrs = {}) {
      const { callRef, ...rest } = attrs;
      const span = callRef ? spanOf.get(callRef) : undefined;
      const ctx =
        span?.spanContext?.() ?? api.trace.getActiveSpan()?.spanContext();
      logQueue.push({
        timeUnixNano: (BigInt(Date.now()) * BigInt(1000000)).toString(),
        severityNumber: severity[level],
        severityText: level.toUpperCase(),
        body: { stringValue: message },
        attributes: toAttrs(
          callRef ? { [CALL_REF_ATTR]: callRef, ...rest } : rest
        ),
        traceId: ctx?.traceId,
        spanId: ctx?.spanId
      });
      if (logQueue.length >= 100) void flushLogs();
    },
    count(name, value = 1, attrs = {}) {
      const series = counters.get(name) ?? [];
      const key = JSON.stringify(attrs);
      const hit = series.find((s) => JSON.stringify(s.attrs) === key);
      if (hit) hit.value += value;
      else series.push({ attrs, value });
      counters.set(name, series);
    },
    gauge(name, fn, attrs) {
      gauges.push({ name, fn, attrs });
    },
    async shutdown() {
      clearInterval(timer);
      await provider.shutdown().catch(() => undefined);
      await Promise.all([flushLogs(), flushMetrics()]);
    }
  };
}
