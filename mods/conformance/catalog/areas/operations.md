---
prefix: OPS
title: Operations
level: L4 System (deployment)
tier: nightly
uut: The Ansible playbook in ops/ansible (playbooks/site.yml, roles host and fonoster) putting a host on a Fonoster version from two local builds of the release archive and images
tester: ops/ansible/test/throwaway.sh. It runs ansible-playbook against test/inventory.yml (this machine, local connection), then checks the live install, the state folder, the containers, the deploy log and the play's output, and writes one JUnit test per check
environment: A GitHub runner, Ubuntu 24.04 with root, Docker and Node.js; ansible-core 2.21.5 and ansible-lint 26.10.1; archives and images from ops/release/bundle; no certbot, the generated certificate, the bundled Postgres
cadence: proofs nightly and at release (qa-proofs.yaml)
prove: JUNIT_DIR={junitDir} bash ops/bundle/test/install.sh 0.0.0-a; JUNIT_DIR={junitDir} bash ops/ansible/test/throwaway.sh 0.0.0-a 0.0.0-b --rollback
capabilities:
  - deployment
  - self-host-installer
tests:
  - ops/bundle/test/install.sh
  - ops/ansible/test/throwaway.sh
---

# Operations

How Fonoster's own hosts are run: the Ansible playbook that puts a host on a version, plans the
change before it is made, and rolls back by applying the previous version. A case runs the playbook
for real on a throwaway runner, from a fresh machine, with two local builds (`0.0.0-a` and
`0.0.0-b`) of the release archive and images: plan, apply, apply again, switch to the other
version and back, and a failed apply that `playbooks/rollback.yml` undoes. The failures it must
refuse run there too: an archive that does not match its
`SHA256SUMS`, a release that adds a `.env` name the inventory lacks, an install whose keys are not
in the state folder.

Not here: production itself (the deploy workflow), the Compose bundle's own start (the compose job
of `stack-smoke.yaml`), the database (the playbook never touches it), the Helm chart (unsupported).
OPS-001 and OPS-002 are the Compose install's own: a fresh install from the archive, and an upgrade
from the latest published release with the documented commands (`ops/bundle/test/install.sh`).

## Running

```sh
# On a throwaway Ubuntu 24.04 machine with root or sudo, Docker, Node.js and ansible on PATH:
npm install && npm run build
ops/bundle/test/install.sh 0.0.0-a
THROWAWAY=1 ops/ansible/test/throwaway.sh 0.0.0-a 0.0.0-b --rollback
node mods/conformance/catalog/prove.cjs --area OPS --timeout 3600   # the proofs, one run per case
```

## Systems

```mermaid
flowchart LR
  subgraph TESTER["Tester (throwaway.sh)"]
    BUNDLE["ops/release/bundle: archives, SHA256SUMS, images"]
    CHECKS["Checks: files, containers, deploys.log, curl through the CA"]
  end
  subgraph UUT["Unit under test"]
    PLAY["playbooks/site.yml"]
    HOST["role host: Docker, traces"]
    FON["role fonoster: stage, switch, smoke"]
  end
  INV["test/inventory.yml"]
  LIVE[("/opt/fonoster")]
  STATE[("/var/lib/fonoster")]
  DOCKER["Docker Compose stack"]
  BUNDLE --> PLAY
  INV --> PLAY
  PLAY --> HOST
  PLAY --> FON
  FON --> STATE
  FON --> LIVE
  FON --> DOCKER
  CHECKS --> LIVE
  CHECKS --> STATE
  CHECKS --> DOCKER
```

## Cases

### OPS-001 A fresh install from the archive starts and serves

- **Spec:** self-host-installer / init prepares an install without prompts / Fresh folder
- **Priority:** P1
- **Proof:** Stop `init.sh` generating the `_PASSWORD`, `_SECRET`, `_KEY` and `_TOKEN` values; Compose refuses to start on the empty secrets and the test goes red.
- **Fault:** faults/OPS-001.patch
- **Test:** ops/bundle/test/install.sh

`ops/release/smoke` on this build's archive: unpack it, pre-seed `.env` with free ports, run
`./init.sh --host-ip 127.0.0.1` and `docker compose up -d`, then wait for the API server and call
the dashboard through the generated CA.

**Pass.** Every service is running, the dashboard answers 200 over HTTPS through `config/tls/ca.pem`, no HSTS header is sent with the generated certificate and the redirect port answers 301. **Fail.** Any of those differs.

### OPS-002 An install upgrades in place

- **Spec:** self-host-installer / An install upgrades in place / Secrets, keys and edited files survive
- **Spec:** self-host-installer / An install upgrades in place / The SIP port survives
- **Priority:** P1
- **Proof:** Stop `init.sh` moving `FONOSTER_VERSION` to its release; the upgraded install keeps running the previous release's images and the test goes red.
- **Fault:** faults/OPS-002.patch
- **Test:** ops/bundle/test/install.sh

