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
import { cloudCapabilities, communityCapabilities } from "~/lib/fixtures";
import { GrpcCode } from "~/lib/errors";
import { fakeAuth, grpcError, renderScreen } from "~/test/render";
import { markInviteInFlight } from "./invite";
import SignInPage from "./sign-in.page";

const at = { path: "/sign-in" };

describe("SignInPage", () => {
  describe("community (password, invite-only)", () => {
    it("shows email and password, and no GitHub or sign-up", () => {
      renderScreen(<SignInPage />, at);
      expect(screen.getByLabelText("Email")).toBeInTheDocument();
      expect(screen.getByLabelText("Password")).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: "Forgot password?" })
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /GitHub/ })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("link", { name: "Create an account" })
      ).not.toBeInTheDocument();
      expect(
        screen.getByText(/Ask your workspace admin for an invite/)
      ).toBeInTheDocument();
    });

    it("signs in and goes to next", async () => {
      const auth = fakeAuth();
      const { user } = renderScreen(<SignInPage />, {
        path: "/sign-in",
        route: "/sign-in?next=/workspaces",
        auth
      });
      await user.type(screen.getByLabelText("Email"), "ada@acme.com");
      await user.type(screen.getByLabelText("Password"), "secret-pass");
      await user.click(screen.getByRole("button", { name: "Sign in" }));
      expect(auth.signInWithPassword).toHaveBeenCalledWith(
        "ada@acme.com",
        "secret-pass"
      );
      expect(await screen.findByTestId("location")).toHaveTextContent(
        "/workspaces"
      );
    });

    it("shows the same message for a wrong password and an unknown email", async () => {
      const auth = fakeAuth({
        signInWithPassword: vi
          .fn()
          .mockRejectedValue(
            grpcError(GrpcCode.PERMISSION_DENIED, "Invalid credentials")
          )
      });
      const { user } = renderScreen(<SignInPage />, { ...at, auth });
      await user.type(screen.getByLabelText("Email"), "nobody@acme.com");
      await user.type(screen.getByLabelText("Password"), "whatever");
      await user.click(screen.getByRole("button", { name: "Sign in" }));
      expect(
        await screen.findByText("Invalid credentials")
      ).toBeInTheDocument();
      expect(
        screen.getByText("Check your email and password and try again.")
      ).toBeInTheDocument();
    });

    it("validates before calling the API", async () => {
      const auth = fakeAuth();
      const { user } = renderScreen(<SignInPage />, { ...at, auth });
      await user.click(screen.getByRole("button", { name: "Sign in" }));
      expect(await screen.findByText("Enter your email")).toBeInTheDocument();
      expect(auth.signInWithPassword).not.toHaveBeenCalled();
    });

    it("links to sign-up when sign-up is open", () => {
      renderScreen(<SignInPage />, {
        ...at,
        capabilities: {
          ...communityCapabilities,
          auth: { methods: ["password"], signup: "open" }
        }
      });
      expect(
        screen.getByRole("link", { name: "Create an account" })
      ).toHaveAttribute("href", "/sign-up");
    });

    it("shows the invited variant after accepting an invite", () => {
      markInviteInFlight();
      renderScreen(<SignInPage />, at);
      expect(
        screen.getByRole("heading", { name: "You're invited" })
      ).toBeInTheDocument();
      expect(screen.getByText("Invite accepted")).toBeInTheDocument();
    });
  });

  describe("cloud (GitHub + email code)", () => {
    it("shows GitHub and the email-code form, and no password", () => {
      renderScreen(<SignInPage />, { ...at, capabilities: cloudCapabilities });
      expect(
        screen.getByRole("button", { name: /Continue with GitHub/ })
      ).toBeInTheDocument();
      expect(screen.getByLabelText("Work email")).toBeInTheDocument();
      expect(screen.queryByLabelText("Password")).not.toBeInTheDocument();
      expect(
        screen.getByText("New here? The same steps create your account.")
      ).toBeInTheDocument();
    });

    it("sends a code and moves to Check email", async () => {
      const auth = fakeAuth();
      const { user } = renderScreen(<SignInPage />, {
        ...at,
        capabilities: cloudCapabilities,
        auth
      });
      await user.type(screen.getByLabelText("Work email"), "ada@acme.com");
      await user.click(
        screen.getByRole("button", { name: "Email me a sign-in code" })
      );
      expect(auth.client.sendVerificationCode).toHaveBeenCalledWith(
        "EMAIL",
        "ada@acme.com"
      );
      expect(await screen.findByTestId("location")).toHaveTextContent(
        "/sign-in/code"
      );
    });

    it("hides GitHub when the server gives no client id", () => {
      renderScreen(<SignInPage />, {
        ...at,
        capabilities: {
          ...cloudCapabilities,
          auth: { ...cloudCapabilities.auth, github: undefined }
        }
      });
      expect(
        screen.queryByRole("button", { name: /GitHub/ })
      ).not.toBeInTheDocument();
    });
  });

  it("offers the code as an alternative when both password and code are on", async () => {
    const { user } = renderScreen(<SignInPage />, {
      ...at,
      capabilities: {
        ...communityCapabilities,
        auth: { methods: ["password", "email_code"], signup: "invite" }
      }
    });
    await user.click(
      screen.getByRole("button", { name: "Email me a sign-in code instead" })
    );
    expect(screen.getByLabelText("Work email")).toBeInTheDocument();
    expect(screen.queryByLabelText("Password")).not.toBeInTheDocument();
  });
});
