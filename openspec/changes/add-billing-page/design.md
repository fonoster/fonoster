# Design

## Context

add-billing-service gives the apiserver a `Billing` gRPC service (owners only; `owner_ref` is always
the caller). The dashboard already reads `billing.enabled` and `costs.display` from the
capabilities. Billing belongs to the owner, not to a workspace: one account pays for every
workspace the owner has. The dashboard spec today says there is no Billing tab in this release.

## Goals / Non-Goals

**Goals:**
- One place where an owner sees their credits and can top up, set auto-recharge, upgrade, and reach
  Stripe for cards and invoices.
- Nothing billing-related in Community installs or for users who own no workspace.

**Non-Goals:**
- Card entry or invoices inside the dashboard: the Stripe Customer Portal does both.
- Prices next to usage.

## Decisions

### D0. Fonoster Cloud only (owner, 2026-10-20)

Billing shows up only on Fonoster Cloud: `billing.enabled` is on only there. Self-hosted and
Community installs never see the page, its route, its menu item, or any billing copy. Every screen
of the design is a Cloud screen; there is no self-hosted variant to design.

### D1. A page of its own, outside the workspaces (owner, 2026-10-20)

Billing is the account's, so it is not inside a workspace: no Settings tab, and not mixed with the
list of workspaces either. It is its own page at `/billing`, with the account's top bar (logo,
"Back to <workspace>", the user, Sign out) like the workspace picker, and nothing else. Usage stays a
workspace page, in every edition.

The way in is the account menu: the user's name at the bottom of the sidebar opens a menu with
**Billing** (showing the balance), All workspaces and Sign out.

### D2. Users who own a workspace, decided on the client and enforced on the server

The menu item and the page exist when `billing.enabled` and the signed-in user owns at least one
workspace (a workspace's `ownerRef` is the user's `sub`). Anyone else who opens `/billing` goes to
the workspace picker. The Billing API checks ownership per workspace, so the page signs its
requests with a workspace the user owns (the one they came from when they own it, else the first);
the account is the same whichever. The server refuses everyone else anyway.

### D3. One account across workspaces

The page says "Your credits pay for calls in every workspace you own" once, under the title.

### D4. Credits first, dollars where money moves

Balances are shown in credits (1 credit = $0.01). The top-up choices show both ("1,000 credits ·
$10.00") and say tax is added at checkout when it applies. The smallest top-up is the service's
(1,000 credits); the choices are 1,000, 2,500 and 5,000, plus a custom amount.

### D5. The portal opens in the same tab

`createPortalSession` with `return_url` set to the Billing page's URL; the browser goes there and
comes back. After returning, the page reloads the summary, so a card added in the portal counts at
once.

### D6. One primary action

Following the design rules (one primary action, no optional prompts): on the Trial, and once it
ended, the primary action is **Upgrade to Pay-as-you-go**; on Pay-as-you-go it is **Top up**; after
a failed payment it is **Update payment method** (the Customer Portal). Everything else is
secondary.

### D8. The Trial ends

A Trial past its 30 days (add-billing-service Q11, status `ended`) shows "Your Trial has ended:
calls are paused in your workspaces" and the upgrade.

### D7. Waiting for Stripe

A top-up returns before the payment succeeds: credits arrive with the webhook. After a top-up the
page shows "Payment in progress" and polls the summary every 2 s for up to 30 s, then stops polling
and says the credits will appear once the payment clears.

## Risks / Trade-offs

- [The owner check on the client could drift from the server's] → the server is the authority; the
  client check only hides the menu item and the page. A refused call shows the usual permission error.
- [Polling after a top-up] → bounded to 30 s; a slow payment shows a plain message, not an error.

## Open Questions

- None. The frames (designs/dashboard.pen, "Billing (cloud only)") are approved before the page is
  built (task 1.1).
