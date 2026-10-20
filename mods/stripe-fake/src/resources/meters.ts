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
import { missing, StripeError } from "../errors";
import { Json, MeterEvent, StripeFake } from "../fake";
import { int, list, Route } from "../router";

const DAY = 86_400;

/** Sums (or counts, or takes the last of) a meter's accepted events for a customer in [start, end). */
export function meterTotal(
  fake: StripeFake,
  meterId: string,
  customer: string,
  start: number,
  end: number
): number {
  const meter = fake.objects.get(meterId);
  const formula =
    (meter?.default_aggregation as { formula?: string })?.formula ?? "sum";
  const events = fake.meterEvents
    .filter(
      (e) =>
        e.status === "accepted" &&
        e.meter === meterId &&
        e.customer === customer &&
        e.timestamp >= start &&
        e.timestamp < end
    )
    .sort((a, b) => a.timestamp - b.timestamp);
  if (formula === "count") return events.length;
  if (formula === "last") return events.at(-1)?.value ?? 0;
  return events.reduce((n, e) => n + e.value, 0);
}

/** The validation Stripe runs after answering 200; failures become a thin error report (D3). */
function validateLater(fake: StripeFake, event: MeterEvent) {
  setImmediate(() => {
    const meter = fake.all(
      "billing.meter",
      (m) => m.event_name === event.eventName
    )[0];
    let code: string | undefined;
    if (!meter) code = "no_meter";
    else if (meter.status !== "active") code = "archived_meter";
    else if (!event.customer) code = "meter_event_no_customer_defined";
    else if (
      !fake.objects.get(event.customer) ||
      fake.objects.get(event.customer)!.deleted
    )
      code = "meter_event_customer_not_found";
    else if (!Number.isFinite(event.value)) code = "meter_event_invalid_value";
    if (!code) {
      event.status = "accepted";
      event.meter = meter.id as string;
      fake.notify({ kind: "object", id: meter.id as string });
      return;
    }
    event.status = "rejected";
    event.error = code;
    if (meter) event.meter = meter.id as string;
    reportError(fake, meter, code, event.identifier);
  });
}

function reportError(
  fake: StripeFake,
  meter: Json | undefined,
  code: string,
  identifier: string
) {
  const now = fake.now();
  fake.emitThin(
    "v1.billing.meter.error_report_triggered",
    meter
      ? {
          id: meter.id,
          type: "billing.meter",
          url: `/v1/billing/meters/${meter.id}`
        }
      : { id: "", type: "billing.meter", url: "" },
    {
      developer_message_summary: `There is 1 invalid event: ${code}`,
      reason: {
        error_count: 1,
        error_types: [
          {
            code,
            error_count: 1,
            sample_errors: [{ error_message: code, request: { identifier } }]
          }
        ]
      },
      validation_start: new Date((now - 60) * 1000).toISOString(),
      validation_end: new Date(now * 1000).toISOString()
    }
  );
}

