## REMOVED Requirements

### Requirement: Roomr node suite
**Reason**: The node suite moved to fonoster/roomr with the node (its e2e tests and the contract suite run against the node and the fake in Roomr's CI); the ROM area is retired here.
**Migration**: None in this repository; see fonoster/roomr.

### Requirement: The Roomr load bar is re-run on the control stream
**Reason**: Node performance is Roomr's to measure.
**Migration**: Tracked in fonoster/roomr#12.

### Requirement: Roomr fakes cover both sides of every Roomr contract
**Reason**: Roomr ships its own fake (`fonoster/roomr-fake`, `@fonoster/roomr/fake`) and contract suite; Fonoster's FakeRoomr, FakeSessionNode and RealMediaHarness are adapters over it.
**Migration**: See "Every contract has a fake for each side"; the fake is consumed from `@fonoster/roomr`.
