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
import { credits, date, dollars } from "../format";
import { Mono, Muted, PageHeader, Section, Table } from "../ui";
import type { ScreenProps } from "./common";

const RULES = [
  "Grants pay for metered prices only, when an invoice is finalized.",
  "Order: priority, then the earliest expiry, then promotional before paid, then the earliest effective date.",
  "Each grant sends billing.credit_grant.created; each use records a credit balance transaction and sends billing.credit_balance_transaction.created."
];

export function CreditGrants({ state }: ScreenProps) {
  const grants = [...state.creditGrants].reverse();
  return (
    <>
      <PageHeader title="Credit grants" sub="1 credit = $0.01" />
      <Section>
        <Table
          columns={[
            { label: "ID" },
            { label: "Customer", width: 200 },
            { label: "Category", width: 110 },
            { label: "Amount", width: 170 },
            { label: "Effective", width: 110 },
            { label: "Expires", width: 110 },
            { label: "Remaining", width: 110 }
          ]}
          empty="No credit grants yet."
          rows={grants.map((g) => {
            const amount = g.amount.monetary.value as number;
            return {
              key: g.id,
              cells: [
                <Mono key="i">{g.id}</Mono>,
                <Mono key="c">{g.customer}</Mono>,
                g.category,
                <>
                  {credits(amount)} cr · {dollars(amount)}
                </>,
                date(g.effective_at),
                g.expires_at ? date(g.expires_at) : "never",
                g.voided_at ? (
                  <Muted key="v">voided</Muted>
                ) : (
                  credits(state.grantRemaining[g.id] ?? 0)
                )
              ]
            };
          })}
        />
      </Section>
      <Section title="How the fake applies grants">
        <ul className="m-0 flex list-none flex-col gap-1.5 rounded-lg border border-border p-4 text-[13px]">
          {RULES.map((r) => (
            <li key={r} className="flex gap-2">
              <span className="text-text-muted">–</span>
              {r}
            </li>
          ))}
        </ul>
      </Section>
    </>
  );
}
