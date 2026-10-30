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
/**
 * The Customer Portal (Stripe's hosted page at billing.stripe.com): `GET /p/session/test_<id>`
 * shows the session's customer, and its forms pick a test card as the default, cancel the plan at
 * the period's end (the portal's default) or renew it. Actions go through the API's own handlers,
 * so they emit the events Stripe would.
 */
import { StripeError } from "./errors";
import { Json, StripeFake } from "./fake";
import { billingRoutes } from "./resources/billing";
import { customerRoutes } from "./resources/customers";
import { paymentRoutes } from "./resources/payments";
import { Route } from "./router";

/** The test cards the portal offers (resources/payments.ts knows how each one behaves). */
const CARDS: [string, string][] = [
  ["pm_card_visa", "Visa ending 4242 · succeeds"],
  ["pm_card_mastercard", "Mastercard ending 4444 · succeeds"],
  ["pm_card_chargeDeclined", "Visa ending 0002 · declined"],
  [
    "pm_card_chargeDeclinedInsufficientFunds",
    "Visa ending 9995 · insufficient funds"
  ],
  ["pm_card_authenticationRequired", "Visa ending 3184 · needs authentication"]
];

const ROUTES: Route[] = [...customerRoutes, ...paymentRoutes, ...billingRoutes];

function call(
  fake: StripeFake,
  method: Route["method"],
  path: string,
  params: Record<string, string>,
  body: Json = {}
) {
  const route = ROUTES.find((r) => r.method === method && r.path === path);
  if (!route) throw new Error(`no route ${method} ${path}`);
  return route.handler({ fake, params, body });
}

const escape = (s: unknown) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!
  );

const date = (seconds: unknown) =>
  new Date(Number(seconds) * 1000).toISOString().slice(0, 10);

export type PortalResponse =
  { status: number; html: string } | { status: 303; location: string };

/** Answers `/p/session/test_<id>` (GET shows, POST acts and redirects back). */
export async function portal(
  fake: StripeFake,
  method: string,
  pathname: string,
  form: Json
): Promise<PortalResponse> {
  const id = /^\/p\/session\/test_([^/]+)$/.exec(pathname)?.[1];
  const session = id && fake.objects.get(id);
  if (!session || session.object !== "billing_portal.session")
    return {
      status: 404,
      html: page(
        "Session not found",
        `<main><section><h2>Session not found</h2><p class="muted">This portal link is not valid.</p></section></main>`
      )
    };
  const customer = fake.get(session.customer as string, "customer");
  const sub = fake
    .all(
      "subscription",
      (s) => s.customer === customer.id && s.status !== "canceled"
    )
    .at(-1);

  if (method === "post") {
    if (form.action === "card") {
      if (!CARDS.some(([pm]) => pm === form.card))
        throw new StripeError(400, "invalid_request_error", "unknown card");
      const pm = (await call(
        fake,
        "post",
        "/v1/payment_methods/{payment_method}/attach",
        { payment_method: form.card as string },
        { customer: customer.id }
      )) as Json;
      await call(
        fake,
        "post",
        "/v1/customers/{customer}",
        { customer: customer.id as string },
        { invoice_settings: { default_payment_method: pm.id } }
      );
    } else if (sub && (form.action === "cancel" || form.action === "renew")) {
      await call(
        fake,
        "post",
        "/v1/subscriptions/{subscription_exposed_id}",
        { subscription_exposed_id: sub.id as string },
        { cancel_at_period_end: String(form.action === "cancel") }
      );
    }
    return { status: 303, location: pathname };
  }

  const defaultId = (customer.invoice_settings as Json | null)
    ?.default_payment_method as string | null;
  const current = defaultId ? fake.objects.get(defaultId) : undefined;
  const card = current?.card as Json | undefined;
  const item = sub ? ((sub.items as Json).data as Json[])[0] : undefined;
  const price = item?.price as Json | undefined;
  const amount = price?.unit_amount
    ? `$${(Number(price.unit_amount) / 100).toFixed(2)} per month`
    : "";
  const action = (name: string, label: string, kind = "secondary") =>
    `<form method="post"><input type="hidden" name="action" value="${name}"><button class="${kind}">${label}</button></form>`;
  const plan = !sub
    ? `<p class="muted">No current plan.</p>`
    : `<div class="row"><div><div class="strong">Pay-as-you-go</div><div class="big">${amount}</div>
         <div class="muted">${
           sub.cancel_at_period_end
             ? `<span class="badge danger">Cancels ${date(item?.current_period_end)}</span>`
             : `Renews ${date(item?.current_period_end)}`
         }</div></div>
         ${sub.cancel_at_period_end ? action("renew", "Renew plan", "primary") : action("cancel", "Cancel plan", "danger")}</div>`;
  const back = session.return_url
    ? `<a class="back" href="${escape(session.return_url)}">← Return to Fonoster</a>`
    : "";
  return {
    status: 200,
    html: page(
      "Customer Portal",
      `<aside><div class="brand">Fonoster</div>
         <p class="muted">Fonoster partners with Stripe for simplified billing.</p>${back}</aside>
       <main>
         <section><h2>Current plan</h2>${plan}</section>
         <section><h2>Payment method</h2>
           <div class="row"><div>${
             card
               ? `<span class="strong">${escape(String(card.brand).toUpperCase())}</span> •••• ${escape(card.last4)} <span class="badge">Default</span>`
               : `<span class="muted">No payment method on file.</span>`
           }</div></div>
           <form method="post" class="add"><input type="hidden" name="action" value="card">
             <label for="card" class="muted">Test card</label>
             <div class="row"><select id="card" name="card">${CARDS.map(([pm, label]) => `<option value="${pm}">${escape(label)}</option>`).join("")}</select>
             <button class="primary">${card ? "Replace card" : "Add card"}</button></div></form>
         </section>
       </main>`
    )
  };
}

