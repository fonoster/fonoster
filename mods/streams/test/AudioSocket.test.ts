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
import * as chai from "chai";
import { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { createSandbox, match } from "sinon";
import sinonChai from "sinon-chai";
import { AudioSocket } from "../src";

chai.use(chaiAsPromised);
chai.use(sinonChai);
const sandbox = createSandbox();

describe("@streams/AudioSocket", function () {
  afterEach(function () {
    return sandbox.restore();
  });

  it("should create a new instance", function () {
    // Arrange
    const audioSocket = new AudioSocket();

    // Assert
    expect(audioSocket).to.be.instanceOf(AudioSocket);
  });

  it("should listen on a port", function () {
    // Arrange
    const audioSocket = new AudioSocket();

    const listenStub = sandbox.stub(audioSocket, "listen");

    // Act
    audioSocket.listen(8080);

    // Assert
    expect(listenStub).to.have.been.calledOnce;
    expect(listenStub).to.have.been.calledWith(8080);
  });

  it("should listen on a port and bind", function () {
    // Arrange
    const audioSocket = new AudioSocket();

    const listenStub = sandbox.stub(audioSocket, "listen");

    // Act
    audioSocket.listen(8080, "127.0.0.1");

    // Assert
    expect(listenStub).to.have.been.calledOnce;
    expect(listenStub).to.have.been.calledWith(8080, "127.0.0.1");
  });

  it("should listen on a port and bind with a callback", function () {
    // Arrange
    const audioSocket = new AudioSocket();

    const listenStub = sandbox.stub(audioSocket, "listen");

    // Act
    audioSocket.listen(8080, "127.0.0.1", () => {});

    // Assert
    expect(listenStub).to.have.been.calledOnce;
    expect(listenStub).to.have.been.calledWith(8080, "127.0.0.1", match.func);
  });
});
