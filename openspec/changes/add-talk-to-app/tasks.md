## 1. Spec

- [x] 1.1 Requirement "Apps have a Talk drawer" with scenario "Call a stream app"
- [x] 1.2 "A browser call reaches the agent" names stream apps; scenario "Call a stream app's session"
- [x] 1.3 `openspec validate add-talk-to-app --strict` passes

## 2. Code

- [x] 2.1 Talk to app on the app detail page, opening `TalkDrawer` with the app's numbers
- [x] 2.2 Drawer copy without "agent"

## 3. Test

- [x] 3.1 DSH-065 in `e2e/talk-app.real.spec.ts` with fault `faults/DSH-065.patch`
- [ ] 3.2 DSH-065 seen green on the stack and red on its fault
