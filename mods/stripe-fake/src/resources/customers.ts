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
import { list, metadataOf, Route } from "../router";

/** Customers (add-stripe-fake 2.1), and the Customer Portal sessions that manage them. */
export const customerRoutes: Route[] = [
  {
    method: "post",
    path: "/v1/billing_portal/sessions",
    handler: ({ fake, body }) => {
      const customer = body.customer as string;
      if (!customer) throw missing("customer");
      fake.get(customer, "customer", "customer");
      const id = fake.id("bps");
      // The portal itself is Stripe's page; the fake hands out a link that only names the session.
      return fake.create("billing_portal.session", "bps", {
        id,
        object: "billing_portal.session",
        configuration: "bpc_fake_default",
        customer,
        return_url: body.return_url ?? null,
        url: `https://billing.stripe.com/p/session/test_${id}`
      });
    }
  },
  {
    method: "post",
    path: "/v1/customers",
    handler: ({ fake, body }) => {
      const clock = (body.test_clock as string) ?? null;
      if (clock) fake.get(clock, "test_clock", "test_clock");
      const customer = fake.create(
        "customer",
        "cus",
        {
          object: "customer",
          email: body.email ?? null,
          name: body.name ?? null,
          description: body.description ?? null,
          metadata: metadataOf(body),
          address: body.address ?? null,
          invoice_settings: {
            custom_fields: null,
            default_payment_method:
              (body.invoice_settings as { default_payment_method?: string })
                ?.default_payment_method ?? null,
            footer: null,
            rendering_options: null
          },
          test_clock: clock,
          currency: null,
          balance: 0,
          delinquent: false,
          tax_exempt: (body.tax_exempt as string) ?? "none"
        },
        clock
      );
      fake.emit("customer.created", customer, undefined, clock);
      return customer;
    }
  },
  {
    method: "get",
    path: "/v1/customers/{customer}",
    handler: ({ fake, params }) =>
      fake.get(params.customer, "customer", "customer")
  },
  {
    method: "post",
    path: "/v1/customers/{customer}",
    handler: ({ fake, params, body }) => {
      const customer = fake.get(params.customer, "customer", "customer");
      const fields: Record<string, unknown> = {};
      ["email", "name", "description", "address", "tax_exempt"].forEach((k) => {
        if (body[k] !== undefined) fields[k] = body[k] === "" ? null : body[k];
      });
      if (body.metadata !== undefined)
        fields.metadata = metadataOf(
          body,
          customer.metadata as Record<string, unknown>
        );
      const settings = body.invoice_settings as
        { default_payment_method?: string } | undefined;
      if (settings?.default_payment_method !== undefined) {
        if (settings.default_payment_method)
          fake.get(settings.default_payment_method, "PaymentMethod");
        fields.invoice_settings = {
          ...(customer.invoice_settings as Record<string, unknown>),
          default_payment_method: settings.default_payment_method || null
        };
      }
      const previous = fake.update(customer, fields);
      fake.emit(
        "customer.updated",
        customer,
        previous,
        fake.clockOf(customer.id as string)
      );
      return customer;
    }
  },
  {
    method: "delete",
    path: "/v1/customers/{customer}",
    handler: ({ fake, params }) => {
      const customer = fake.get(params.customer, "customer", "customer");
      customer.deleted = true;
      fake.emit(
        "customer.deleted",
        customer,
        undefined,
        fake.clockOf(customer.id as string)
      );
      return { id: customer.id, object: "customer", deleted: true };
    }
  },
  {
    method: "get",
    path: "/v1/customers",
    handler: ({ fake, body }) =>
      list(
        "/v1/customers",
        fake.all("customer", (c) => !body.email || c.email === body.email),
        body
      )
  },
  {
    method: "get",
    path: "/v1/customers/{customer}/payment_methods",
    handler: ({ fake, params, body }) => {
      fake.get(params.customer, "customer", "customer");
      return list(
        `/v1/customers/${params.customer}/payment_methods`,
        fake.all("payment_method", (p) => p.customer === params.customer),
        body
      );
    }
  }
];
