# Tasks

## 1. Playbook

- [x] 1.1 `ops/ansible`: `ansible.cfg`, `.ansible-lint`, `playbooks/site.yml`, roles `host` and
      `fonoster`, `inventory.example/`, `README.md`
- [x] 1.2 `ops/release/bundle` writes `SHA256SUMS`; `release.yaml` publishes it

## 2. Proof

- [x] 2.1 `ops/ansible/test/throwaway.sh` and `test/inventory.yml` (the runner as the target)
- [x] 2.2 Catalog area `operations.md` (OPS-003, OPS-004, OPS-005) with fault patches; the
      `operations` job in `qa-proofs.yaml`
- [x] 2.3 `ansible-lint` in `pr-checks.yaml`; `playbook (throwaway)` in `stack-smoke.yaml`

## 3. Helm unsupported

- [x] 3.1 Remove the `helm` job and path filter from `stack-smoke.yaml`; "Unsupported" note in the
      chart's `Chart.yaml`
