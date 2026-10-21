## 1. Spec and configuration

- [x] 1.1 `dashboard` and `capabilities` scenarios updated
- [x] 1.2 `values-cloud.yaml` enables `password` and `email_code`
- [x] 1.3 `openspec validate cloud-offers-password-sign-in --strict` passes

## 2. Tests

- [x] 2.1 Cloud fixture advertises `[password, email_code, github]`
- [x] 2.2 DSH-006 (code via the link), DSH-007 (GitHub), DSH-008 (forged callback) tagged, landing on the list, each proven red
- [x] 2.4 DSH-009: unknown email asks for a code, enters one, sees the wrong-code message and nothing about the account; proven red
- [x] 2.3 DSH-016 cloud password sign-in added and proven red
