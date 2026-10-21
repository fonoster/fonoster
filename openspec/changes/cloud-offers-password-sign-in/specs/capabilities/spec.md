# Spec Delta

## MODIFIED Requirements

### Requirement: The apiserver advertises the deployment's capabilities

The apiserver SHALL expose a public `Capabilities/GetCapabilities` RPC, built from `fonoster.yaml`,
that returns the enabled sign-in methods, the sign-up policy, the GitHub client id and authorize URL
when GitHub is enabled, billing, cost display, domain and app URL, and it SHALL NOT return any
secret.

#### Scenario: Community defaults

- WHEN `features.auth` is not configured
- THEN `GetCapabilities` returns methods `[password]` and signup `invite`, with no GitHub block

#### Scenario: Cloud configuration

- WHEN `features.auth.methods` is `[password, email_code, github]` and `identity.oauth2.github` is set
- THEN `GetCapabilities` returns the three methods and the GitHub client id, and no client secret

#### Scenario: No credentials needed

- WHEN a client without a token calls `GetCapabilities`
- THEN the call succeeds
