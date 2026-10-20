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
import { int, list, metadataOf, Route } from "../router";

/** Products and prices, licensed and metered (add-stripe-fake 2.2). */
export const catalogRoutes: Route[] = [
  {
    method: "post",
    path: "/v1/products",
    handler: ({ fake, body }) => {
      if (!body.name) throw missing("name");
      const product = fake.create("product", "prod", {
        object: "product",
        name: body.name,
        active: body.active !== "false",
        description: body.description ?? null,
        metadata: metadataOf(body),
        default_price: null,
        tax_code: body.tax_code ?? null,
        updated: fake.now(),
        images: [],
        marketing_features: [],
        type: "service",
        url: null
      });
      fake.emit("product.created", product);
      return product;
    }
  },
  {
    method: "get",
    path: "/v1/products/{id}",
    handler: ({ fake, params }) => fake.get(params.id, "product")
  },
  {
    method: "post",
    path: "/v1/products/{id}",
    handler: ({ fake, params, body }) => {
      const product = fake.get(params.id, "product");
      const fields: Record<string, unknown> = {};
      ["name", "description", "tax_code"].forEach(
        (k) => body[k] !== undefined && (fields[k] = body[k])
      );
      if (body.active !== undefined) fields.active = body.active === "true";
      if (body.metadata !== undefined)
        fields.metadata = metadataOf(
          body,
          product.metadata as Record<string, unknown>
        );
      const previous = fake.update(product, { ...fields, updated: fake.now() });
      fake.emit("product.updated", product, previous);
      return product;
    }
  },
  {
    method: "get",
    path: "/v1/products",
    handler: ({ fake, body }) => list("/v1/products", fake.all("product"), body)
  },
  {
    method: "post",
    path: "/v1/prices",
    handler: ({ fake, body }) => {
      if (!body.currency) throw missing("currency");
      if (!body.product) throw missing("product");
      fake.get(body.product as string, "product", "product");
      const recurring = body.recurring as Record<string, string> | undefined;
      if (recurring?.usage_type === "metered" && !recurring.meter)
        throw new StripeError(
          400,
          "invalid_request_error",
          "Metered prices must be backed by a meter.",
          { param: "recurring[meter]" }
        );
      if (recurring?.meter)
        fake.get(recurring.meter, "billing meter", "recurring[meter]");
      const transform = body.transform_quantity as
        Record<string, string> | undefined;
      const price = fake.create("price", "price", {
        object: "price",
        active: body.active !== "false",
        currency: body.currency,
        product: body.product,
        nickname: body.nickname ?? null,
        lookup_key: body.lookup_key ?? null,
        metadata: metadataOf(body),
        unit_amount: int(body.unit_amount) ?? null,
        unit_amount_decimal:
          (body.unit_amount_decimal as string) ??
          (body.unit_amount !== undefined ? String(body.unit_amount) : null),
        billing_scheme: "per_unit",
        tax_behavior: (body.tax_behavior as string) ?? "unspecified",
        type: recurring ? "recurring" : "one_time",
        recurring: recurring
          ? {
              interval: recurring.interval ?? "month",
              interval_count: Number(recurring.interval_count ?? 1),
              usage_type: recurring.usage_type ?? "licensed",
              meter: recurring.meter ?? null,
              trial_period_days: null
            }
          : null,
        transform_quantity: transform
          ? {
              divide_by: Number(transform.divide_by),
              round: transform.round ?? "up"
            }
          : null,
        tiers_mode: null,
        custom_unit_amount: null
      });
      fake.emit("price.created", price);
      return price;
    }
  },
  {
    method: "get",
    path: "/v1/prices/{price}",
    handler: ({ fake, params }) => fake.get(params.price, "price", "price")
  },
  {
    method: "post",
    path: "/v1/prices/{price}",
    handler: ({ fake, params, body }) => {
      const price = fake.get(params.price, "price", "price");
      // Amounts, currency and tax behavior are immutable once set, as on Stripe.
      [
        "unit_amount",
        "currency",
        "recurring",
        "transform_quantity",
        "product"
      ].forEach((k) => {
        if (body[k] !== undefined)
          throw new StripeError(
            400,
            "invalid_request_error",
            `Received unknown parameter: ${k}`,
            { param: k }
          );
      });
      if (
        body.tax_behavior !== undefined &&
        price.tax_behavior !== "unspecified" &&
        body.tax_behavior !== price.tax_behavior
      )
        throw new StripeError(
          400,
          "invalid_request_error",
          "tax_behavior cannot be changed once it is set.",
          { param: "tax_behavior" }
        );
      const fields: Record<string, unknown> = {};
      ["nickname", "lookup_key", "tax_behavior"].forEach(
        (k) => body[k] !== undefined && (fields[k] = body[k])
      );
      if (body.active !== undefined) fields.active = body.active === "true";
      if (body.metadata !== undefined)
        fields.metadata = metadataOf(
          body,
          price.metadata as Record<string, unknown>
        );
      const previous = fake.update(price, fields);
      fake.emit("price.updated", price, previous);
      return price;
    }
  },
  {
    method: "get",
    path: "/v1/prices",
    handler: ({ fake, body }) =>
      list(
        "/v1/prices",
        fake.all(
          "price",
          (p) =>
            (!body.product || p.product === body.product) &&
            (body.active === undefined || String(p.active) === body.active) &&
            (!body.lookup_keys ||
              Object.values(body.lookup_keys as object).includes(p.lookup_key))
        ),
        body
      )
  }
];
