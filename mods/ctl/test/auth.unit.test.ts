import * as Config from "@oclif/config";
import Logout from "../src/commands/auth/logout";
import { fail } from "assert";
import { join } from "path";
import { homedir } from "os";
const fs = require("fs");

describe("@fonoster/ctl/auth", () => {
  // Cleanup authenticated folder if exist
  before(async () => {
    const BASE_DIR = join(homedir(), ".fonoster");
    if (fs.existsSync(BASE_DIR)) {
      fs.rmSync(BASE_DIR, { recursive: true });
    }
  });
  it("unauthenticated should logout without error", async () => {
    const logout = new Logout(["fonoster", "auth:logout"], {
      name: "fonoster",
      version: "1.0",
      channel: "cli"
    } as Config.IConfig);
    try {
      await logout.run();
    } catch (e) {
      fail("unauthenticated client cannot logout");
    }
  });
});
