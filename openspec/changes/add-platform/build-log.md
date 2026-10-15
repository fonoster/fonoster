# add-platform build log

## 2026-10-15 (spec review rulings, with the owner)

A separate reviewer read every rebuild spec; the owner ruled on each finding one by one.

### PL-R1. Cells: metadata out, content stays

- Only the call-record index (call ref, app, time, duration, status, cost, size, location), config
  and health cross the leaf link; the dashboard reads content from the cell with a short-lived
  link. Private cells answer `GetCapabilities` locally. SIP traces removed from the cell contents.

### PL-R2. PL3 revised for new calls

- `call.incoming` and `gateway.outbound` use request and reply on a gateway queue group (claim in
  500 ms, one retry, then 503) instead of JetStream.
