## MODIFIED Requirements

### Requirement: SIP resources reference only their own workspace

Creating or updating an agent, trunk, number or domain SHALL check that every resource it references
(`domainRef`, `credentialsRef`, `accessControlListRef`, `inboundCredentialsRef`,
`outboundCredentialsRef`, `trunkRef`, each egress policy's `numberRef`) belongs to the caller's
workspace. A reference to another workspace's resource SHALL fail with `INVALID_ARGUMENT`, reported
like a missing one. Reading, updating or deleting a number or ACL of another workspace SHALL fail
with `NOT_FOUND`, as for every other resource (management-api). Routr has no notion of workspaces;
the apiserver enforces this.

#### Scenario: Trunk with another workspace's credentials
- **WHEN** workspace A creates a trunk whose `outboundCredentialsRef` names workspace B's credentials
- **THEN** the request fails with `INVALID_ARGUMENT` and Routr is not asked to create it

#### Scenario: Agent in another workspace's domain
- **WHEN** workspace A creates or updates an agent with `domainRef` naming workspace B's domain
- **THEN** the request fails with `INVALID_ARGUMENT`

