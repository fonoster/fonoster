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
import type { IdTokenClaims } from "~/lib/jwt";
import { fakeAuth, renderScreen } from "~/test/render";
import { holdSignInPassword, takeSignInPassword } from "./invite";
import SetPasswordPage from "./set-password.page";

const invitee = {
  sub: "u1",
  email: "maria@acme.com",
  accessKeyId: "US1",
  exp: 0,
  mustChangePassword: true
} as IdTokenClaims;

describe("SetPasswordPage", () => {
  it("has no way to skip, only sign out", () => {
    renderScreen(<SetPasswordPage />, {
      auth: fakeAuth({ status: "signedIn", user: invitee })
    });
    expect(screen.getByText("maria@acme.com")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /skip/i })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Sign out" })
    ).toBeInTheDocument();
  });

  it("requires matching passwords of 8+ characters", async () => {
    const auth = fakeAuth({ status: "signedIn", user: invitee });
    const { user } = renderScreen(<SetPasswordPage />, { auth });
    await user.type(screen.getByLabelText("New password"), "short");
    await user.type(screen.getByLabelText("Confirm password"), "other");
    await user.click(
      screen.getByRole("button", { name: "Set password and continue" })
    );
    expect(
      await screen.findByText("Use at least 8 characters")
    ).toBeInTheDocument();
    expect(screen.getByText("The passwords don't match")).toBeInTheDocument();
    expect(screen.getByText("Enter the one-time password")).toBeInTheDocument();
    expect(auth.sdk.users.updateUser).not.toHaveBeenCalled();
  });

  it("updates the password with the one-time password, then signs in again", async () => {
    const auth = fakeAuth({ status: "signedIn", user: invitee });
    const { user } = renderScreen(<SetPasswordPage />, { auth });
    await user.type(screen.getByLabelText("One-time password"), "otp-123456");
    await user.type(screen.getByLabelText("New password"), "a-good-password");
    await user.type(
      screen.getByLabelText("Confirm password"),
      "a-good-password"
    );
    await user.click(
      screen.getByRole("button", { name: "Set password and continue" })
    );
    expect(auth.sdk.users.updateUser).toHaveBeenCalledWith({
      ref: "u1",
      password: "a-good-password",
      currentPassword: "otp-123456"
    });
    expect(auth.signInWithPassword).toHaveBeenCalledWith(
      "maria@acme.com",
      "a-good-password"
    );
  });

  it("reuses the one-time password just used to sign in", async () => {
    holdSignInPassword("otp-123456");
    const auth = fakeAuth({ status: "signedIn", user: invitee });
    const { user } = renderScreen(<SetPasswordPage />, { auth });
    expect(screen.queryByLabelText("One-time password")).toBeNull();
    await user.type(screen.getByLabelText("New password"), "a-good-password");
    await user.type(
      screen.getByLabelText("Confirm password"),
      "a-good-password"
    );
    await user.click(
      screen.getByRole("button", { name: "Set password and continue" })
    );
    expect(auth.sdk.users.updateUser).toHaveBeenCalledWith({
      ref: "u1",
      password: "a-good-password",
      currentPassword: "otp-123456"
    });
  });

  it("forgets the held password after a minute", () => {
    holdSignInPassword("otp-123456", 0);
    expect(takeSignInPassword(60_001)).toBeUndefined();
    holdSignInPassword("otp-123456", 0);
    expect(takeSignInPassword(1000)).toBe("otp-123456");
    expect(takeSignInPassword(1000)).toBeUndefined();
  });
});
