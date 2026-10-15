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
import { expect } from "chai";
import { recordingFile } from "../../src/core/httpBridge";

describe("@apiserver/core/httpBridge recordingFile", function () {
  it("accepts plain recording names", function () {
    expect(recordingFile("app-1_1696.wav", "/rec")).to.equal(
      "/rec/app-1_1696.wav"
    );
  });

  it("refuses ids that leave the recordings directory", function () {
    for (const id of [
      "../../etc/passwd",
      "..%2F..%2Fetc%2Fpasswd",
      "..",
      ".env",
      "a/../../b",
      "/etc/passwd",
      "a\\..\\b",
      ""
    ])
      expect(recordingFile(id, "/rec"), id).to.equal(undefined);
  });
});
