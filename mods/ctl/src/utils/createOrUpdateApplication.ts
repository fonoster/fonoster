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
import * as SDK from "@fonoster/sdk";
import {
  CreateApplicationResponse,
  UpdateApplicationRequest
} from "@fonoster/types";
import {
  ApplicationFlags,
  applicationToRequest,
  applyFlags,
  AppRequest,
  checkRequest,
  fileToRequest,
  readConfigFile
} from "./applicationRequest";

/**
 * Creates an app, or updates one, from an optional YAML/JSON file in the app model plus flags.
 * An update starts from the current app (the control plane replaces the whole app), then the
 * file, then the flags.
 */
export async function createOrUpdateApplication(
  client: SDK.Client,
  filePath?: string,
  appRef?: string,
  isUpdate = false,
  flags: ApplicationFlags = {}
): Promise<CreateApplicationResponse> {
  const fromFile: AppRequest = filePath
    ? fileToRequest(readConfigFile(filePath))
    : ({} as AppRequest);
  const applications = new SDK.Applications(client);

  if (isUpdate) {
    // The positional appRef takes precedence over any `ref` in the file; fall
    // back to the file's `ref` when the positional is omitted.
    const ref = appRef ?? fromFile.ref;

    if (!ref) {
      throw new Error(
        "An Application ref is required to update. Provide it as the positional argument or include `ref` in the file."
      );
    }

    const current = applicationToRequest(
      await applications.getApplication(ref)
    );
    const merged: AppRequest = {
      ...current,
      ...fromFile,
      speech: { ...(current.speech ?? {}), ...(fromFile.speech ?? {}) }
    };
    delete merged.ref;
    const request = applyFlags(merged, flags);
    checkRequest(request);

    const updateRequest: UpdateApplicationRequest = { ...request, ref };
    return applications.updateApplication(updateRequest);
  }

  delete fromFile.ref;
  const request = applyFlags(fromFile, flags);
  checkRequest(request);
  return applications.createApplication(request);
}
