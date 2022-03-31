import {diag, DiagConsoleLogger, DiagLogLevel} from "@opentelemetry/api";
diag.setLogger(new DiagConsoleLogger(), getLogLevel());

import opentelemetry from "@opentelemetry/api";
import {registerInstrumentations} from "@opentelemetry/instrumentation";
import {NodeTracerProvider} from "@opentelemetry/sdk-trace-node";
import {Resource} from "@opentelemetry/resources";
import {SemanticResourceAttributes} from "@opentelemetry/semantic-conventions";
import {SimpleSpanProcessor} from "@opentelemetry/sdk-trace-base";
import {JaegerExporter} from "@opentelemetry/exporter-jaeger";
import {GrpcInstrumentation} from "@opentelemetry/instrumentation-grpc";

function getLogLevel () {
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
