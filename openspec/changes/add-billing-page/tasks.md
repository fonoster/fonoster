## 1. Design

- [ ] 1.1 Billing tab frames in `designs/dashboard.pen`: Trial, Pay-as-you-go, top-up dialog, auto-recharge, payment in progress, past due; verify the owner approves them

## 2. SDK

- [x] 2.1 `Billing` client in `@fonoster/sdk` (getBilling, updateAutoRecharge, createTopUp, subscribe, createPortalSession) with docs comments; verify SDK unit tests

## 3. Dashboard

- [ ] 3.1 `settings/billing` route and tab, shown only with `billing.enabled` and to the owner (D1, D2); verify unit tests for the three "no tab" and "tab" scenarios
- [ ] 3.2 Billing screen per the approved design: plan, balance and overdraft, sources with expiry, auto-recharge, portal link, past-due notice (D3–D6); verify stories and unit tests
- [ ] 3.3 Top-up and upgrade flows with the portal round trip and bounded polling (D5, D7); verify unit tests for the upgrade, top-up, below-minimum and failed-payment scenarios

## 4. Verification

- [ ] 4.1 End-to-end test against the compose stack with the `billing` profile and the Stripe fake: upgrade, top up, see the credits; verify with Playwright
- [ ] 4.2 `openspec validate add-billing-page --strict` passes
