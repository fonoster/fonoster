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
import type { AuthContextValue } from "~/lib/auth";

/** vi.fn in tests, fn from @storybook/test in stories. */
type Mock = {
  mockResolvedValue(value: unknown): Mock;
  mockReturnValue(value: unknown): Mock;
};
export type MockFactory = () => Mock;

/** A grpc-web style error, as the SDK rejects with. */
export function grpcError(code: number, message = "error") {
  return Object.assign(new Error(message), { code });
}

/** A signed-out session whose client and SDK calls are all mocks. */
export function createFakeAuth(
  mock: MockFactory,
  overrides: Partial<AuthContextValue> = {}
): AuthContextValue {
  const resolved = (value?: unknown) => mock().mockResolvedValue(value);
  const client = {
    sendVerificationCode: resolved(),
    getCapabilities: mock(),
    setAccessKeyId: mock(),
    getAccessKeyId: mock().mockReturnValue("")
  };
  const sdk = {
    users: {
      createUser: resolved({ ref: "u1" }),
      getUser: resolved({
        ref: "u1",
        name: "Ada Lovelace",
        email: "ada@acme.com"
      }),
      updateUser: resolved({ ref: "u1" }),
      sendResetPasswordCode: resolved(),
      resetPassword: resolved()
    },
    workspaces: {
      listWorkspaces: resolved({ items: [] }),
      createWorkspace: resolved({ ref: "ws1" })
    }
  };
  return {
    status: "signedOut",
    endedBy: null,
    client: client as unknown as AuthContextValue["client"],
    sdk: sdk as unknown as AuthContextValue["sdk"],
    user: null,
    signInWithPassword:
      resolved() as unknown as AuthContextValue["signInWithPassword"],
    signInWithCode: resolved() as unknown as AuthContextValue["signInWithCode"],
    signInWithGitHub:
      resolved() as unknown as AuthContextValue["signInWithGitHub"],
    refreshSession: resolved() as unknown as AuthContextValue["refreshSession"],
    signOut: mock() as unknown as AuthContextValue["signOut"],
    ...overrides
  };
}
