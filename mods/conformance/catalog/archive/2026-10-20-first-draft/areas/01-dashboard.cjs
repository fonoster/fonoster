module.exports = {
  prefix: "DSH",
  title: "Dashboard",
  scope: "What the user sees: every screen and state in designs/dashboard.pen, in community and cloud editions, light and dark, desktop and narrow.",
  level: 'L3 System (UI)',
  tier: "pr",
  uut: 'Dashboard SPA with the apiserver, identity and database behind it',
  tester: 'Playwright (Chromium) in the pinned container, committed golden screenshots, axe-core, and a fake microphone fed from a WAV file',
  env: 'Compose stack, seeded workspace; community and cloud editions',
  cadence: 'Every pull request. Golden files change only in a reviewed pull request.',
  diagram: `flowchart LR
  subgraph TESTER["Tester"]
    PW["Playwright"]
    REF["designs/dashboard.pen (source of the goldens)"]
    BASE[("Screenshot baselines")]
  end
  subgraph UUT["Unit under test"]
    SPA["Dashboard SPA"]
    API["Apiserver"]
    ID["Identity service"]
    DB[("Database")]
  end
  subgraph SUP["Support"]
    STRIPE["Stripe fake (cloud edition)"]
  end
  PW -->|"drives browser"| SPA
  REF -.-> BASE
  BASE -.-> PW
  SPA -->|"gRPC-web"| API
  API --> ID
  API --> DB
  SPA -.-> STRIPE`,
  tests: [
    {
      name: "Screen matches accepted baseline",
      objective: "Each screen state in the design matches the locked Playwright baseline.",
      pre: "Dashboard running with seeded data. Golden screenshots committed to the repository, captured from the running dashboard inside the pinned Playwright container (never on a laptop), reviewed against the design frames once, and changed only through a reviewed pull request. Only the states that matter get a screenshot; structure checks carry the rest.",
      steps: ["For each frame in dashboard.pen, list its states (empty, loading, filled, error, edit dialog, delete dialog).", "Open the screen in that state.", "Capture a screenshot at 1440x900 and 390x844, in light and dark.", "Compare each screenshot with its baseline."],
      pass: "Every screenshot is within the pixel tolerance set in the config for its baseline.",
      fail: "Any screenshot exceeds the tolerance, or a baseline is missing for a state in the design.",
      pri: "P1", ref: "dashboard",
    },
    {
      name: "Screen structure follows the UI rules",
      objective: "Labels, order and copy follow the dashboard UI rules, independent of pixels.",
      pre: "Dashboard running with seeded data.",
      steps: ["Open each list and detail screen.", "Read the page headings, column labels, button labels and empty-state text from the DOM.", "Compare them with the copy table in the design."],
      pass: "All text and element order match the design. App protocol labels read Fonoster or Twilio. No row icons. Catalog labels are used instead of raw ids.",
      fail: "Any label, order or copy differs from the design.",
      pri: "P1", ref: "dashboard",
    },
    {
      name: "Delete requires typing DELETE",
      objective: "A destructive action is blocked until the user confirms by typing.",
      pre: "A workspace with an application, a number and a SIP agent.",
      steps: ["Open Delete on the application.", "Observe the confirm button.", "Type 'delete' in lower case.", "Type 'DELETE'.", "Confirm."],
      pass: "The button is disabled until the input equals DELETE exactly. After confirmation the item is gone from the list and from the API.",
      fail: "The button is enabled earlier, or the item remains after confirmation.",
      pri: "P0", ref: "dashboard",
    },
    {
      name: "Application STT and TTS are optional",
      objective: "An application can be saved with no STT and TTS selected.",
      pre: "Signed in as workspace owner.",
      steps: ["Open Create application.", "Enter a name and a WebSocket URL.", "Leave STT and TTS on None.", "Save.", "Reopen the application."],
      pass: "The application saves. STT and TTS show None. The API returns no STT or TTS provider for it.",
      fail: "Save is blocked, or a default provider is silently stored.",
      pri: "P1", ref: "dashboard",
    },
    {
      name: "SIP agent names are split into pstn. and sip.",
      objective: "SIP agent addresses show the correct domain prefix for PSTN and SIP use.",
      pre: "A SIP agent with a number attached.",
      steps: ["Open the SIP agent detail.", "Read the PSTN address and the SIP address.", "Compare with the API values."],
      pass: "Each address uses its own prefix (pstn. or sip.) and equals the API value.",
      fail: "Prefixes are swapped, merged or missing.",
      pri: "P2", ref: "dashboard",
    },
    {
      name: "Community edition hides SaaS-only UI",
      objective: "Billing, invoices and plan screens are absent in the self-hosted edition.",
      pre: "Dashboard started in community (OSS) mode.",
      steps: ["Sign in as owner.", "Inspect the navigation.", "Open the URLs of the billing routes directly."],
      pass: "No billing navigation entry. Direct URLs show not found, not a broken page.",
      fail: "Any billing, invoice or plan element appears.",
      pri: "P0", ref: "dashboard",
    },
    {
      name: "Cloud edition shows Billing to owners only",
      objective: "The Billing tab is visible to workspace owners and hidden from other roles.",
      pre: "Cloud mode. One owner and one member in the same workspace.",
      steps: ["Sign in as the owner and open the navigation.", "Sign out. Sign in as the member and open the navigation.", "As the member, open the Billing URL directly."],
      pass: "Owner sees Billing. Member does not, and the direct URL is denied.",
      fail: "The member can see or open Billing.",
      pri: "P0", ref: "dashboard, usage-metering",
    },
    {
      name: "Session lifecycle",
      objective: "Sign-in, token expiry and sign-out behave correctly.",
      pre: "A valid user.",
      steps: ["Sign in.", "Reload the page.", "Expire the access token (shorten its lifetime in the fixture).", "Trigger any API call.", "Sign out."],
      pass: "Reload keeps the session. An expired token refreshes, or sends the user to sign-in without a blank page. After sign-out, tokens are removed and protected routes redirect.",
      fail: "The session is lost on reload, the page goes blank on expiry, or tokens remain after sign-out.",
      pri: "P0", ref: "identity-client",
    },
    {
      name: "Workspace switcher isolates data",
      objective: "Switching workspace shows only that workspace's data.",
      pre: "A user in two workspaces with different applications.",
      steps: ["Open the list of applications in workspace A.", "Switch to workspace B.", "Open the same list.", "Reload the page."],
      pass: "Each workspace lists only its own applications, before and after reload.",
      fail: "Any item from the other workspace appears, even briefly after the switch.",
      pri: "P0", ref: "dashboard, identity",
    },
    {
      name: "Theme setting persists",
      objective: "The theme chosen in Settings applies everywhere and survives reload.",
      pre: "Signed in.",
      steps: ["Open Settings.", "Choose Dark, then reload.", "Choose Light, then reload.", "Choose System with the OS in dark."],
      pass: "The chosen theme is applied on every screen after each reload. System follows the OS.",
      fail: "The theme resets, or any screen ignores it.",
      pri: "P2", ref: "dashboard",
    },
    {
      name: "API failure shows an error state",
      objective: "A failing API produces a readable error, not a blank screen.",
      pre: "Dashboard running. API reachable.",
      steps: ["Open a list screen.", "Stop the apiserver, or make it return 500.", "Reload the screen.", "Restore the apiserver and retry."],
      pass: "The error state from the design is shown with a retry action. Retry loads the data.",
      fail: "A blank page, an endless spinner, or a raw error message.",
      pri: "P1", ref: "dashboard",
    },
    {
      "name": "Talk in browser",
      tier: "nightly",
      "objective": "A user can test an application with a call from the browser.",
      "pre": "An application backed by a fixture app that replies with a known phrase. Chromium started with --use-fake-device-for-media-stream and a WAV file as the microphone.",
      "steps": [
        "Open the application and select Talk.",
        "Let the fake microphone play the recorded phrase.",
        "Capture the audio played by the page with a WebAudio analyser.",
        "End the call.",
        "Fetch the call record through the API."
      ],
      "pass": "The call connects. The reply audio contains the expected phrase (matched by the fake STT). The call record exists with the transcript.",
      "fail": "No connection, silent reply, or no call record.",
      "pri": "P0",
      "ref": "talk-in-browser"
    },
    {
      name: "Regions screen",
      objective: "A user can list a region and see its status.",
      pre: "One cloud region and one enrolled private region.",
      steps: ["Open Regions.", "Open each region."],
      pass: "Each region shows its name, status and node count that match the API.",
      fail: "Missing region, wrong status, or wrong node count.",
      pri: "P2", ref: "regions",
    },
    {
      "name": "Keyboard and focus",
      "objective": "Core flows work by keyboard with visible focus and no accessibility violations.",
      "pre": "Dashboard running with seeded data.",
      "steps": [
        "With Playwright keyboard events only, sign in, create an application and open then cancel the delete dialog.",
        "After each step assert document.activeElement and its computed focus outline.",
        "Run axe-core on each screen reached."
      ],
      "pass": "Every control is reached in a logical order, focus is visible, Escape closes dialogs, and axe-core reports no serious or critical violations.",
      "fail": "An unreachable control, invisible focus or a serious violation.",
      "pri": "P2",
      "ref": "dashboard"
    },
    {
      name: "API and view parity",
      objective: "Every API operation has a UI decision, and the reverse.",
      pre: "The parity script and the RPC list generated from the proto files.",
      steps: ["Run the parity script.", "Read the three groups: API only, UI only, both.", "Check every row in the first two groups against test-plan-gaps.md."],
      pass: "Every row in API only and UI only is fixed or documented with a reason.",
      fail: "Any undocumented row.",
      pri: "P1", ref: "control-plane",
    },
  ],
};
