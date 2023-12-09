import {
  ExportResult,
  ExportResultCode,
  hrTimeToMicroseconds,
} from '@opentelemetry/core'
import { ReadableSpan, SpanExporter } from '@opentelemetry/sdk-trace-base'
import * as Sentry from '@sentry/browser'
import { BrowserTracing } from '@sentry/tracing'

import { config } from '../constants/config'

Sentry.init({
  environment: process.env.NODE_ENV,
  dsn: config.WEBUI_SENTRY_DSN,
  integrations: [new BrowserTracing()],
  tracesSampleRate: 1.0,
})

export class SentrySpanExporter implements SpanExporter {
  /**
   * Export spans.
   * @param spans
   * @param resultCallback
   */
  export(
    spans: ReadableSpan[],
    resultCallback: (result: ExportResult) => void
  ): void {
    return this._sendSpans(spans, resultCallback)
  }

  /**
   * Shutdown the exporter.
   */
  shutdown(): Promise<void> {
    this._sendSpans([])
    return Promise.resolve()
  }

  /**
   * converts span info into more readable format
   * @param span
   */
  private _exportInfo(span: ReadableSpan) {
    return {
      traceId: span.spanContext().traceId,
      parentId: span.parentSpanId,
      name: span.name,
      id: span.spanContext().spanId,
      kind: span.kind,
      timestamp: hrTimeToMicroseconds(span.startTime),
      duration: hrTimeToMicroseconds(span.duration),
      attributes: span.attributes,
      status: span.status,
      events: span.events,
    }
  }

  /**
   * Send spans to Sentry
   * @param spans
   * @param done
   */
  private _sendSpans(
    spans: ReadableSpan[],
    done?: (result: ExportResult) => void
  ): void {
    for (const span of spans) {
      const event = this._exportInfo(span)

      Sentry.captureEvent({
        message:
          (event.attributes['actionIntent'] as string) ||
          (event.attributes['elementText'] as string) ||
          'New Event from Fonoster Console',
        environment: process.env.NODE_ENV,
        level: Sentry.Severity.Info,
        extra: {
          ...event,
          attributes: undefined,
          ...event.attributes,
        },
      })
    }

    if (done) return done({ code: ExportResultCode.SUCCESS })
  }
}
