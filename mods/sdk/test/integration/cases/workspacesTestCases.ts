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
function createWorkspacesTestCases(expect) {
  const idBase = "workspaces";

  return {
    api: "Workspaces",
    cases: [
      {
        id: `${idBase}-00`,
        name: "should create a workspace",
        method: "createWorkspace",
        request: {
          name: "My Workspace"
        },
        responseValidator: (response: { ref: string }) => {
          expect(response).has.property("ref");
        }
      },
      {
        id: `${idBase}-01`,
        name: "should get the workspace",
        method: "getWorkspace",
        request: "{{ref}}",
        dependsOn: `${idBase}-00`,
        responseValidator: (response: { ref: string }) => {
          expect(response).has.property("ref").to.not.be.null;
          expect(response).has.property("name").to.not.be.null;
          expect(response).has.property("ownerRef").to.not.be.null;
          expect(response).has.property("createdAt").to.be.a("date");
          expect(response).has.property("updatedAt").to.be.a("date");
        }
      },
      {
        id: `${idBase}-02`,
        name: "should update the name of the workspace",
        method: "updateWorkspace",
        request: {
          ref: "{{ref}}",
          name: "My New Workspace"
        },
        dependsOn: `${idBase}-00`,
        responseValidator: (response: { ref: string }) => {
          expect(response).has.property("ref");
        }
      },
      {
        id: `${idBase}-03`,
        name: "should list at least one workspace",
        method: "listWorkspaces",
        request: {
          pageSize: 10,
          pageToken: null
        },
        responseValidator: (response: {
          items: unknown[];
          nextPageToken: string;
        }) => {
          expect(response).has.property("items");
          expect(response).has.property("nextPageToken");
          expect(response.items.length).to.be.greaterThan(0);
          expect(response.items[0]).to.have.property("ref").to.not.be.null;
          expect(response.items[0]).to.have.property("name").to.not.be.null;
          expect(response.items[0]).to.have.property("ownerRef").to.not.be.null;
          expect(response.items[0])
            .to.have.property("createdAt")
            .to.be.a("date");
          expect(response.items[0])
            .to.have.property("updatedAt")
            .to.be.a("date");
        }
      },
      {
        id: `${idBase}-04`,
        name: "should send invite to the workspace",
        method: "inviteUserToWorkspace",
        request: {
          name: "Any doe",
          email: `any.doe.${Date.now()}@example.com`,
          role: "WORKSPACE_MEMBER"
        },
        responseValidator: (response: { ref: string }) => {
          expect(response).has.property("userRef");
        }
      },
      {
        id: `${idBase}-05`,
        name: "should resend the workspace membership invitation",
        method: "resendWorkspaceMembershipInvitation",
        request: "{{userRef}}",
        dependsOn: `${idBase}-04`,
        responseValidator: (response: { ref: string }) => {
          expect(response).has.property("userRef");
        }
      },
      {
        id: `${idBase}-06`,
        name: "should remove user from the workspace",
        method: "removeUserFromWorkspace",
        request: "{{userRef}}",
        dependsOn: `${idBase}-04`,
        responseValidator: (response: { ref: string }) => {
          expect(response).has.property("userRef");
        }
      },
      {
        id: `${idBase}-07`,
        name: "should delete the workspace",
        method: "deleteWorkspace",
        request: "{{ref}}",
        dependsOn: `${idBase}-00`,
        responseValidator: (response: { ref: string }) => {
          expect(response).has.property("ref");
        }
      },
      {
        id: `${idBase}-08`,
        name: "should fail to delete the workspace (not found)",
        method: "deleteWorkspace",
        request: "{{ref}}",
        dependsOn: `${idBase}-00`,
        grpcCode: 5
      }
    ]
  };
}

export { createWorkspacesTestCases };
