# provider-registry

## ADDED Requirements

### Requirement: The catalog lists providers, models and voices by catalog id

The registry SHALL hold providers, models and voices, each identified by a stable catalog id of
the form `<provider>/<id>`, with a lifecycle state of `active`, `deprecated` or `retired`. Catalog
ids SHALL never be reused.

#### Scenario: A model is registered

- **WHEN** an operator runs `fonoster-registry add-model deepgram/nova-3 --type stt --features interim-results,word-timings --languages en,es,pt`
- **THEN** `fonoster-registry show deepgram/nova-3` prints type `stt`, state `active`, features `interim-results, word-timings` and languages `en, es, pt`
- **AND** one audit entry records the operator, time, command and the new entry

#### Scenario: A voice is registered against the models it works with

- **WHEN** an operator runs `fonoster-registry add-voice elevenlabs/rachel --models elevenlabs/flash-v2.5,elevenlabs/multilingual-v2 --language en --gender female`
- **THEN** `show elevenlabs/rachel` lists both models
- **AND** the dashboard offers `elevenlabs/rachel` only when one of those models is selected

#### Scenario: A catalog id cannot be reused

- **WHEN** an operator runs `add-model deepgram/nova-2 ...` and `deepgram/nova-2` already exists in any state
- **THEN** the command exits non-zero with `catalog id deepgram/nova-2 already exists (state: retired)`
- **AND** nothing is written

### Requirement: Providers are backed by built-in adapters only

A provider entry SHALL name an adapter that ships in the running version. The registry SHALL NOT
load or call code that is not part of the release.

#### Scenario: Adding a provider with a known adapter

- **WHEN** an operator runs `fonoster-registry add-provider deepgram --adapter deepgram --capabilities stt,tts --credential-ref deepgram-default`
- **THEN** the provider is stored as `active` with `credentialRef: deepgram-default`

#### Scenario: Adding a provider with an unknown adapter

- **WHEN** an operator runs `add-provider acme --adapter acme --capabilities tts --credential-ref acme-default` and no `acme` adapter exists in this version
- **THEN** the command exits non-zero with `unknown adapter: acme`
- **AND** nothing is written

### Requirement: The registry is managed only by the operator utility

The registry SHALL be changed only through `fonoster-registry`, a binary in `@fonoster/common`
run as `npx -p @fonoster/common fonoster-registry <command>` against a database. Customer-facing
tools, including `@fonoster/ctl` and the public API, MUST NOT write to it.

#### Scenario: The utility exposes the full command set

- **WHEN** an operator runs `npx -p @fonoster/common fonoster-registry --help`
- **THEN** it lists `add-provider`, `add-model`, `add-voice`, `deprecate-provider`, `deprecate-model`, `deprecate-voice`, `retire-provider`, `retire-model`, `retire-voice`, `usage`, `list`, `show`, `history`, `export`, `plan` and `apply`

#### Scenario: The public API cannot change the catalog

- **WHEN** a workspace admin calls any public API method or ctl command
- **THEN** no registry row is created, changed or deleted

#### Scenario: Every write is audited

- **WHEN** any registry command changes data
- **THEN** an audit entry stores the operator identity, time, command line, and the entry before and after
- **AND** `fonoster-registry history <id>` prints those entries newest first

### Requirement: The catalog never holds a secret

The registry schema MUST NOT contain any field that can store a credential. A provider SHALL
refer to its platform credential only by name (`credentialRef`). Platform keys SHALL stay in the
operator's config or secret store.

#### Scenario: Export is safe to share

- **WHEN** an operator runs `fonoster-registry export > catalog.yaml`
- **THEN** the file contains catalog ids, states, features, relations and `credentialRef` names
- **AND** it contains no key, token or password

#### Scenario: A key cannot be smuggled into the catalog

- **WHEN** an operator runs `add-provider deepgram --adapter deepgram --capabilities stt --api-key abc123`
- **THEN** the command exits non-zero with `unknown option: --api-key`
- **AND** nothing is written

#### Scenario: The utility's database role is limited

- **WHEN** the utility's database role attempts to write any table other than the registry and audit tables
- **THEN** the database refuses the write

### Requirement: Credentials are resolved only by the gateway at session start

The VoiceSessionGateway SHALL resolve the credential for each provider a session uses once, at
session start: the workspace's own key for that provider if one is stored, otherwise the platform
key named by `credentialRef`. Workspace keys SHALL be stored as encrypted workspace Secrets and
MUST be write-only.

