#!/usr/bin/env node

// The following code suppresses the warning about the punycode deprecated module.
// This is a temporary workaround until this get's fixed upstream.
process.removeAllListeners("warning");
process.on("warning", () => {});

// eslint-disable-next-line unicorn/prefer-top-level-await
(async () => {
  const oclif = await import("@oclif/core")
  await oclif.execute({ dir: __dirname });
})();
