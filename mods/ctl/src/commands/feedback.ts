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
import { Command } from "@oclif/core";

export default class Feedback extends Command {
  static override description = `provide feedback on your experience
  ...
  Help us improve by providing some feedback
  `;
  static override examples = ["<%= config.bin %> <%= command.id %>"];

  public async run(): Promise<void> {
    const link =
      " https://docs.google.com/forms/d/e/1FAIpQLSd1G2ahRYqkbksOvz7XhNHfSLepUh3KzRHsXh2HXfZr68nhtQ/viewform?vc=0&c=0&w=1&flr=0";
    this.log(
      `Please provide feedback on your experience by filling out the form below:\n${link}`
    );
  }
}
