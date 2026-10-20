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
import { missing } from "../errors";
import { without } from "../fake";
import { list, metadataOf, Route } from "../router";

/** Webhook endpoints and the event log (add-stripe-fake 5.1, 5.2). */
export const eventRoutes: Route[] = [
  {
    method: "post",
    path: "/v1/webhook_endpoints",
    handler: ({ fake, body }) => {
      if (!body.url) throw missing("url");
      const events = (body.enabled_events as string[] | undefined) ?? ["*"];
      return fake.create("webhook_endpoint", "we", {
        object: "webhook_endpoint",
        url: body.url,
        enabled_events: events,
        status: "enabled",
        description: body.description ?? null,
        metadata: metadataOf(body),
        secret: fake.secret("whsec"),
        api_version: body.api_version ?? null,
        application: null
      });
    }
  },
  {
    method: "get",
    path: "/v1/webhook_endpoints/{webhook_endpoint}",
    handler: ({ fake, params }) => {
      const endpoint = without(
        fake.get(
          params.webhook_endpoint,
          "webhook endpoint",
          "webhook_endpoint"
        ),
        "secret"
      );
      return endpoint;
    }
  },
  {
    method: "post",
    path: "/v1/webhook_endpoints/{webhook_endpoint}",
    handler: ({ fake, params, body }) => {
      const endpoint = fake.get(
        params.webhook_endpoint,
        "webhook endpoint",
        "webhook_endpoint"
      );
      const fields: Record<string, unknown> = {};
      if (body.url !== undefined) fields.url = body.url;
      if (body.disabled !== undefined)
        fields.status = body.disabled === "true" ? "disabled" : "enabled";
      if (body.enabled_events !== undefined)
        fields.enabled_events = body.enabled_events;
      fake.update(endpoint, fields);
      return without(endpoint, "secret");
    }
  },
  {
    method: "delete",
    path: "/v1/webhook_endpoints/{webhook_endpoint}",
    handler: ({ fake, params }) => {
      const endpoint = fake.get(
        params.webhook_endpoint,
        "webhook endpoint",
        "webhook_endpoint"
      );
      endpoint.deleted = true;
      return { id: endpoint.id, object: "webhook_endpoint", deleted: true };
    }
  },
  {
    method: "get",
    path: "/v1/webhook_endpoints",
    handler: ({ fake, body }) =>
      list(
        "/v1/webhook_endpoints",
        fake.all("webhook_endpoint").map(({ secret: _s, ...e }) => e),
        body
      )
  },
  {
    method: "get",
    path: "/v1/events",
    handler: ({ fake, body }) =>
      list(
        "/v1/events",
        fake.events.filter(
          (e) => e.object === "event" && (!body.type || e.type === body.type)
        ),
        body
      )
  },
  {
    method: "get",
    path: "/v1/events/{id}",
    handler: ({ fake, params }) => {
      const event = fake.events.find(
        (e) => e.id === params.id && e.object === "event"
      );
      if (!event) throw missing("id");
      return event;
    }
  }
];
