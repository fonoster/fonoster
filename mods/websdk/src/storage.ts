/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable require-jsdoc */
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
import WebAPIClient from "@fonoster/common/dist/web_client";
import { WebClientOptions } from "@fonoster/common/dist/types";
import { IStorageClient } from "@fonoster/storage";
import {
  UploadObjectRequest,
  UploadObjectResponse,
  GetObjectURLRequest,
  GetObjectURLResponse
} from "@fonoster/storage/src/client/types";
import * as c from "./generated/api";

export default class Storage extends WebAPIClient implements IStorageClient {
  constructor(options: WebClientOptions) {
    super(c, "StorageApi", options);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async uploadObject(_: UploadObjectRequest): Promise<UploadObjectResponse> {
    throw new Error("implementation not available on browsers");
  }

  async getObjectURL(
    request: GetObjectURLRequest
  ): Promise<GetObjectURLResponse> {
    return (await super.run("getObjectURL", request)) as any;
  }
}
