# Build log: unify-vocabulary

Decisions taken while building, for the owner to review. Each can be reversed.

## 2026-10-16

### VO-B1. One migration, no compatibility layer

- `20261016100000_unify_vocabulary` renames the enum value (`ALTER TYPE ... RENAME VALUE`), renames
  the column and rewrites `native` to `fonoster`. No views, no dual-read.
- Clear errors instead of compatibility: the apiserver answers `type EXTERNAL was renamed to
  STREAM`, `protocol native was renamed to fonoster` and `flavor was renamed to protocol`; the
  gateway config check and the CLI do the same.
- One exception: the region agent maps a snapshot row that still says `EXTERNAL`/`flavor` (a
  control plane upgraded after its regions). Four lines; remove once every region runs 0.30.

### VO-B2. The agent file keeps its format

- `--assistant` is now `--agent` (still `-a`), but the file itself is unchanged: an app file with an
  inline `assistant` key still makes an Autopilot agent, and the internal schema keeps its name
  (`sessionAssistantSchema`). Renaming the key would break every agent file for no reader benefit.

### VO-B3. Spec and contract ids keep "flavor"

- The capability `twilio-media-streams-flavor` (spec folder, conformance `contract:` value and
  scenario folder) keeps its id. It is an internal spec id, never shown to users; renaming it would
  move a spec across unarchived changes. Requirement names and text inside it now say "protocol".

### VO-B4. Region utility name

- `fonoster-region` is the command; `fonoster-regions` stays as a deprecated alias bin (the image,
  entrypoint and scripts use the new name; the alias prints a one-line notice). The NATS user name
  `fonoster-regions` in the hub JWT is internal and unchanged.

### VO-B5. Gateway code names

- `src/flavors/` became `src/protocols/` (`native.ts` → `fonoster.ts`, `NativeCodec` →
  `FonosterCodec`, `FlavorCodec` → `ProtocolCodec`) so code and config read the same.

### VO-B6. Session protocol error code

- `not_supported_by_flavor` became `not_supported_by_protocol` (nothing emits it yet).

### VO-B7. Leftovers kept on purpose

- `EXTERNAL`, `flavor` and `native` remain only in the code that rejects or maps them (apiserver,
  CLI, gateway config check, region agent) and in `docs/operators/cutover.md` (legacy rows).
- `twilio-media-streams-flavor` (VO-B3). "session app" survives in a few internal code comments
  (module names), not in any user-facing string.
- The repository's example assistant file still says "live agent" in its transfer message (a
  fixture a test reads); the Autopilot tool descriptions now say "operator".
- `docs/operators/rebuild.md` keeps "cell": it is a rebuild process note, not reader docs.
  Paths and env names (`ops/rebuild/cell`, `cell.env`, NATS subject `cell.workspacekeys.get`) are
  internal.

### VO-B8. Dashboard folder move landed in the apiserver commit

- The `src/sip-users` → `src/sip-agents` rename was staged when the apiserver commit ran, so
  `ac2dccd18` carries it (renames only).
