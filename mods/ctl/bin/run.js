#!/usr/bin/env node --no-warnings

// WARNING: We added the `--no-warnings` flag to suppress the warning about the punycode deprecated module.
// This is a temporary workaround until this get's fixed upstream.

// eslint-disable-next-line unicorn/prefer-top-level-await
(async () => {
  const oclif = await import("@oclif/core")
  await oclif.execute({ dir: __dirname });
})();