#### Scenario: A workspace brings its own key

- **WHEN** workspace W stored its own Deepgram key and a session in W uses `deepgram/nova-3`
- **THEN** the gateway calls Deepgram with W's key, not the platform key

#### Scenario: No workspace key falls back to the platform key

- **WHEN** workspace W stored no Deepgram key and the platform credential `deepgram-default` is configured
- **THEN** the gateway calls Deepgram with the platform key

#### Scenario: A workspace key is never returned

- **WHEN** any API method reads workspace W's Secrets
- **THEN** the response contains the Secret's name and metadata but never its value
- **AND** neither logs nor the call record contain the value

### Requirement: Only usable providers are offered

`GetCapabilities` and the dashboard SHALL list a provider, model or voice only when it is `active`
or `deprecated`, its adapter exists in the running version, and a credential is available to the
asking workspace. Retired items MUST NOT be offered.

#### Scenario: A provider without a credential is hidden

- **WHEN** provider `elevenlabs` is active, no platform credential `elevenlabs-default` is configured, and workspace W has no ElevenLabs key
- **THEN** `GetCapabilities` for W does not list `elevenlabs` or its voices

#### Scenario: Bringing a key makes the provider appear

- **WHEN** workspace W then stores its own ElevenLabs key
- **THEN** `GetCapabilities` for W lists `elevenlabs` and its active voices

### Requirement: Models declare features and apps' requirements are derived

Each model SHALL declare features from a fixed vocabulary per type, each marked hard or soft. Each
voice SHALL list the models it works with. The platform SHALL derive an app's requirements from
its config, and users MUST NOT be asked to declare them.

#### Scenario: Tools require tool calling

- **WHEN** an assistant config defines at least one tool
- **THEN** its derived requirements include the hard feature `tool-calling`
- **AND** the dashboard greys out LLMs without `tool-calling`, labelled `doesn't support tools`

#### Scenario: Only voices valid for the model are offered

- **WHEN** a user selects `deepgram/aura-2` as the TTS model
- **THEN** the voice picker lists only voices whose model list includes `deepgram/aura-2`

### Requirement: Deprecation is manual and warns every user

`deprecate-<kind> <id> --replacement <id> --retire-on <date>` SHALL mark the item deprecated only
when the replacement is an active item of the same kind, and SHALL print an impact report. While
deprecated, every workspace that uses the item SHALL see a dashboard warning naming where it is
used, and the gateway SHALL emit `provider.deprecated_used` for every session that resolves it.
Nothing SHALL happen automatically when the retire date arrives.

#### Scenario: Deprecating a model prints the impact report

- **WHEN** an operator runs `fonoster-registry deprecate-model elevenlabs/turbo-v2 --replacement elevenlabs/flash-v2.5 --retire-on 2027-01-31`
- **AND** voices `rachel` (41 apps) and `adam` (9 apps) work on both models, `nova-legacy` (3 apps) works only on `turbo-v2`, and 2 apps set the `style` setting the replacement does not accept
- **THEN** the report shows `✓ voice rachel works on replacement (41 apps)`, `✓ voice adam works on replacement (9 apps)`, `✗ voice nova-legacy only exists on turbo-v2 (3 apps) → needs --voice-map nova-legacy=<voice>` and `~ setting "style" not supported, will be dropped (soft) (2 apps)`
- **AND** `elevenlabs/turbo-v2` is `deprecated` with replacement `elevenlabs/flash-v2.5` and retire date `2027-01-31`

#### Scenario: The replacement must be active and of the same kind

- **WHEN** an operator runs `deprecate-model deepgram/nova-2 --replacement elevenlabs/rachel --retire-on 2027-01-31`
- **THEN** the command exits non-zero with `replacement must be an active model`

#### Scenario: Warnings appear where the item is used

- **WHEN** `deepgram/nova-2` is deprecated and workspace W's app "Support line" uses it
- **THEN** W's dashboard shows a warning naming `deepgram/nova-2`, its replacement, its retire date and the app "Support line"

#### Scenario: Runtime use is caught

- **WHEN** an app in workspace W sends `listen.update` naming `deepgram/nova-2` during a session, and no saved config of W references it
- **THEN** the gateway emits `provider.deprecated_used` with the session, the id and the replacement
- **AND** W's dashboard shows the warning

