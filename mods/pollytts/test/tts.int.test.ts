/*
 * Copyright (C) 2023 by Fonoster Inc (https://fonoster.com)
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
import PollyTTS, { Voice } from "../src/tts";
import chai from "chai";
import sinon from "sinon";
import sinonChai from "sinon-chai";
import chaiAsPromised from "chai-as-promised";
chai.use(sinonChai);
chai.use(chaiAsPromised);
const sandbox = sinon.createSandbox();

describe("@fonoster/pollytts", () => {
  afterEach(() => sandbox.restore());
  it("synthesizes text and returns path to file", async () => {
    const config = {
      region: "us-east-1",
      keyFilename: __dirname + "/../etc/credentials.json"
    };
    const tts = new PollyTTS(config);
    await tts.synthesize("Hello Kayla, how are you doing today?", {
      voice: Voice.BIANCA
    });

    // TODO: Verify using fs.existSync that a new file was created
    // See your /tmp and ensure that a new .sln16 file was created
  });
});
