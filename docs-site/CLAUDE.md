# Fonoster docs: editorial policy

Guidance for everything under `docs-site/` (the Mintlify docs). Pages are written one at a time with
`/ps:docs`. This file says who the docs are for and what's allowed. The planned menu is in
`MENU.md`. Coding conventions are in the repo-root files.

## Versions

- **v0.30** (default): the rebuild. Pages live at the root (`introduction.mdx`, `self-hosting/…`,
  `private-regions/…`).
- **Legacy (≤0.27)**: the old docs, frozen under `legacy/`. Don't edit them except to fix a broken
  link. Old URLs redirect to `legacy/…` in `docs.json` unless a v0.30 page takes the same path.

## Layout and readers

Owner decision (2026-10-19): one **Docs** tab holds every guide, with a section per reader, plus
**SDK**, **CLI** and **Changelog** tabs for one-click access to the references (like Vapi).

- **Docs › Get started … Reference**: developers building on Fonoster (Autopilot agents, streams,
  telephony, webhooks, call records). This is the main reader. Write for them first.
- **Docs › Self-hosting**: people who install and run Fonoster on their own machines, on Docker
  Compose or Kubernetes.
- **Docs › Private regions**: operators who run a private region that their workspaces use, joined
  to a control plane.
- **Docs › Hacking Fonoster**: contributors who run Fonoster from source. The dev container is the
  only supported way.
- **SDK** tab: `@fonoster/sdk`, the Voice SDK (Node and Python), the session protocol, Twilio
  compatibility and the API note. **CLI** tab: the developer `fonoster` CLI.

A page belongs to one section. When behavior differs between Fonoster Cloud and self-hosted, note it on
the page (a short note, or `<Tabs>`). Don't make a separate page for it.

## Tooling is documented

Self-hosters and region operators work through tools, so each of those sections has a **Tooling** group
that documents them from source:

- Self-hosting: the stack installer (`ops/rebuild/stack`), the `fonoster` CLI's operator commands
  (`mods/ctl`), and the Helm chart values (`ops/rebuild/helm`).
- Private regions: the `fonoster-region` CLI (`mods/region-agent`) and the cell bundle
  (`ops/rebuild/cell`).

Commands, flags and config keys come from the code, never from memory.

## Vocabulary (owner decisions, 2026-10-16)

One name per concept on every surface (website, dashboard, docs, SDK, CLI, API). Researched against
Vapi, Retell, Bland, LiveKit and Pipecat.

| Concept | Name | Notes |
| --- | --- | --- |
| Hosted AI product | **Agents** (powered by **Autopilot**) | Dashboard section "Agents". Autopilot is the engine, never a thing you create |
| One AI item | **agent** | "New agent". API type `AUTOPILOT`; CLI `--agent`. Never "assistant" |
| Your own WebSocket server | **Apps** / an **app** | Dashboard section "Apps" (streams icon), mirrors the Agents layout. API type `STREAM`. "Stream" names only the session connection |
| Wire protocol of an app | **protocol**: `fonoster` / `twilio` | Was `flavor: native/twilio`. UI: "Fonoster" / "Twilio-compatible" |
| Umbrella resource | **Application** | API/SDK/CLI only (`applications:*`); never shown in the dashboard |
| SIP endpoint (softphone) | **SIP agent** | API/SDK/CLI keep `Agents` (`sipnet:agents:*`); always written "SIP agent" in UI and docs |
| A person on a transfer | **operator** | Never "agent" |
| Region | **region** | "cell" is internal only |
| Number, Workspace, Trunk, Domain | unchanged | |

## Out of scope: never document

- Internals the reader never touches: database tables and Prisma, NATS subjects, internal service
  names and classes, how the swarm was built.
- Rebuild process notes (`docs/operators/rebuild.md`, `routr-live-test.md`,
  `conformance.md`) unless a reader needs them for a task.

## Disclosure rule

Document what the reader touches, configures or observes. Describe the behavior, not the mechanism.
Organize by the reader's task, not by our components (recording lives under Telephony, not under the
service that writes it). Never promise what isn't built: `MENU.md` lists those gaps.

## Example values

Use realistic values in the real formats the API returns (refs, numbers, keys), never `abc123` or
`your-id-here`. Take the format from the code or a live response, then change the digits.

## Assets

Diagrams and screenshots are drawn in Pencil, in their own file `designs/docs.pen`. Never put them in
`website.pen` or `dashboard.pen`. Exports go to `docs-site/images/<slug>/`, logged in
`images/ASSETS.md`. Legacy images stay in `images/legacy/`.

## Voice

Fonoster house voice: second person, present-tense imperative, active, short sentences, task first.
Plain words. No internal jargon. Put one sentence before every code block saying what it does.

## Look

`docs.json` and `style.css` mirror fonoster.com (`site/assets/css/v1.css`): Poppins, Roboto Mono for
code, accent `#39E19E` (`#008751` for text in light mode), dark `#181818` by default. When the
website's tokens change, update both files.

## Running it

`npm run start:docs` serves the site at http://localhost:3333. `npm run check:docs` checks links.
