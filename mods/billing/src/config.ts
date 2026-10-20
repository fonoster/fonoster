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
import { loadServiceConfig, natsConnectionSchema } from "@fonoster/common";
import { z } from "zod";

/**
 * The billing service's file, `billing.yaml` (add-billing-service). Values marked "proposed" wait
 * for the owner's answer (design.md, Open Questions) and are settings so the answer is a config
 * change.
 */
export const billingConfigSchema = z
  .object({
    database: z.object({ url: z.string().min(1) }),
    /** The bus: URL, and the `billing` user's password where NATS has per-service users. */
    nats: natsConnectionSchema,
    /**
     * Identity's database, read for who owns a workspace (as the apiserver reads it). Without it
     * no workspace has an owner, and every call is admitted.
     */
    identity: z
      .object({
        databaseUrl: z.string().min(1),
        encryptionKey: z.string().min(1)
      })
      .optional(),
    /** The Authz and Billing gRPC services. */
    grpc: z
      .object({
        bind: z.string().default("0.0.0.0"),
        port: z.number().int().positive().default(50071),
        /** The Billing API (billing.proto), for the apiserver. */
        apiPort: z.number().int().positive().default(50073)
      })
      .default({}),
    /** The HTTP server for Stripe's webhooks (`POST /stripe/webhooks`). */
    http: z
      .object({
        bind: z.string().default("0.0.0.0"),
        port: z.number().int().positive().default(50072)
      })
      .default({}),
    /** Where the rate card YAML files are (one per version). */
    rateCards: z.object({ dir: z.string().min(1) }),
    plans: z
      .object({
        /** Trial credits, granted once (no overdraft). */
        trialCredits: z.number().int().nonnegative().default(1000),
        /** Q2: trial credits expire this many days after the grant. */
        trialDays: z.number().int().positive().default(30),
        /** Pay-as-you-go: the monthly fee in cents and the plan credits it buys. */
        planFeeCents: z.number().int().positive().default(2500),
        planCredits: z.number().int().nonnegative().default(2500),
        /** Plan credits stay spendable this long after the period (D9, Q1). */
        graceHours: z.number().int().nonnegative().default(72),
        /** Top-up credits last this long. */
        topupMonths: z.number().int().positive().default(12),
        /** Q5: the smallest top-up, in credits. */
        topupMinCredits: z.number().int().positive().default(1000),
        /** The overdraft: the larger of a floor and a share of the last top-up. */
        overdraftMinCredits: z.number().int().nonnegative().default(200),
        overdraftPercent: z.number().nonnegative().default(10),
        /** Q4: concurrent calls per plan. */
        concurrency: z
          .object({
            trial: z.number().int().positive().default(2),
            payg: z.number().int().positive().default(20)
          })
          .default({})
      })
      .default({}),
    /** Where time comes from (D10): the system clock, or a Stripe test clock in tests. */
    clock: z
      .discriminatedUnion("kind", [
        z.object({ kind: z.literal("system") }),
        z.object({
          kind: z.literal("stripe-test-clock"),
          clockId: z.string().min(1)
        })
      ])
      .default({ kind: "system" }),
    stripe: z
      .object({
        secretKey: z.string().min(1),
        webhookSecret: z.string().min(1),
        /** Another Stripe API host (the Stripe fake in dev and CI), e.g. http://stripe-fake:12111. */
        apiBase: z.string().url().optional(),
        /** Stripe Tax computes tax on the subscription and top-ups (Q6); needs Tax set up in Stripe. */
        automaticTax: z.boolean().default(true)
      })
      .optional(),
    logs: z
      .object({ level: z.string().optional(), format: z.string().optional() })
      .passthrough()
      .optional()
  })
  .strict();

export type BillingConfig = z.output<typeof billingConfigSchema>;
export type PlanSettings = BillingConfig["plans"];

/** Loads `billing.yaml` (or `--config <path>`). */
export function loadBillingConfig(argv = process.argv): BillingConfig {
  return loadServiceConfig({
    service: "billing",
    schema: billingConfigSchema,
    argv,
    // Passwords and keys come from the container's environment, as for the other services.
    interpolatePaths: ["*"]
  });
}

/** The plan defaults, for code and tests that run without a file. */
export const DEFAULT_PLANS: PlanSettings =
  billingConfigSchema.shape.plans.parse(undefined);
