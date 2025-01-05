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
import fs from "fs";
import net from "net";
import { Readable } from "stream";
import * as chai from "chai";
import { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { createSandbox } from "sinon";
import sinonChai from "sinon-chai";
import { AudioStream, MessageType } from "../src";

chai.use(chaiAsPromised);
chai.use(sinonChai);
const sandbox = createSandbox();

describe("@streams/AudioStream", function () {
  afterEach(function () {
    return sandbox.restore();
  });

  it("should create a new instance", function () {
    // Arrange
    const stream = new Readable();
    const socket = new net.Socket();
    const audioStream = new AudioStream(stream, socket);

    // Assert
    expect(audioStream).to.be.instanceOf(AudioStream);
  });

  it("should write data to the socket", function () {
    // Arrange
    const stream = new Readable();
    const socket = new net.Socket();
    const audioStream = new AudioStream(stream, socket);

    const writeStub = sandbox.stub(socket, "write");

    // Act
    audioStream.write(Buffer.from("test"));

    // Assert
    expect(writeStub).to.have.been.calledOnce;
    expect(writeStub).to.have.been.calledWith(
      Buffer.from([MessageType.SLIN, 0x00, 0x04, 0x74, 0x65, 0x73, 0x74])
    );
  });

  it("should hangup the call", function () {
    // Arrange
    const stream = new Readable();
    const socket = new net.Socket();
    const audioStream = new AudioStream(stream, socket);

    const writeStub = sandbox.stub(socket, "write");
    const endStub = sandbox.stub(socket, "end");
    const emitStub = sandbox.stub(stream, "emit");

    // Act
    audioStream.hangup();

    // Assert
    expect(writeStub).to.have.been.calledOnce;
    expect(endStub).to.have.been.calledOnce;
    expect(emitStub).to.have.been.calledOnce;
    expect(emitStub).to.have.been.calledWith("end");
    expect(emitStub).to.have.been.calledAfter(endStub);
    expect(emitStub).to.have.been.calledAfter(writeStub);
    expect(writeStub).to.have.been.calledWith(
      Buffer.from([MessageType.HANGUP, 0x00, 0x00])
    );
  });

  it("should play a file", async function () {
    // Arrange
    const stream = new Readable();
    const socket = new net.Socket();
    const audioStream = new AudioStream(stream, socket);

    const readFileSyncStub = sandbox
      .stub(fs, "readFileSync")
      .returns(Buffer.from("test"));
    const writeStub = sandbox.stub(socket, "write");

    // Act
    await audioStream.play("test");

    // Assert
    expect(readFileSyncStub).to.have.been.calledOnce;
    expect(writeStub).to.have.been.calledOnce;
    expect(writeStub).to.have.been.calledWith(
      Buffer.from([MessageType.SLIN, 0x00, 0x04, 0x74, 0x65, 0x73, 0x74])
    );
  });

  it("should add a listener to the stream", function () {
    // Arrange
    const stream = new Readable();
    const socket = new net.Socket();
    const audioStream = new AudioStream(stream, socket);

    const onStub = sandbox.stub(stream, "on");

    // Act
    audioStream.onData(() => {});

    // Assert
    expect(onStub).to.have.been.calledOnce;
    expect(onStub).to.have.been.calledWith("data");
  });
});
