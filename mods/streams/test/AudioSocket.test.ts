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
import * as net from "net";
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

  it("should parse messages that are coalesced or split across TCP reads", function (done) {
    // Arrange
    const sessionId = "4f049b85-8d02-424d-8107-aebc665f47f1";
    const port = 19093;
    const frame = (kind: number, payload: Buffer) => {
      const header = Buffer.alloc(3);
      header[0] = kind;
      header.writeUInt16BE(payload.length, 1);
      return Buffer.concat([header, payload]);
    };
    const wire = Buffer.concat([
      frame(0x01, Buffer.from(sessionId.replace(/-/g, ""), "hex")),
      ...[1, 2, 3, 4, 5].map((n) => frame(0x10, Buffer.alloc(320, n))),
      Buffer.from([0x00, 0x00, 0x00])
    ]);
    const payloads: number[] = [];
    const audioSocket = new AudioSocket();
    let finished = false;

    audioSocket.onConnection((req, stream) => {
      stream.onData((data) => payloads.push(data[0]));
      stream.onError(() => undefined); // teardown reset, not under test
      // close() hangs up, which emits "end" again
      stream.onClose(() => {
        if (finished) return;
        finished = true;
        // Assert
        expect(req.ref).to.equal(sessionId);
        expect(payloads).to.deep.equal([1, 2, 3, 4, 5]);
        client.destroy();
        audioSocket.close();
        done();
      });
    });

    // Act: two writes, split in the middle of the first audio frame
    let client: net.Socket;
    audioSocket.listen(port, "127.0.0.1", () => {
      client = net.createConnection(port, "127.0.0.1", () => {
        const splitAt = 19 + 3 + 100;
        client.write(wire.subarray(0, splitAt));
        setTimeout(() => client.write(wire.subarray(splitAt)), 20);
      });
      client.on("error", () => undefined);
    });
  });
});
