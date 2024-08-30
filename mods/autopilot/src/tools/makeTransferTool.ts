/*
 * Copyright (C) 2024 by Fonoster Inc (https://fonoster.com)
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
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { TransferOptions, Voice } from "../voice";

const makeTransferTool = (
  voice: Voice,
  destination: string,
  options: TransferOptions
) =>
  tool(
    async () => {
      await voice.transfer(destination, options);
      return { status: "success" };
    },
    {
      name: "transfer",
      schema: z.object({}),
      description: "Transfer the call to a live agent"
    }
  );

export { makeTransferTool };
