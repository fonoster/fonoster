# Spec Delta

## MODIFIED Requirements

### Requirement: Sign-in options follow the advertised methods

The sign-in screens SHALL offer exactly the methods in `auth.methods`, SHALL offer sign-up only when
`auth.signup` is `open`, and SHALL NOT reveal whether an email has an account. Every edition SHALL
enable `password`; Cloud SHALL also enable `email_code`, and `github` when a GitHub app is
configured.

#### Scenario: Community defaults

- WHEN capabilities return methods `[password]` and signup `invite`
- THEN sign-in shows email and password with "Forgot password", and shows no GitHub button, no code
  sign-in and no sign-up link

#### Scenario: Cloud

- WHEN capabilities return methods `[password, email_code, github]`
- THEN sign-in shows "Continue with GitHub", then the email and password form, and a link "Email me
  a sign-in code instead" that swaps the form for one that sends a code

#### Scenario: Cloud without GitHub

- WHEN capabilities return methods `[password, email_code]`
- THEN sign-in shows the email and password form and the code link, and no GitHub button

#### Scenario: Open sign-up

- WHEN `auth.signup` is `open` and `password` is enabled
- THEN sign-in links to a sign-up screen that creates the account and signs the user in

#### Scenario: Wrong credentials

- WHEN a user enters a wrong password, or asks for a code for an email without an account and then enters a code
- THEN each screen reports the failure in its own words, and no screen or message reveals whether the email has an account

#### Scenario: GitHub state mismatch

- WHEN the GitHub callback's `state` doesn't match the nonce stored before the redirect
- THEN the dashboard shows an error and doesn't exchange the code
