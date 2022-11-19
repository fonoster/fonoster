/*
 * Copyright (C) 2022 by Fonoster Inc (https://fonoster.com)
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
import logger from "@fonoster/logger";

export async function getChannelVar(
  channel: any,
  variable: string
): Promise<string> {
  logger.verbose("getting session variable", {
    sessionId: channel.id,
    variable
  });

  try {
    const channelVar = await channel.getChannelVar({
      channelId: channel.id,
      variable
    });
    // If it gets here is because the variable was set
    return channelVar.value;
  } catch (e) {
    /* we need to do nothing */
  }

  return null;
}

export async function getChannelVarAsJson(
  channel: any,
  variable: string
): Promise<Record<string, unknown>> {
  const v = await getChannelVar(channel, variable);
  return v ? JSON.parse(v) : null;
}
