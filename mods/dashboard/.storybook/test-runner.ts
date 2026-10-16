/**
 * Copyright (C) 2025 by Fonoster Inc (https://fonoster.com)
 * http://github.com/fonoster/fonoster
 *
 * This file is part of Fonoster
 *
 * Licensed under the MIT License (the "License");
 * you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 *
 *    https://opensource.org/licenses/MIT
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import type { TestRunnerConfig } from "@storybook/test-runner";
import { checkA11y, configureAxe, injectAxe } from "axe-playwright";

/**
 * Every story must render without axe violations (after its play function).
 * The whole page is checked so dialogs and drawers (portals) are included;
 * content an open dialog hides with aria-hidden is skipped.
 */
const config: TestRunnerConfig = {
  async preVisit(page) {
    await injectAxe(page);
    // Stories render one screen without the app's landmarks (main, nav).
    await configureAxe(page, { rules: [{ id: "region", enabled: false }] });
  },
  async postVisit(page) {
    // The theme decorator switches colors as the story mounts and controls
    // animate color changes (150ms); measure contrast once they've settled.
    await page.waitForTimeout(400);
    await checkA11y(page, { include: [["body"]], exclude: [['[aria-hidden="true"]']] } as never, {
      detailedReport: true,
      detailedReportOptions: { html: true }
    });
  }
};

export default config;
