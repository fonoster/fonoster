# Build log: revamp-developer-experience

Decisions taken while building, for the owner to review. Each can be reversed.

## 2026-10-16

### DX-B1. Compose-based dev container (coordinator's choice)

- `.devcontainer/compose.yaml` with `dockerComposeFile` / `service: workspace` / `runServices`.
  The dependencies are the bundle's own service definitions (`extends` of
  `ops/bundle/compose.yaml`), so images, health checks, fixed addresses and published ports match
  self-host. Our own services are not containers in dev. Owner can override.
