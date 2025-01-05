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
import { SinonSandbox, createSandbox } from "sinon";
import sinonChai from "sinon-chai";
import { ErrorCode, MessageType } from "../src";
import { Message } from "../src/Message";

chai.use(chaiAsPromised);
chai.use(sinonChai);

describe("@streams/Message", function () {
  let sandbox: SinonSandbox;
  let message: Message;

  beforeEach(function () {
    sandbox = createSandbox();
    message = new Message(
      Buffer.from([MessageType.ID, 0x00, 0x02, 0x03, 0x04])
    );
  });

  afterEach(function () {
    sandbox.restore();
  });

  it("should create a new instance", function () {
    // Assert
    expect(message).to.be.instanceOf(Message);
  });

  it("should return the content length", function () {
    // Assert
    expect(message.getContentLength()).to.be.equal(2);
  });

  it("should return the message kind", function () {
    // Assert
    expect(message.getKind()).to.be.equal(MessageType.ID);
  });

  it("should return an error code type NONE", function () {
    // Assert
    expect(message.getErrorCode()).to.be.equal(ErrorCode.NONE);
  });

  it("should return the payload", function () {
    // Assert
    expect(message.getPayload()).to.be.eql(Buffer.from([0x03, 0x04]));
  });

  it("should return the uuid of the stream", function () {
    // Arrange
    const idMessage = new Message(
      Buffer.from([
        MessageType.ID,
        0x00,
        0x10,
        0x36,
        0xc3,
        0xa7,
        0x75,
        0x04,
        0x14,
        0x4a,
        0xf2,
        0x98,
        0xae,
        0x2e,
        0x7c,
        0xdb,
        0x65,
        0xcf,
        0x65
      ])
    );

    // Assert
    expect(idMessage.getId()).to.be.equal(
      "36c3a775-0414-4af2-98ae-2e7cdb65cf65"
    );
  });

  it("should throw an error when the message type is wrong", function () {
    // Arrange
    const idMessage = new Message(
      Buffer.from([0x03, 0x00, 0x10, 0x01, 0x02, 0x03, 0x04])
    );

    // Assert
    expect(() => idMessage.getId()).to.throw("Wrong message type 3");
  });

  it("should create a hangup message", function () {
    // Assert
    expect(Message.createHangupMessage()).to.be.eql(
      Buffer.from([MessageType.HANGUP, 0x00, 0x00])
    );
  });

  it("should create an id message", function () {
    // Arrange
    const id = "36c3a775-0414-4af2-98ae-2e7cdb65cf65";

    // Assert
    expect(Message.createIDMessage(id)).to.be.eql(
      Buffer.from([
        MessageType.ID,
        0x00,
        0x10,
        0x36,
        0xc3,
        0xa7,
        0x75,
        0x04,
        0x14,
        0x4a,
        0xf2,
        0x98,
        0xae,
        0x2e,
        0x7c,
        0xdb,
        0x65,
        0xcf,
        0x65
      ])
    );
  });

  it("should create a slin message", function () {
    // Arrange
    const data = Buffer.from([0x01, 0x02, 0x03, 0x04]);

    // Assert
    expect(Message.createSlinMessage(data)).to.be.eql(
      Buffer.from([MessageType.SLIN, 0x00, 0x04, 0x01, 0x02, 0x03, 0x04])
    );
  });
});
