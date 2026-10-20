# Design

## Context

add-billing-service gives the apiserver a `Billing` gRPC service (owners only; `owner_ref` is always
the caller). The dashboard already reads `billing.enabled` and `costs.display` from the
capabilities, and Settings has General, Members and (with private regions) Region tabs. The
dashboard spec today says there is no Billing tab in this release.

## Goals / Non-Goals

**Goals:**
- One place where an owner sees their credits and can top up, set auto-recharge, upgrade, and reach
  Stripe for cards and invoices.
- Nothing billing-related in Community installs or for members who aren't the owner.

**Non-Goals:**
- Card entry or invoices inside the dashboard: the Stripe Customer Portal does both.
- Prices next to usage.

## Decisions

### D1. A Settings tab, not a sidebar entry

Billing is an account matter visited rarely, like Members. It goes in Settings at
`settings/billing`, after Members. Usage stays its own page, in every edition.

### D0. Fonoster Cloud only (owner, 2026-10-20)

The Billing tab shows up only on Fonoster Cloud: `billing.enabled` is on only there. Self-hosted and
Community installs never see the tab, its route, or any billing copy. Every screen of the design is
a Cloud screen; there is no self-hosted variant to design.

### D2. Owners only, decided on the client and enforced on the server

The tab shows when `billing.enabled` and the signed-in user is the workspace's owner
(`workspace.ownerRef === user.sub`, as General does). The server refuses everyone else anyway. A
non-owner who opens the route goes back to General, like any unknown tab.

### D3. One account across workspaces

The account belongs to the owner, not the workspace. The tab says "Billing covers every workspace
you own" once, under the title. Switching workspaces shows the same numbers.

### D4. Credits first, dollars where money moves

Balances are shown in credits (1 credit = $0.01). The top-up choices show both ("1,000 credits ·
$10.00") and say tax is added at checkout when it applies. The smallest top-up is the service's
(1,000 credits); the choices are 1,000, 2,500 and 5,000, plus a custom amount.

### D5. The portal opens in the same tab

`createPortalSession` with `return_url` set to the Billing tab's URL; the browser goes there and
comes back. After returning, the page reloads the summary, so a card added in the portal counts at
once.

### D6. One primary action

Following the design rules (one primary action, no optional prompts): on the Trial the primary
action is **Upgrade to Pay-as-you-go**; on Pay-as-you-go it is **Top up**. Everything else is
secondary.

### D7. Waiting for Stripe

A top-up returns before the payment succeeds: credits arrive with the webhook. After a top-up the
page shows "Payment in progress" and polls the summary every 2 s for up to 30 s, then stops polling
and says the credits will appear once the payment clears.

## Risks / Trade-offs

- [The owner check on the client could drift from the server's] → the server is the authority; the
  client check only hides the tab. A refused call shows the usual permission error.
- [Polling after a top-up] → bounded to 30 s; a slow payment shows a plain message, not an error.

## Open Questions

- The design may change D4's top-up choices and D7's wording. The owner approves the frames before
  the page is built (task 1.1).
