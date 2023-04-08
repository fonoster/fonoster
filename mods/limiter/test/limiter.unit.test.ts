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
import chai from "chai";
import sinon from "sinon";
import sinonChai from "sinon-chai";
import chaiAsPromised from "chai-as-promised";
import {
  getUserByAccessKeyId,
  getLimiterByName,
  getResourceCount
} from "../src/utils/utils";
import * as userDecoder from "@fonoster/users/dist/service/decoder";
import { Limiter, RoutrClient } from "../src/service/types";
import { UserStatus } from "@fonoster/users/dist/service/types";
const expect = chai.expect;
chai.use(sinonChai);
chai.use(chaiAsPromised);
const sandbox = sinon.createSandbox();

const routr = {
  connect: () => null,
  resourceType: () => null,
  list: sandbox
    .stub()
    .onCall(0)
    .resolves({
      meta: {
        totalItems: 1
      }
    })
    .onCall(1)
    .resolves({
      meta: {
        totalItems: 2
      }
    })
};

describe("@fonoster/limiter", () => {
  afterEach(() => sandbox.restore());

  describe("getUserByAccessKeyId", () => {
    it("gets null because json object was undefined", async () => {
      const redisClient = {
        get: sandbox.stub().resolves(null),
        smembers: sandbox.stub().resolves(null)
      };
      const user = await getUserByAccessKeyId(redisClient)("US123");
      expect(user).to.be.null;
    });

    it("should call userDecoder once becase id starts with US", async () => {
      const redisClient = {
        get: sandbox.stub().resolves(
          JSON.stringify({
            ref: "US123",
            accessKeyId: "US123",
            email: "test@fonoster.com",
            name: "Test User",
            avatar: "https://avatar.com/test.png",
            createTime: Date.now(),
            updateTime: Date.now()
          })
        ),
        smembers: sandbox.stub().resolves(null)
      };

      const userDecoderSpy = sandbox.spy(userDecoder, "default");
      const user = await getUserByAccessKeyId(redisClient)("US123");

      expect(user).to.be.not.null;
      expect(userDecoderSpy).to.have.been.calledOnce;
    });

    it("should call userDecoder twice becase id starts with PJ", async () => {
      const redisClient = {
        get: sandbox
          .stub()
          .onCall(0)
          .resolves(
            JSON.stringify({
              userRef: "US123"
            })
          )
          .onCall(1)
          .resolves(
            JSON.stringify({
              ref: "US123",
              accessKeyId: "US123",
              email: "test@fonoster.com",
              name: "Test User",
              avatar: "https://avatar.com/test.png",
              createTime: Date.now(),
              updateTime: Date.now()
            })
          ),
        smembers: sandbox.stub().resolves(null)
      };

      const userDecoderSpy = sandbox.spy(userDecoder, "default");
      const user = await getUserByAccessKeyId(redisClient)("PJ123");

      expect(user).to.be.not.null;
      expect(user.getRef()).to.have.equal("US123");
      expect(userDecoderSpy).to.have.been.calledOnce;
    });
  });

  describe("getLimiterByName", () => {
    it("returns an undefined limiter since it found not limiters object", () => {
      const limit = getLimiterByName([])("test");
      expect(limit).to.be.undefined;
    });

    it("returns a limit for the name 'test'", () => {
      const limiters: Limiter[] = [
        {
          name: "test",
          allowedStatus: UserStatus.ACTIVE,
          limits: [
            {
              path: "/test",
              resource: "test",
              limit: 1
            }
          ]
        }
      ];

      const limit = getLimiterByName(limiters)("test");

      expect(limit).to.have.property("name").to.equal("test");
      expect(limit)
        .to.have.property("allowedStatus")
        .to.equal(UserStatus.ACTIVE);
      expect(limit).to.have.property("limits").to.be.an("array");
      expect(limit.limits).to.have.lengthOf(1);
    });

    it("returns the default limit", () => {
      const limiters: Limiter[] = [
        {
          name: "default",
          allowedStatus: UserStatus.ACTIVE,
          limits: [
            {
              path: "/test",
              resource: "test",
              limit: 1
            }
          ]
        }
      ];

      const limit = getLimiterByName(limiters)();

      expect(limit).to.have.property("name").to.equal("default");
      expect(limit)
        .to.have.property("allowedStatus")
        .to.equal(UserStatus.ACTIVE);
      expect(limit).to.have.property("limits").to.be.an("array");
      expect(limit.limits).to.have.lengthOf(1);
    });
  });

  describe("getResourceCount", () => {
    it("returns the number of projects", async () => {
      const redis = {
        get: sandbox.stub().resolves(null),
        smembers: sandbox.stub().resolves(["PJ123", "PJ456"])
      };

      const count = await getResourceCount(
        redis,
        routr as unknown as RoutrClient
      )("US123", "project");
      expect(count).to.be.equal(2);
    });

    it("returns the number of domains", async () => {
      const redis = {
        get: sandbox.stub().resolves(null),
        smembers: sandbox.stub().resolves(["PJ123", "PJ456"])
      };

      const spyRoutrConnect = sandbox.spy(routr, "connect");
      const spyRoutrResourceType = sandbox.spy(routr, "resourceType");

      const count = await getResourceCount(
        redis,
        routr as unknown as RoutrClient
      )("US123", "domain");
      expect(count).to.be.equal(3);
      expect(spyRoutrConnect).to.have.been.calledOnce;
      expect(spyRoutrResourceType).to.have.been.calledOnce;
    });

    it("returns 0 since is not a limited resource", async () => {
      const redis = {
        get: sandbox.stub().resolves(null),
        smembers: sandbox.stub().resolves(["PJ123", "PJ456"])
      };

      const count = await getResourceCount(
        redis,
        routr as unknown as RoutrClient
      )("US123", "somethingelse");
      expect(count).to.be.equal(0);
    });
  });
});
