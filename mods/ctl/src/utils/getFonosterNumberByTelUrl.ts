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
import * as Fonoster from "@fonoster/sdk";
import { INumber } from "@fonoster/types";

async function getFonosterNumberByTelUrl(
  client: Fonoster.Client,
  telUrl: string
): Promise<INumber> {
  try {
    const numbers = new Fonoster.Numbers(client);
    const numbersList = await numbers.listNumbers({ pageSize: 1000 });
    return numbersList.items.filter((number) => number.telUrl === telUrl)[0];
  } catch (error: unknown) {
    throw new Error(
      `Error checking Fonoster Number existence: ${(error as Error).message}`
    );
  }
}

export { getFonosterNumberByTelUrl };
