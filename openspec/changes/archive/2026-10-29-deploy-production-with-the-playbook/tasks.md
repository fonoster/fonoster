# Tasks

## 1. Deploy

- [x] 1.1 `deploy.yaml`: `plan` (no credential) and `apply` (approval, rollback on failure)
- [x] 1.2 `.github/actions/ansible`: pinned ansible-core, SSH key, known hosts, vault password
- [x] 1.3 `playbooks/rollback.yml`; the `deploy` user in the host role
- [x] 1.4 Delete `ops/deploy/**`

## 2. Proof

- [x] 2.1 `deploymentRules.test.ts` asserts the plan and apply jobs
- [x] 2.2 `throwaway.sh --rollback` and catalog case OPS-006 with its fault patch

## 3. Docs

- [x] 3.1 `ops/ansible/README.md` "Fonoster Cloud", `AGENTS.md`, workflow header comments
