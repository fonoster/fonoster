# Open questions for the owner (docs revamp, 2026-10-19)

Collected from each page's checkpoint. Answer them in your review pass.

## Get started
- migrate-from-0-27: `audioFilters` is documented as removed with no replacement (the schema error says "part of the app's configuration", but the app model has no such field). Is that right?
- migrate-from-0-27: Were Cloud users' saved agents and numbers converted automatically? This was inferred from the cutover notes.
- quickstart: Does Cloud run the template's model and voice without workspace vendor keys?
- quickstart: Does a browser call appear under Calls with its transcript?
- quickstart: Are `@fonoster/ctl` and `@fonoster/sdk` 0.30 published on npm?
- how-fonoster-works: Can a workspace change its region after it's created?
- Code: the `@example` in `mods/sdk/src/Applications.ts` calls `SDK.Client(...)` without `new`.
- Stale: `hacking/run-from-source.mdx` says the dashboard section is "Agents"; it's now "Autopilot".
