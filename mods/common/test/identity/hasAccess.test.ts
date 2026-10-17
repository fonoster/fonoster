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
import { Role } from "@fonoster/types";
import { expect } from "chai";
import { hasAccess } from "../../src/identity/hasAccess";

const UPDATE_USER = "/fonoster.identity.v1beta2.Identity/UpdateUser";
const CREATE_WORKSPACE = "/fonoster.identity.v1beta2.Identity/CreateWorkspace";
const INVITE = "/fonoster.identity.v1beta2.Identity/InviteUserToWorkspace";

const member = (accessKeyId: string) => ({
  accessKeyId,
  access: [{ accessKeyId: "WOxxxxxxxx", role: Role.WORKSPACE_MEMBER }]
});

describe("@common[identity/hasAccess]", function () {
  it("lets a user with no workspaces call user methods", function () {
    expect(hasAccess({ accessKeyId: "USabc", access: [] }, UPDATE_USER)).to.be.true;
  });

  it("lets a workspace member still update themselves and create workspaces", function () {
    expect(hasAccess(member("USabc"), UPDATE_USER)).to.be.true;
    expect(hasAccess(member("USabc"), CREATE_WORKSPACE)).to.be.true;
  });

  it("doesn't give a member owner or admin methods", function () {
    expect(hasAccess(member("USabc"), INVITE)).to.be.false;
  });

  it("doesn't throw on a token without an access claim", function () {
    expect(hasAccess({ accessKeyId: "USabc" } as never, UPDATE_USER)).to.be.true;
    expect(hasAccess({} as never, UPDATE_USER)).to.be.false;
    expect(hasAccess(undefined as never, INVITE, "WOxxxxxxxx")).to.be.false;
  });

  it("checks only the role held in the target workspace", function () {
    const token = {
      accessKeyId: "USabc",
      access: [
        { accessKeyId: "WOa", role: Role.WORKSPACE_OWNER },
        { accessKeyId: "WOb", role: Role.WORKSPACE_MEMBER }
      ]
    };
    expect(hasAccess(token, INVITE, "WOa")).to.be.true;
    expect(hasAccess(token, INVITE, "WOb")).to.be.false;
    expect(hasAccess(token, INVITE, "WOc")).to.be.false;
    expect(hasAccess(token, INVITE)).to.be.false;
  });

  it("doesn't give the USER role to non-user tokens", function () {
    expect(hasAccess(member("WOabc"), UPDATE_USER)).to.be.false;
  });
});
