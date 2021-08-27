/*
 * Copyright (C) 2021 by Fonoster Inc (https://fonoster.com)
 * http://github.com/fonoster/fonos
 *
 * This file is part of Project Fonos
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
import logger from "@fonos/logger";
import axios from "axios";
import {CallRequest} from "../types";

export const sendCallRequest = async (url: string, request: CallRequest) => {
  try {
    const response = await axios.post(url, request);
    logger.verbose(
      `@fonos/dispatcher mediacontroller [response = ${
        response.data ? response.data.data : "no response"
      }]`
    );
  } catch (e) {
    logger.error(`Unable to send request to voice app at [url = ${url}]`);
  }
};
