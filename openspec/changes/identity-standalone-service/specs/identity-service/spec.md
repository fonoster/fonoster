## ADDED Requirements

### Requirement: Standalone Identity gRPC service

Fonoster SHALL provide a runnable service that serves the Identity gRPC surface
(`fonoster.identity.v1beta2`) on its own, built from `buildIdentityService`, without starting any
telephony subsystem. It SHALL apply the access-token authentication interceptor and the Identity
public-method allow-list, and SHALL expose a gRPC health service.

#### Scenario: Service serves Identity on the configured port

- **WHEN** the service is started with valid configuration
- **THEN** it binds the configured address and serves the `fonoster.identity.v1beta2.Identity` methods
- **AND** its gRPC health check reports serving

#### Scenario: Public methods need no token, others do

- **WHEN** an allow-listed method (e.g. CreateUser, ExchangeCredentials, GetPublicKey) is called without a token
- **THEN** the call is processed
- **AND** a non-allow-listed method called without a valid access token is rejected as unauthenticated

#### Scenario: No telephony subsystems are started

- **WHEN** the standalone service runs
- **THEN** it does not require or start NATS, InfluxDB, or Asterisk/ARI

#### Scenario: Library import stays server-free

- **WHEN** a consumer imports the `@fonoster/identity` main entry as a library (e.g. `buildIdentityService`)
- **THEN** no gRPC server is started and the server-only runtime is not required
- **AND** the runnable service is obtained only via the package's server subpath export or `serve` bin

### Requirement: Externalized configuration with fail-fast validation

The service SHALL read its `IdentityConfig` (database URL, encryption key, RS256 key pair,
issuer, audience, token expirations, OAuth2 settings, contact-verification and 2FA flags, SMTP,
bind port) from the environment or a configuration file, and SHALL validate it at startup.

#### Scenario: Missing required configuration fails fast

- **WHEN** the service starts without a required configuration value (e.g. database URL or signing keys)
- **THEN** it exits with a non-zero status and a clear error identifying the missing value

### Requirement: Database provisioning entrypoint

The service SHALL ship the Identity Prisma schema and migrations and provide an entrypoint that
provisions or migrates the Identity database, so that consumers do not vendor the schema.

#### Scenario: Fresh database is provisioned

- **WHEN** the provisioning entrypoint is run against an empty database
- **THEN** the Identity schema is applied
- **AND** the service can then serve sign-up, login, and workspace operations

### Requirement: Container image and accept-invite bridge

The service SHALL be published as a container image and SHALL serve the accept-invite HTTP bridge
alongside the gRPC service.

#### Scenario: Published image runs the service

- **WHEN** the published image is run with valid configuration
- **THEN** the Identity gRPC service is served
- **AND** the accept-invite HTTP endpoint transitions a pending membership to active when invoked
