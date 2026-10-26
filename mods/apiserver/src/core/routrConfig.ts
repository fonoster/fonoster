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
import SDK from "@routr/sdk";
import { ROUTR_API_ENDPOINT } from "../envs";

const routrConfig = {
  endpoint: ROUTR_API_ENDPOINT,
  insecure: true
};

let numbers: InstanceType<typeof SDK.Numbers> | undefined;

/** The apiserver's one client for Routr's Numbers (CreateCall's check, the records' trunks). */
const routrNumbers = () => (numbers ??= new SDK.Numbers(routrConfig));

export { routrConfig, routrNumbers };
