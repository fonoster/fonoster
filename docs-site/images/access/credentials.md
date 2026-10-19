# Asset build doc — credentials

**Artifact:** `credentials-dark.png`, `credentials-light.png` (this folder)
**Used on:** `workspace/access`
**Type:** diagram · component (boundary + clients)
**Preset:** 16:9 1600 × 900 (exported at 1×)
**Diagram Kit version:** v1 ("Docs / Diagram Kit", fdbKR)
**Pencil node id:** `dZS5U` (dark), `PlZ9P` (light) (file: `designs/docs.pen`)

> Regenerate from this doc — do not edit the image. Change the spec or the kit, then re-export.



## One message

People are members; code signs in with the workspace ID plus one API key.

## Sources (ground truth)

- `docs-site/workspace/access.mdx`
- `.claude/docs/ASSET-QUEUE.md`: the queued spec.

## Node / edge spec

```
Group WORKSPACE · ACME SUPPORT (x48 y150 870×650) + Chip "WO7d2kq9… (workspace access key ID)"
  Members box: Owner, Admin, Member avatars; "sign in to the dashboard with email"
  API keys box: "APk3n8… + secret", "APq7d0… + secret" (accent); "role: Workspace admin"
Right (x1240): Node SDK · Node fonoster CLI · Node fonoster-mcp
Edges: each client → bus x1190 → workspace (arrow left), Pill "WO… ID + API key ID + secret"
```

## Built from

Diagram/Group np3qG, Diagram/Node sEKX6, Diagram/Chip PHmh8, Diagram/Pill V8p0b, Diagram/Arrow R oSkeo (rotated 180°).

Edges are 2px rectangles (`$ui:accent` for the main path, `$ui:text-muted` for the rest). Colors are `$ui:` tokens;
light = copy of dark with `theme: { "ui:mode": "light" }`.

## Re-export

```
Export(["dZS5U", "PlZ9P"], "png", "<dir>", {scale: 1})
```
Then rename to `credentials-dark.png` / `credentials-light.png`.