The latest published release is installed the way it documents (its `.env` with `SIP_PORT=19002`
and an edited `config/fonoster.yaml`) and started. This build's archive is unpacked next to it,
`.env`, `config/keys`, `config/tls` and the edited file are copied in, `./init.sh` runs and
`docker compose up -d --wait` starts it under the same project name.

**Pass.** Every service starts; `.env` is the old one with `FONOSTER_VERSION` moved to this build (plus any added names); the keys and certificates are byte-identical; `config/fonoster.yaml` is the edited one; `config/routr-edgeport.yaml` listens on 19002; the API server runs this build's image and the dashboard answers 200 through the kept CA. **Fail.** Any of those differs.

### OPS-003 Plan then apply serves the dashboard and API

- **Spec:** deployment / A playbook puts a host on a Fonoster version / Plan then apply
- **Priority:** P1
- **Proof:** Empty `fonoster_live_excludes` in the fonoster role's defaults; the release's example files, README and schemas land in `/opt/fonoster` and the test goes red.
- **Fault:** faults/OPS-003.patch
- **Test:** ops/ansible/test/throwaway.sh

A plan (`--check --diff`) on the fresh runner, then an apply of `0.0.0-a`. The plan's output is
searched for every secret and `vault_` value of the inventory. After the apply the live folder is
checked for what must not be there, every service's state is read, and the dashboard and the API are
called through the CA the install generated. An archive whose `SHA256SUMS` does not match must fail
the play before anything in `/opt/fonoster` changes.

**Pass.** The plan exits 0, prints no secret and creates no `/opt/fonoster/compose.yaml`; the apply exits 0; `/opt/fonoster` has no `*.example.*`, `.env.example`, `README.md` or `config/schemas`; every service is `running`; the dashboard answers 200 and `ExchangeCredentials` answers `grpc-status: 3`; a checksum mismatch fails naming it, with `/opt/fonoster` byte-identical. **Fail.** Any of those differs.

### OPS-004 Applying the previous version rolls back

- **Spec:** deployment / A playbook puts a host on a Fonoster version / Another version
- **Priority:** P1
- **Proof:** Exclude `.env` from the switch's rsync once an install runs; applying `0.0.0-b` leaves `.env` and the containers on `0.0.0-a` and the test goes red.
- **Fault:** faults/OPS-004.patch
- **Test:** ops/ansible/test/throwaway.sh

After `0.0.0-a` runs, `0.0.0-b` is applied and then `0.0.0-a` again. Each time the running version
is read from `.env` and from the apiserver container's image. The `.env`, keys and TLS files are
compared across the three applies. Then two applies that must be refused without touching the live
install: a copy of the `0.0.0-a` archive whose `.env.example` adds a name, and the state folder's
keys moved away from under an existing install.

**Pass.** `0.0.0-b` runs after its apply and `0.0.0-a` after the next; `deploys.log` has `0.0.0-a -> 0.0.0-b` and `0.0.0-b -> 0.0.0-a`; `.env` is byte-identical to the first apply's and the keys and TLS files to every apply's; the added name fails the play naming it, and the empty `/var/lib/fonoster/keys` fails it naming that folder, each with `/opt/fonoster` byte-identical. **Fail.** Any of those differs.

### OPS-005 A second apply changes nothing

- **Spec:** deployment / A playbook puts a host on a Fonoster version / A second apply changes nothing
- **Priority:** P1
- **Proof:** Mark the switch's `docker compose up` as always changed; the second apply reports a change and the test goes red.
- **Fault:** faults/OPS-005.patch
- **Test:** ops/ansible/test/throwaway.sh

The same version and inventory applied again on the converged runner, then once more with only the
Routr log level changed in its override, which changes `config/routr-one.yaml` and nothing else.
The container of every service is compared before and after.

**Pass.** The second apply's recap says `changed=0`; with the override changed, only the `routr` container is new. **Fail.** The recap counts a change, or another service is recreated (or routr is not).

### OPS-006 A failed apply restores the last backup

- **Spec:** deployment / Production deploys run the playbook / A failed apply restores the last backup
- **Priority:** P1
- **Proof:** Drop the `tar -xzf` from `playbooks/rollback.yml`'s restore; the live folder is left empty, the services do not come back and the test goes red.
- **Fault:** faults/OPS-006.patch
- **Test:** ops/ansible/test/throwaway.sh

With `0.0.0-a` running, `rollback.yml` is run first with `fonoster_rollback_since` set to the
current time, as after an apply that failed before its switch. Then `0.0.0-b` is applied with
`fonoster_public_url` pointing at a closed port, so it switches and its smoke test fails, and
`rollback.yml` runs with `fonoster_rollback_since` set to when that apply began, as `deploy.yaml`
runs it.

**Pass.** The first rollback exits 0 with `/opt/fonoster` byte-identical; the `0.0.0-b` apply fails; the second rollback exits 0 (its smoke test passes); `.env` and the apiserver container are on `0.0.0-a`; the last line of `deploys.log` ends with `0.0.0-b -> 0.0.0-a rolled back`. **Fail.** Any of those differs.
