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
import MaryTTS from "../src/mary_tts";
import chai from "chai";
import sinon from "sinon";
import sinonChai from "sinon-chai";
import chaiAsPromised from "chai-as-promised";
import path from "path";
import https from "https";
import fs from "fs";

const expect = chai.expect;
chai.use(sinonChai);
chai.use(chaiAsPromised);
chai.should();
const sandbox = sinon.createSandbox();

describe("@fonoster/marytts", () => {
  afterEach(() => sandbox.restore());
  const defConfig = {
    url: "https://localhost:59125"
  };

  sandbox.stub(MaryTTS.prototype, "init").returns();

  it("should rejects because the server's response is not 200", async () => {
    const join = sandbox.spy(path, "join");
    const createWriteStream = sandbox.spy(fs, "createWriteStream");
    const pipe = sandbox.stub();
    const get = sandbox.stub(https, "get").yields({ statusCode: 201, pipe });

    const tts = new MaryTTS(defConfig);

    await expect(tts.synthesize("hello world", { locale: "en_US" }))
      .to.be.eventually.rejected.and.to.be.an.instanceOf(Error)
      .to.have.property("message", "Request failed with status code: 201");
    expect(pipe).to.not.have.been.calledOnce;
    expect(createWriteStream).to.not.have.been.calledOnce;
    expect(join).to.have.been.calledOnce;
    expect(get).to.have.been.calledOnce;
  });

  it("synthesizes text and returns path to file", async () => {
    const join = sandbox.spy(path, "join");
    const createWriteStream = sandbox.stub(fs, "createWriteStream").resolves();
    const pipe = sandbox.stub();
    const get = sandbox.stub(https, "get").yields({ statusCode: 200, pipe });

    const tts = new MaryTTS(defConfig);
    const result = await tts.synthesize("hello world");
    expect(result).to.have.property("filename").to.not.be.null;
    expect(result).to.have.property("pathToFile").to.not.be.null;
    expect(pipe).to.have.been.calledOnce;
    expect(join).to.have.been.calledOnce;
    expect(createWriteStream).to.have.been.calledOnce;
    expect(get).to.have.been.calledOnce;
  });
});