/**
 * The viewer's sf-* tokens (viewer/src/styles.css). The theme is the viewer's: its choice in this
 * browser (theme.ts, same origin), else the system's.
 */
function page(title: string, body: string) {
  return `<!doctype html><html><head><meta charset="utf-8"><title>${title} · Stripe fake</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<script>try{var t=localStorage.getItem("stripe-fake-theme");if(t)document.documentElement.dataset.theme=t}catch(e){}</script>
<style>
:root{--bg:#f6f9fc;--surface:#fff;--muted:#eeedff;--border:#e3e8ee;--text:#0a2540;--text-muted:#596171;--accent:#635bff;--on-accent:#fff;--danger:#df1b41;color-scheme:light}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#14171d;--surface:#1b1f27;--muted:#272c38;--border:#2c313c;--text:#e6e8ec;--text-muted:#8c93a1;--accent:#857fff;--danger:#ff7a8f;color-scheme:dark}}
:root[data-theme="dark"]{--bg:#14171d;--surface:#1b1f27;--muted:#272c38;--border:#2c313c;--text:#e6e8ec;--text-muted:#8c93a1;--accent:#857fff;--danger:#ff7a8f;color-scheme:dark}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font:14px/1.5 Inter,ui-sans-serif,system-ui,sans-serif;-webkit-font-smoothing:antialiased}
.test{background:var(--accent);color:var(--on-accent);text-align:center;font-size:12px;font-weight:600;padding:4px}
.wrap{display:grid;grid-template-columns:1fr;gap:32px;max-width:960px;margin:0 auto;padding:40px 16px}
@media (min-width:800px){.wrap{grid-template-columns:280px 1fr;gap:64px;padding:64px 24px}}
.brand{font-size:20px;font-weight:800;margin-bottom:8px}.back{color:var(--accent);text-decoration:none;font-weight:500}
section{background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:24px;margin-bottom:24px}
h2{font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted);margin:0 0 16px;font-weight:600}
.row{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}
.strong{font-weight:600}.big{font-size:24px;font-weight:600;margin:4px 0}.muted{color:var(--text-muted)}
.badge{display:inline-block;background:var(--muted);color:var(--text);font-size:12px;font-weight:500;padding:1px 8px;border-radius:999px;margin-left:6px}
.badge.danger{color:var(--danger);margin-left:0}
.add{margin-top:20px;padding-top:20px;border-top:1px solid var(--border)}.add label{display:block;margin-bottom:6px;font-size:12px}
select{flex:1;min-width:0;padding:8px 10px;border:1px solid var(--border);border-radius:6px;background:var(--surface);color:var(--text);font:inherit}
button{font:inherit;font-weight:600;padding:8px 14px;border-radius:6px;cursor:pointer;border:1px solid var(--border);background:var(--surface);color:var(--text)}
button.primary{background:var(--accent);border-color:var(--accent);color:var(--on-accent)}
button.danger{color:var(--danger)}form{margin:0}
</style></head>
<body><div class="test">Test mode · Stripe fake</div><div class="wrap">${body}</div></body></html>`;
}