#### Scenario: Switching clears the warning

- **WHEN** workspace W changes every config away from `deepgram/nova-2` and no later session of W uses it
- **THEN** W's warning disappears

#### Scenario: The date passes without action

- **WHEN** the retire date of a deprecated model passes and no operator runs `retire-model`
- **THEN** the model stays `deprecated` and no config changes

### Requirement: Retirement is manual, rewrites compatible configs and is audited

`retire-<kind> <id>` SHALL print the impact report, ask for confirmation unless `--yes` is given,
then in one transaction rewrite every config whose usage is compatible with the replacement,
record an audit entry per rewritten config, mark the item `retired`, and notify every affected
workspace.

#### Scenario: Compatible configs move to the replacement

- **WHEN** an operator runs `fonoster-registry retire-model elevenlabs/turbo-v2 --voice-map nova-legacy=bella --yes`
- **THEN** every config using `elevenlabs/turbo-v2` with voices `rachel`, `adam` or `nova-legacy` now references `elevenlabs/flash-v2.5` with voices `rachel`, `adam` or `bella`
- **AND** the `style` setting is removed from the 2 apps that set it
- **AND** each rewritten config has an audit entry and each affected workspace has a notice

#### Scenario: A retired id sent at runtime resolves to its replacement

- **WHEN** an app sends `speak` with `voice: elevenlabs/rachel` and model `elevenlabs/turbo-v2` after `turbo-v2` was retired
- **THEN** the gateway uses `elevenlabs/flash-v2.5`
- **AND** emits `provider.retired_used`, and the call continues

### Requirement: Unmappable usages do not block retirement

`retire-*` SHALL proceed when some usages have no compatible replacement. Those configs SHALL keep
the old id and stay flagged. Custom voices owned by a workspace SHALL be reported to that workspace
by name.

#### Scenario: Retiring without a voice map

- **WHEN** an operator runs `retire-model elevenlabs/turbo-v2 --yes` with no `--voice-map` for `nova-legacy`
- **THEN** compatible configs are rewritten and the 3 apps using `nova-legacy` keep `elevenlabs/turbo-v2`
- **AND** their dashboards keep a warning stating that the model is retired and no replacement fits

#### Scenario: A workspace's cloned voice

- **WHEN** workspace W uses its own cloned voice on `elevenlabs/turbo-v2` and the model is deprecated
- **THEN** W's warning names the cloned voice and asks W to pick a new model or voice

### Requirement: Provider failure is reported, never switched

When a provider fails or times out during a session, the gateway SHALL send the app an `error`
message with `code: provider_unavailable` and `relatesTo` the command id, and SHALL record it in
the call record. The gateway MUST NOT switch to another provider.

#### Scenario: TTS vendor outage mid-call

- **WHEN** an app sends `speak` with `id: s1` and the TTS vendor returns HTTP 503
- **THEN** the app receives `{"type":"error","code":"provider_unavailable","relatesTo":"s1","fatal":false}`
- **AND** the session stays open and no other provider is called

### Requirement: Several registries are kept identical with plan and apply

`export` SHALL write the whole catalog as a file without secrets. `plan -f <file>` SHALL print the
changes needed for the target database to match the file, and `apply -f <file>` SHALL make them,
with one audit entry per change.

#### Scenario: Syncing a private cell

- **WHEN** an operator runs `export` against region A and `plan -f catalog.yaml` against cell B, where B lacks `deepgram/nova-3` and still has `deepgram/nova-2` as `active`
- **THEN** the plan lists `+ add model deepgram/nova-3` and `~ deprecate model deepgram/nova-2 → deepgram/nova-3`
- **AND** `apply -f catalog.yaml` makes B's `export` byte-identical to A's

#### Scenario: Apply is idempotent

- **WHEN** `apply -f catalog.yaml` runs twice against the same database
- **THEN** the second run reports `no changes` and writes no audit entry

### Requirement: Usage is reported per id

`usage <id>` SHALL list every workspace and config that references the id, and the number of
sessions per workspace that resolved it in the last 30 days.

#### Scenario: Checking exposure before retiring

- **WHEN** an operator runs `fonoster-registry usage deepgram/nova-2`
- **THEN** it prints each workspace, the configs (app or assistant names) that reference the id, and each workspace's session count in the last 30 days
