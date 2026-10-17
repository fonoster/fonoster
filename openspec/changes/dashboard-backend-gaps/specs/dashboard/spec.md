## ADDED Requirements

### Requirement: Calls can be filtered by app

Call detail records SHALL carry the `appRef` of the app that handled the call, and the calls list
SHALL filter by agent or app.

#### Scenario: Filter calls by app

- WHEN the user filters the calls list by an app
- THEN only calls whose record carries that app's `appRef` are listed

### Requirement: Member roles can be changed

A workspace admin SHALL be able to change another member's role from the Members screen.

#### Scenario: Promote a member

- WHEN an admin changes a member's role from member to admin
- THEN the member list shows the new role, and the member gains admin permissions on their next request
