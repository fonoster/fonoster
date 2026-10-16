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
import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "@storybook/test";
import type { IdTokenClaims } from "~/lib/jwt";
import { communityCapabilities } from "~/lib/fixtures";
import ForgotPasswordPage from "./forgot-password.page";
import ResetPasswordPage from "./reset-password.page";
import SetPasswordPage from "./set-password.page";
import SignUpPage from "./sign-up.page";

const meta = {
  title: "Auth/Password screens",
  parameters: { screen: { route: { path: "/" } } }
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const resetToken = btoa(
  JSON.stringify({ username: "pedro@acme.com", code: "123456" })
);

export const ForgotPassword: Story = { render: () => <ForgotPasswordPage /> };

export const ForgotPasswordSent: Story = {
  render: () => <ForgotPasswordPage />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByLabelText("Email"), "pedro@acme.com");
    await userEvent.click(
      canvas.getByRole("button", { name: "Send reset link" })
    );
    await expect(
      await canvas.findByText(/the link arrives in a minute/)
    ).toBeInTheDocument();
  }
};

export const ResetPassword: Story = {
  render: () => <ResetPasswordPage />,
  parameters: {
    screen: {
      route: {
        path: "/reset-password",
        url: `/reset-password?token=${resetToken}`
      }
    }
  }
};

export const ResetPasswordBrokenLink: Story = {
  render: () => <ResetPasswordPage />,
  parameters: {
    screen: {
      route: { path: "/reset-password", url: "/reset-password?token=broken" }
    }
  }
};

export const SetPassword: Story = {
  render: () => <SetPasswordPage />,
  parameters: {
    screen: {
      route: { path: "/" },
      auth: () => ({
        status: "signedIn",
        user: {
          sub: "u1",
          email: "maria@acme.com",
          accessKeyId: "US1",
          exp: 0,
          mustChangePassword: true
        } as IdTokenClaims
      })
    }
  }
};

export const SignUp: Story = {
  render: () => <SignUpPage />,
  parameters: {
    screen: {
      route: { path: "/" },
      capabilities: {
        ...communityCapabilities,
        auth: { methods: ["password"], signup: "open" }
      }
    }
  }
};