export const meterRoutes: Route[] = [
  {
    method: "post",
    path: "/v1/billing/meters",
    handler: ({ fake, body }) => {
      if (!body.display_name) throw missing("display_name");
      if (!body.event_name) throw missing("event_name");
      if (!(body.default_aggregation as Json)?.formula)
        throw missing("default_aggregation[formula]");
      if (
        fake.all(
          "billing.meter",
          (m) => m.event_name === body.event_name && m.status === "active"
        ).length
      )
        throw new StripeError(
          400,
          "invalid_request_error",
          `An active meter with event_name ${body.event_name} already exists.`,
          { param: "event_name" }
        );
      return fake.create("billing.meter", "mtr", {
        object: "billing.meter",
        display_name: body.display_name,
        event_name: body.event_name,
        event_time_window: body.event_time_window ?? null,
        status: "active",
        status_transitions: { deactivated_at: null },
        default_aggregation: {
          formula: (body.default_aggregation as Json).formula
        },
        customer_mapping: {
          event_payload_key:
            (body.customer_mapping as Json)?.event_payload_key ??
            "stripe_customer_id",
          type: "by_id"
        },
        value_settings: {
          event_payload_key:
            (body.value_settings as Json)?.event_payload_key ?? "value"
        },
        updated: fake.now()
      });
    }
  },
  {
    method: "get",
    path: "/v1/billing/meters/{id}",
    handler: ({ fake, params }) => fake.get(params.id, "billing meter")
  },
  {
    method: "post",
    path: "/v1/billing/meters/{id}",
    handler: ({ fake, params, body }) => {
      // Only the display name can change: meters are immutable otherwise.
      const meter = fake.get(params.id, "billing meter");
      if (body.display_name !== undefined)
        fake.update(meter, {
          display_name: body.display_name,
          updated: fake.now()
        });
      return meter;
    }
  },
  {
    method: "post",
    path: "/v1/billing/meters/{id}/deactivate",
    handler: ({ fake, params }) => {
      const meter = fake.get(params.id, "billing meter");
      fake.update(meter, {
        status: "inactive",
        status_transitions: { deactivated_at: fake.now() },
        updated: fake.now()
      });
      return meter;
    }
  },
  {
    method: "post",
    path: "/v1/billing/meters/{id}/reactivate",
    handler: ({ fake, params }) => {
      const meter = fake.get(params.id, "billing meter");
      fake.update(meter, {
        status: "active",
        status_transitions: { deactivated_at: null },
        updated: fake.now()
      });
      return meter;
    }
  },
  {
    method: "get",
    path: "/v1/billing/meters",
    handler: ({ fake, body }) =>
      list(
        "/v1/billing/meters",
        fake.all(
          "billing.meter",
          (m) => !body.status || m.status === body.status
        ),
        body
      )
  },
  {
    method: "post",
    path: "/v1/billing/meter_events",
    handler: ({ fake, body }) => {
      if (!body.event_name) throw missing("event_name");
      const payload = (body.payload as Json) ?? {};
      const meter = fake.all(
        "billing.meter",
        (m) => m.event_name === body.event_name
      )[0];
      const customerKey =
        ((meter?.customer_mapping as Json)?.event_payload_key as string) ??
        "stripe_customer_id";
      const valueKey =
        ((meter?.value_settings as Json)?.event_payload_key as string) ??
        "value";
      // A test-clock customer's events are timed by its clock, as in Stripe.
      const customerId = payload[customerKey] as string | undefined;
      const now = fake.now(
        customerId && fake.objects.has(customerId)
          ? fake.clockOf(customerId)
          : null
      );
      const timestamp = int(body.timestamp, now)!;
      if (timestamp < now - 35 * DAY)
        throw new StripeError(
          400,
          "invalid_request_error",
          "Timestamp must be within the past 35 calendar days.",
          { param: "timestamp" }
        );
      if (timestamp > now + 5 * 60)
        throw new StripeError(
          400,
          "invalid_request_error",
          "Timestamp must not be more than 5 minutes in the future.",
          { param: "timestamp" }
        );
      const identifier = (body.identifier as string) ?? fake.id("mevt");
      // Stripe keeps identifiers unique for 24 hours: a repeat counts once (unverified against a
      // sandbox whether it answers 200 or 400; the nightly contract run settles it).
      const repeat = fake.meterEvents.find(
        (e) =>
          e.identifier === identifier &&
          e.received > now - DAY &&
          e.status !== "canceled"
      );
      const response = {
        object: "billing.meter_event",
        created: now,
        event_name: body.event_name,
        identifier,
        livemode: false,
        payload,
        timestamp
      };
      if (repeat) return response;
      const event: MeterEvent = {
        identifier,
        eventName: body.event_name as string,
        customer: payload[customerKey] as string | undefined,
        value: payload[valueKey] === undefined ? 1 : Number(payload[valueKey]),
        timestamp,
        received: now,
        status: "accepted"
      };
      fake.meterEvents.push(event);
      validateLater(fake, event);
      return response;
    }
  },
  {
    method: "post",
    path: "/v1/billing/meter_event_adjustments",
    handler: ({ fake, body }) => {
      const identifier = (body.cancel as Json)?.identifier as
        string | undefined;
      if (!identifier) throw missing("cancel[identifier]");
      const event = fake.meterEvents.find(
        (e) => e.identifier === identifier && e.status === "accepted"
      );
      const now = fake.now();
      if (event && event.received > now - DAY) event.status = "canceled";
      return {
        object: "billing.meter_event_adjustment",
        event_name: body.event_name,
        livemode: false,
        status: "pending",
        type: "cancel",
        cancel: { identifier }
      };
    }
  },
  {
    method: "get",
    path: "/v1/billing/meters/{id}/event_summaries",
    handler: ({ fake, params, body }) => {
      const meter = fake.get(params.id, "billing meter");
      if (!body.customer) throw missing("customer");
      const start = int(body.start_time);
      const end = int(body.end_time);
      if (start === undefined) throw missing("start_time");
      if (end === undefined) throw missing("end_time");
      if (start % 60 || end % 60)
        throw new StripeError(
          400,
          "invalid_request_error",
          "start_time and end_time must be aligned with minute boundaries.",
          { param: "start_time" }
        );
      const window =
        body.value_grouping_window === "hour"
          ? 3600
          : body.value_grouping_window === "day"
            ? DAY
            : end - start;
      const summaries: Json[] = [];
      for (let t = start; t < end; t += window) {
        summaries.push({
          id: `mtrusg_${meter.id}_${t}`,
          object: "billing.meter_event_summary",
          aggregated_value: meterTotal(
            fake,
            meter.id as string,
            body.customer as string,
            t,
            Math.min(t + window, end)
          ),
          start_time: t,
          end_time: Math.min(t + window, end),
          livemode: false,
          meter: meter.id
        });
      }
      return {
        object: "list",
        data: summaries,
        has_more: false,
        url: `/v1/billing/meters/${meter.id}/event_summaries`
      };
    }
  },
  {
    method: "get",
    path: "/v2/core/events/{id}",
    handler: ({ fake, params }) => {
      const event = fake.events.find(
        (e) => e.id === params.id && e.object === "v2.core.event"
      );
      if (!event)
        throw new StripeError(
          404,
          "invalid_request_error",
          `No such event: '${params.id}'`,
          { code: "resource_missing" }
        );
      return event;
    }
  }
];
