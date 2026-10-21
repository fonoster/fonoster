# Spec Delta

## ADDED Requirements

### Requirement: Agents are created from a template and edited as one form

New agent SHALL create an agent from a template, a name and a language, and open it. The agent's tabs
SHALL save together with one Save; a tab holding an invalid field SHALL be marked and nothing SHALL be
sent. The name SHALL be editable in place, and deleting SHALL need `DELETE` typed.

#### Scenario: Create from a template

- **WHEN** the user creates Front desk from the Receptionist template
- **THEN** the agent is created and its Configure tab opens

#### Scenario: Save the prompt and a tool

- **WHEN** the user changes the system prompt, adds a tool on the Tools tab and saves
- **THEN** one update carries the new prompt and the tool, and the page no longer shows unsaved changes

#### Scenario: An invalid tool marks its tab

- **WHEN** a tool's name has a space and the user saves
- **THEN** the page says to fix the highlighted fields in Tools, and nothing is sent

#### Scenario: Rename in place

- **WHEN** the user renames the agent and presses Enter
- **THEN** the new name is saved and shown as the title

#### Scenario: Delete an agent

- **WHEN** the user deletes the agent from Advanced and types `DELETE`
- **THEN** the agent is deleted and the Agents list opens

### Requirement: Apps connect a voice server

New app SHALL create an app from a name, a `ws://` or `wss://` URL and a protocol (Fonoster or Twilio),
open it, and show its signing secret once. Twilio apps SHALL show no speech settings. The recording
policy SHALL be one of Workspace default, Off, On, or On after consent prompt. Rotating the secret SHALL
take one click; deleting SHALL need `DELETE` typed.

#### Scenario: A URL that isn't a WebSocket

- **WHEN** the user enters `https://voice.acme.example/session`
- **THEN** the URL field says it must start with ws:// or wss://, and nothing is sent

#### Scenario: The signing secret is shown once

- **WHEN** an app is created
- **THEN** its page opens with the signing secret and the warning that this is the only time, and the secret is not shown after

#### Scenario: Twilio apps have no speech settings

- **WHEN** the user sets an app's protocol to Twilio
- **THEN** the Speech panel is not shown

#### Scenario: The recording policy is saved

- **WHEN** the user sets Recording to On after consent prompt and saves
- **THEN** the app is saved with `recording: "consent"`

#### Scenario: Rotate an app's signing secret

- **WHEN** the user rotates the signing secret
- **THEN** one confirmation replaces it, with no typing, and the new secret is shown once

#### Scenario: Delete an app

- **WHEN** the user deletes the app and types `DELETE`
- **THEN** the app is deleted and the Apps list opens
