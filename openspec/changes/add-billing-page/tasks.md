## 1. Design

- [x] 1.1 Billing frames in `designs/dashboard.pen` ("Billing (cloud only)"): account-menu entry, Pay-as-you-go, Trial, Trial ended, top-up dialog, auto-recharge dialog, payment in progress, payment failed; verify the owner approves them

## 2. SDK

- [x] 2.1 `Billing` client in `@fonoster/sdk` (getBilling, updateAutoRecharge, createTopUp, subscribe, createPortalSession) with docs comments; verify SDK unit tests

## 3. Dashboard

- [x] 3.1 `/billing` route outside the workspaces with the account top bar, and the Billing item in the account menu, both only with `billing.enabled` and for users who own a workspace (D0–D2); verify unit tests for the "no billing" and "billing page" scenarios
- [x] 3.2 Billing page per the approved design: plan, balance and overdraft, sources with expiry, auto-recharge, portal link, past-due and Trial-ended notices (D3–D6, D8); verify stories and unit tests
- [x] 3.3 Top-up, auto-recharge and upgrade flows with the portal round trip and bounded polling (D5, D7); verify unit tests for the upgrade, top-up, below-minimum, failed-payment and Trial-ended scenarios

## 4. Verification

- [ ] 4.1 End-to-end test against the compose stack with the `billing` profile and the Stripe fake: upgrade, top up, see the credits; verify with Playwright
- [ ] 4.2 `openspec validate add-billing-page --strict` passes
