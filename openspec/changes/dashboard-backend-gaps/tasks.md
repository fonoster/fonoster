## 1. Backend for dashboard screens (from dashboard-tailwind-migration section 5)

- [x] 1.1 `appRef` on CDRs, and the calls filters by agent or app
- [ ] 1.2 Workspace member count and last activity on the Select cards
- [ ] 1.3 The user's pending invites on the landing screen
- [ ] 1.4 Member role update
- [ ] 1.5 Endpoint health, and call stats for Overview
- [ ] 1.6 Transcripts and latency (conversation event store)
- [ ] 1.7 Agent evals and knowledge upload
- [ ] 1.8 Cost model
- [ ] 1.9 Two-step sign-in (2FA)
- [ ] 1.10 `app_ref` on the gRPC `CallDetailRecord` and an app filter on `Calls.ListCalls`, so SDK users see and filter by the app that handled a call

## 2. Gaps found while building section 4

- [ ] 2.1 Un-routing a number, and clearing a trunk/ACL/credentials link (empty strings can't clear proto3 refs)
- [ ] 2.2 IPv6 in ACLs (the validator is IPv4-only)
- [ ] 2.3 `UpdateCredentialsRequest` lacks username/password; the `Privacy` enum in @fonoster/types says `ID` for PRIVATE
- [ ] 2.4 API keys can only be WORKSPACE_ADMIN
- [ ] 2.5 Counts and reverse lookups (numbers per trunk/app, what uses an ACL or credential)
- [ ] 2.6 Import from YAML, webhook "send test", endpoint health, and phone/chat test calls

## 3. CI

- [ ] 3.1 Run `test-storybook` in CI for both projects (typecheck, vitest and Playwright already run)
