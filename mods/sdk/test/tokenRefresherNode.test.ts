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
import { status } from "@grpc/grpc-js";
import * as chai from "chai";
import { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import * as sinon from "sinon";
import sinonChai from "sinon-chai";

chai.use(chaiAsPromised);
chai.use(sinonChai);

// A JWT with a payload of `{"foo":"bar"}` and no `exp` claim, which
// `isJwtExpired` treats as not expired.
const VALID_TOKEN = "header.eyJmb28iOiJiYXIifQ.signature";
// Anything `isJwtExpired` cannot parse is treated as expired.
const EXPIRED_TOKEN = "expired";

const makeClient = (token: string, refreshToken: () => Promise<void>) =>
  ({ getAccessToken: () => token, refreshToken }) as never;

const makeInnerCall = () => ({
  cancelWithStatus: sinon.spy(),
  sendMessageWithContext: sinon.spy(),
  sendMessage: sinon.spy(),
  start: sinon.spy(),
  startRead: sinon.spy(),
  halfClose: sinon.spy(),
  getPeer: () => "test-peer"
});

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("@sdk[client/TokenRefresherNode]", function () {
  it("forwards the message without refreshing when the token is still valid", async function () {
    // Arrange
    const { TokenRefresherNode } = await import(
      "../src/client/TokenRefresherNode"
    );
    const refreshToken = sinon.stub().resolves();
    const interceptor = new TokenRefresherNode(
      makeClient(VALID_TOKEN, refreshToken)
    ).createInterceptor();
    const inner = makeInnerCall();
    const message = { hello: "world" };

    // Act
    const call = interceptor({} as never, (() => inner) as never);
    call.sendMessage(message);

    // Assert
    expect(refreshToken).to.have.not.been.called;
    expect(inner.sendMessageWithContext).to.have.been.calledOnce;
    expect(inner.sendMessageWithContext).to.have.been.calledWith(
      sinon.match.any,
      message
    );
  });

  it("refreshes and then forwards the message when the token is expired", async function () {
    // Arrange
    const { TokenRefresherNode } = await import(
      "../src/client/TokenRefresherNode"
    );
    const refreshToken = sinon.stub().resolves();
    const interceptor = new TokenRefresherNode(
      makeClient(EXPIRED_TOKEN, refreshToken)
    ).createInterceptor();
    const inner = makeInnerCall();
    const message = { hello: "world" };

    // Act
    const call = interceptor({} as never, (() => inner) as never);
    call.sendMessage(message);
    await flush();

    // Assert
    expect(refreshToken).to.have.been.calledOnce;
    expect(inner.sendMessageWithContext).to.have.been.calledWith(
      sinon.match.any,
      message
    );
    expect(inner.cancelWithStatus).to.have.not.been.called;
  });

  it("fails the call with UNAVAILABLE instead of crashing when the refresh rejects", async function () {
    // Arrange
    const { TokenRefresherNode } = await import(
      "../src/client/TokenRefresherNode"
    );
    const refreshToken = sinon
      .stub()
      .rejects(new Error("13 INTERNAL: Internal server error"));
    const interceptor = new TokenRefresherNode(
      makeClient(EXPIRED_TOKEN, refreshToken)
    ).createInterceptor();
    const inner = makeInnerCall();

    const unhandled = sinon.spy();
    process.on("unhandledRejection", unhandled);

    // Act
    const call = interceptor({} as never, (() => inner) as never);
    call.sendMessage({ hello: "world" });
    await flush();
    await flush();
    process.off("unhandledRejection", unhandled);

    // Assert
    expect(unhandled, "refresh failure must not float as an unhandled rejection")
      .to.have.not.been.called;
    expect(inner.sendMessageWithContext).to.have.not.been.called;
    expect(inner.cancelWithStatus).to.have.been.calledOnce;
    expect(inner.cancelWithStatus).to.have.been.calledWith(
      status.UNAVAILABLE,
      sinon.match(/Failed to refresh the access token/)
    );
  });
});
