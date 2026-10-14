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
import { act, screen } from "@testing-library/react";
import { GrpcCode } from "~/lib/errors";
import { fakeAuth, grpcError, renderScreen } from "~/test/render";
import CheckEmailPage from "./check-email.page";

const route = (auth = fakeAuth(), sentAt = Date.now()) => ({
  path: "/sign-in/code",
  state: { email: "ada@acme.com", next: "/workspaces", sentAt },
  auth
});

describe("CheckEmailPage", () => {
  it("sends the user back to sign-in without an email", async () => {
    renderScreen(<CheckEmailPage />, { path: "/sign-in/code" });
    expect(await screen.findByTestId("location")).toHaveTextContent("/sign-in");
  });

  it("signs in when the 6th digit is typed", async () => {
    const auth = fakeAuth();
    const { user } = renderScreen(<CheckEmailPage />, route(auth));
    await user.type(screen.getByLabelText("Sign-in code"), "123456");
    expect(auth.signInWithCode).toHaveBeenCalledWith("ada@acme.com", "123456");
    expect(await screen.findByTestId("location")).toHaveTextContent(
      "/workspaces"
    );
  });

  it("explains a wrong code and clears it", async () => {
    const auth = fakeAuth({
      signInWithCode: vi
        .fn()
        .mockRejectedValue(grpcError(GrpcCode.PERMISSION_DENIED))
    });
    const { user } = renderScreen(<CheckEmailPage />, route(auth));
    await user.type(screen.getByLabelText("Sign-in code"), "000000");
    expect(
      await screen.findByText(/That code isn't valid/)
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Sign-in code")).toHaveValue("");
  });

  it("explains the attempt limit", async () => {
    const auth = fakeAuth({
      signInWithCode: vi
        .fn()
        .mockRejectedValue(grpcError(GrpcCode.RESOURCE_EXHAUSTED))
    });
    const { user } = renderScreen(<CheckEmailPage />, route(auth));
    await user.type(screen.getByLabelText("Sign-in code"), "000000");
    expect(await screen.findByText(/Too many attempts/)).toBeInTheDocument();
  });

  it("waits 30 seconds before offering a resend", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      const auth = fakeAuth();
      renderScreen(<CheckEmailPage />, route(auth));
      expect(screen.getByText("Resend in 0:30")).toBeInTheDocument();
      await act(async () => {
        vi.advanceTimersByTime(31_000);
      });
      act(() => screen.getByRole("button", { name: "Resend code" }).click());
      expect(auth.client.sendVerificationCode).toHaveBeenCalledWith(
        "EMAIL",
        "ada@acme.com"
      );
    } finally {
      vi.useRealTimers();
    }
  });
});
