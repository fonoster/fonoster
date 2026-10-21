# Proposal

## Why

The billing service (add-billing-service) keeps each owner's credits, buys top-ups, runs
auto-recharge and moves owners from the Trial to Pay-as-you-go, but owners can only use it through
the Billing API. Cloud owners need a page for it. The owner split the page out of
add-billing-service (Q7, 2026-10-20) so the service could ship and be reviewed without waiting on
the design.

## What Changes

**Fonoster Cloud only.** Billing exists only where the capabilities say `billing.enabled`, which
only Fonoster Cloud turns on. Self-hosted and Community installs never show it, and nothing about
billing appears there.

- A **Billing page of its own** at `/billing`, outside the workspaces: one account pays for every
  workspace the owner has, so it doesn't live inside one, and it isn't mixed with the workspace
  list. It has the account's top bar (logo, back to the workspace, the user, Sign out).
- The way in is the **account menu**: the user's name at the bottom of the sidebar opens Billing
  (with the balance), All workspaces and Sign out. Shown with `billing.enabled` to users who own a
  workspace.
- The page shows:
  - the plan (Trial or Pay-as-you-go) and when it renews or the Trial ends
  - the balance in credits, and how far below zero it may go (the overdraft)
  - the credits by source (plan, top-up, trial), each with its expiry
  - a **Top up** action, with credits counted before tax
  - auto-recharge (off by default) with its threshold and amount
  - a **Manage payment methods and invoices** link that opens the Stripe Customer Portal
- On the Trial, and once it ended, the one primary action is **Upgrade to Pay-as-you-go**. It asks
  for a payment method in the portal first when there is none. A Trial that ended says calls are
  paused.
- When a payment failed (`past_due`), a notice says so and the primary action opens the portal.
- `@fonoster/sdk` has the `Billing` client the page uses (done: getBilling, updateAutoRecharge,
  createTopUp, subscribe, createPortalSession).
- The design comes first: the "Billing (cloud only)" frames in `designs/dashboard.pen`, approved by
  the owner.

Out of scope:
- Prices on the Usage page (`costs.display: prices`).
- Docs: billing isn't documented until it ships.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `dashboard`: "Cloud-only screens follow capabilities" gives way to a version with a Billing page
  for owners, and owners manage billing there.

## Impact

- `mods/dashboard`: the `/billing` route and page, the account menu item, a `useBilling` hook,
  stories, unit tests and an end-to-end test against the stack with the Stripe fake.
- `designs/dashboard.pen`: the Billing frames.
- Depends on add-billing-service (the Billing API, the `billing` stack profile) and the Stripe fake.
