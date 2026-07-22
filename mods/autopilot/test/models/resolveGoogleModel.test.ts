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
import { resolveGoogleModel } from "../../src/models/google/resolveGoogleModel";
import { GoogleModel } from "../../src/models/google/types";

describe("@autopilot/resolveGoogleModel", () => {
  it("remaps retired gemini-2.0-flash to gemini-2.5-flash", () => {
    expect(resolveGoogleModel("gemini-2.0-flash")).to.equal(
      GoogleModel.GEMINI_2_5_FLASH
    );
  });

  it("remaps retired gemini-2.0-flash-lite to gemini-2.5-flash-lite", () => {
    expect(resolveGoogleModel("gemini-2.0-flash-lite")).to.equal(
      GoogleModel.GEMINI_2_5_FLASH_LITE
    );
  });

  it("leaves supported Gemini models unchanged", () => {
    expect(resolveGoogleModel(GoogleModel.GEMINI_2_5_FLASH)).to.equal(
      GoogleModel.GEMINI_2_5_FLASH
    );
    expect(resolveGoogleModel(GoogleModel.GEMINI_3_FLASH_PREVIEW)).to.equal(
      GoogleModel.GEMINI_3_FLASH_PREVIEW
    );
  });
});
