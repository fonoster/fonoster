/*
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

/**
 * Fonoster Client (Browser)
 *
 * @description This file exports the Fonoster Client for the browser. It is used to
 * create a new instance of the Fonoster Client for the browser.
 *
 * @TODO: Remove this file when the Fonoster Client is available in the browser.
 */
declare module "@fonoster/sdk/dist/web/index.esm.js" {
  import type { Client as Fonoster } from "@fonoster/sdk";

  export class WebClient extends Fonoster {}
}

/**
 * Fonoster Client (Node)
 *
 * @description This file exports the Fonoster Client for Node. It is used to
 * create a new instance of the Fonoster Client for Node.
 */
declare module "@fonoster/sdk/dist/node/node.js" {
  import type { Client as Fonoster } from "@fonoster/sdk";

  export class Client extends Fonoster {}
}
