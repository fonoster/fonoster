# Proposal

## Why

The billing service (add-billing-service) keeps each owner's credits, buys top-ups, runs
auto-recharge and moves owners from the Trial to Pay-as-you-go, but owners can only use it through
the Billing API. Cloud owners need a page for it. The owner split the page out of
add-billing-service (Q7, 2026-10-20) so the service could ship and be reviewed without waiting on
the design.

## What Changes

**Fonoster Cloud only.** The tab exists only where the capabilities say `billing.enabled`, which
only Fonoster Cloud turns on. Self-hosted and Community installs never show it, and nothing about
billing appears there.

- A **Billing** tab in Settings, shown only when the capabilities say `billing.enabled` and only to
  the owner of the workspace. Billing belongs to the owner, so the tab shows one account that
  covers every workspace they own, and says so.
- The tab shows:
  - the plan (Trial or Pay-as-you-go) and when it renews or the trial ends
  - the balance in credits, and how far below zero it may go (the overdraft)
  - the credits by source (plan, top-up, trial), each with its expiry
  - a **Top up** action, with credits counted before tax
  - auto-recharge (off by default) with its threshold and amount
  - a **Manage payment methods and invoices** link that opens the Stripe Customer Portal
- On the Trial, the one primary action is **Upgrade to Pay-as-you-go**. It asks for a payment
  method in the portal first when there is none.
- When a payment failed (`past_due`), a notice says so and links to the portal.
- `@fonoster/sdk` gains the `Billing` client the page uses: getBilling, updateAutoRecharge,
  createTopUp, subscribe and createPortalSession.
- The design comes first: Billing tab frames in `designs/dashboard.pen`, approved by the owner.

Out of scope:
- Prices on the Usage page (`costs.display: prices`).
- Showing billing to workspace admins who aren't the owner.
- Docs: billing isn't documented until it ships.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `dashboard`: "Cloud-only screens follow capabilities" gives way to a version with a Billing tab for owners, and owners manage billing there.

## Impact

- `mods/dashboard`: the Settings tab, its screen, a `useBilling` hook, stories, unit tests and an
  end-to-end test against the stack with the Stripe fake.
- `mods/sdk`: a `Billing` client over the apiserver's Billing service, which add-billing-service
  already proxies for owners only.
- `designs/dashboard.pen`: the Billing tab frames.
- Depends on add-billing-service (the Billing API and the compose `billing` profile) and
  add-stripe-fake (the portal session in tests).
