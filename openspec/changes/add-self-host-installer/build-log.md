# Build log: add-self-host-installer

Decisions taken while building, for the owner to review. Each can be reversed.

## 2026-10-15

### IC-B1. The catalog key and how it is applied (task 1.2)

- `fonoster.yaml` takes `catalog: { file: /opt/fonoster/catalog.yaml }` (optional; absent = nothing
  applied, the catalog is managed only with `fonoster-registry`). Documented in
  `config/fonoster.example.yaml`.
- On every start, before serving, the apiserver runs the registry's own `apply` diff
  (`Registry.apply` over `PrismaRegistryStore`, the code behind `fonoster-registry apply --store
  database`) as actor `apiserver`. Listed entries are added or updated; entries not in the file
  are kept. Equal entries write nothing, so a restart changes no rows (tested with a full row +
  timestamp + audit-count snapshot).
- It does not go through `runWithDatabase`: that path also runs due webhook deliveries once,
  which the apiserver's own fan-out already does.
- An entry that is in the file and that an operator changed in the database (e.g. deprecated by
  hand) is set back to the file's version on the next start. The file wins for what it lists;
  operators change listed entries by changing the file.

### IC-B2. A configured catalog that can't be applied stops the apiserver

- Unreadable file or invalid YAML / entry: the apiserver logs `catalog: <reason>` (naming
  `catalog.file`) and exits 1, like any other config error, instead of serving with no catalog.

### IC-B3. JSON Schema export: a vendored converter, no new dependency (task 4.1)

- `zod-to-json-schema` is only in node_modules transitively, and `zod/v4`'s `toJSONSchema` does
  not take the v3 schemas the services use. So `@fonoster/common` gets a small converter,
  `toJsonSchema(schema)` (`mods/common/src/config/toJsonSchema.ts`), covering the Zod types the
  config schemas use; any other type throws (with its path) instead of exporting as "anything".
- It runs `strictDeep` first, so every object has `additionalProperties: false` except
  `.passthrough()` blocks and records. Keys with a default are not `required`. Refinements
  (`superRefine`, `transform`) are not exported; services still validate fully on boot.
- `format: uri|email` is emitted as documentation; validators may ignore it (the test does).
- Strings are validated as written: `check` must resolve `secret://` refs and `${VAR}` first,
  or a pattern such as `encryption.key` fails on a reference.
- Autopilot parses its schema without `strictDeep` today (inner objects such as `knowledge.s3`
  strip unknown keys); the exported schema is strict everywhere, so `check` is stricter there.
- **Entry point for the bundle build (4.2):**
  `npx tsx mods/common/scripts/export-config-schemas.ts <outDir>` writes
  `<outDir>/{apiserver,identity,gateway,autopilot}.json` (or `exportConfigSchemas(outDir)` from
  that module). `$id` is `https://fonoster.com/schemas/config/<svc>.json`.

### IC-B4. The gateway gets a Zod schema of gateway.yaml

- The gateway validates with `validateConfig` and a TypeScript type; it had no Zod schema.
  `mods/gateway/src/configSchema.ts` (`gatewayConfigSchema`) describes the file's shape. A
  compile-time check fails the gateway build if it drifts from `GatewayConfig` (keys and types;
  optionality is ignored because the package is not built with strictNullChecks).
- The gateway does not use it at load time yet (it still ignores unknown keys at runtime);
  `check` catches typos before start.

### IC-B5. Stack: catalog applied by the apiserver (task 1.3)

- `seed_catalog` and its call in `cmd_up` are gone. The stack renders `catalog: { file:
  /opt/fonoster/catalog.yaml }` into `fonoster.yaml` and `ops/rebuild/compose.yaml` mounts
  `ops/rebuild/config/catalog-seed.yaml` there (one added volume line).
