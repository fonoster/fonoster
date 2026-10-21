## 1. Behavior

- [ ] 1.1 `withAccess` answers a foreign ref with `NOT_FOUND` ("The requested resource was not found"), the same as an unknown ref
- [ ] 1.2 `hasAccessToResource` compares the resource's workspace with the call's, not with every workspace in the token
- [ ] 1.3 `paginateWithFiltering` returns no item twice and skips none across pages
- [ ] 1.4 Check the dashboard and the SDK for code that branches on `PERMISSION_DENIED` for a foreign ref

## 2. Cases

- [ ] 2.1 Cases for every scenario in the API area (`mods/conformance/catalog/areas/api.md`), run through the Node SDK and raw gRPC, each proven with a fault patch
