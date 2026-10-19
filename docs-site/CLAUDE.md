# Fonoster docs: editorial policy

Guidance for everything under `docs-site/` (the Mintlify docs). Pages are written one at a time with
`/ps:docs`. This file says who the docs are for and what's allowed. The planned menu is in
`MENU.md`. Coding conventions are in the repo-root files.

## Versions

- **v0.30** (default): the rebuild. Pages live at the root (`introduction.mdx`, `self-hosting/…`,
  `private-regions/…`).
- **Legacy (≤0.27)**: the old docs, frozen under `legacy/`. Don't edit them except to fix a broken
  link. Old URLs redirect to `legacy/…` in `docs.json` unless a v0.30 page takes the same path.

## Readers: three tabs, one reader each

- **Docs**: developers building on Fonoster (Autopilot agents, voice apps, Twilio/Pipecat apps,
  webhooks, the SDK, API and CLI). This is the main reader. Write for them first.
- **Self-hosting**: people who install and run Fonoster on their own machines, on Docker Compose or
  Kubernetes.
- **Private regions**: operators who run a private region (a cell) that their workspaces use, joined
  to a control plane.
- **Hacking Fonoster**: contributors who run Fonoster from source and work on its components. The dev
  container is the only supported way.

A page belongs to one tab. When behavior differs between Fonoster Cloud and self-hosted, note it on
the page (a short note, or `<Tabs>`). Don't make a separate page for it.

## Tooling is documented

Self-hosters and region operators work through tools, so each of those tabs has a **Tooling** group
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
| Hosted AI product | **Autopilot** | Dashboard section "Autopilot" |
| One AI item | **agent** ("Autopilot agent") | "New agent". API type `AUTOPILOT`; CLI `--agent` (was `--assistant`) |
| Your own WebSocket server | **Streams** / a **stream** | Dashboard section "Streams", mirrors Autopilot's layout. API type `STREAM` (was `EXTERNAL`) |
| Wire protocol of a stream | **protocol**: `fonoster` / `twilio` | Was `flavor: native/twilio`. UI: "Fonoster" / "Twilio-compatible" |
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
