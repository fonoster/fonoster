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
import { screen } from "@testing-library/react";
import { GrpcCode } from "~/lib/errors";
import { communityCapabilities } from "~/lib/fixtures";
import { fakeAuth, grpcError, renderScreen } from "~/test/render";
import SignUpPage from "./sign-up.page";

const open = {
  ...communityCapabilities,
  auth: { methods: ["password" as const], signup: "open" as const }
};

describe("SignUpPage", () => {
  it("is unavailable when sign-up is invite-only", async () => {
    renderScreen(<SignUpPage />, { path: "/sign-up" });
    expect(await screen.findByTestId("location")).toHaveTextContent("/sign-in");
  });

  it("creates the account and signs in", async () => {
    const auth = fakeAuth();
    const { user } = renderScreen(<SignUpPage />, {
      path: "/sign-up",
      capabilities: open,
      auth
    });
    await user.type(screen.getByLabelText("Name"), "Ada Lovelace");
    await user.type(screen.getByLabelText("Email"), "ada@acme.com");
    await user.type(screen.getByLabelText("Password"), "a-good-password");
    await user.click(screen.getByRole("button", { name: "Create account" }));
    expect(auth.sdk.users.createUser).toHaveBeenCalledWith({
      name: "Ada Lovelace",
      email: "ada@acme.com",
      password: "a-good-password",
      avatar: ""
    });
    expect(auth.signInWithPassword).toHaveBeenCalledWith(
      "ada@acme.com",
      "a-good-password"
    );
  });

  it("points existing accounts to sign-in", async () => {
    const auth = fakeAuth();
    vi.mocked(auth.sdk.users.createUser).mockRejectedValue(
      grpcError(GrpcCode.ALREADY_EXISTS)
    );
    const { user } = renderScreen(<SignUpPage />, {
      path: "/sign-up",
      capabilities: open,
      auth
    });
    await user.type(screen.getByLabelText("Name"), "Ada");
    await user.type(screen.getByLabelText("Email"), "ada@acme.com");
    await user.type(screen.getByLabelText("Password"), "a-good-password");
    await user.click(screen.getByRole("button", { name: "Create account" }));
    expect(await screen.findByText(/already exists/)).toBeInTheDocument();
  });
});
