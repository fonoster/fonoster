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
import type { AuthContextValue } from "~/lib/auth";
import { expect, userEvent, within } from "@storybook/test";
import { GrpcCode } from "~/lib/errors";
import { communityCapabilities } from "~/lib/fixtures";
import { grpcError } from "~/test/fake-auth";
import { markInviteInFlight } from "./invite";
import SignInPage from "./sign-in.page";

const meta = {
  title: "Auth/Sign in",
  component: SignInPage,
  parameters: { screen: { route: { path: "/sign-in" } } }
} satisfies Meta<typeof SignInPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Community: Story = { globals: { variant: "community" } };

export const CommunityLight: Story = {
  globals: { variant: "community", theme: "light" }
};

export const Cloud: Story = { globals: { variant: "cloud" } };

export const CloudLight: Story = {
  globals: { variant: "cloud", theme: "light" }
};

export const OpenSignUp: Story = {
  parameters: {
    screen: {
      route: { path: "/sign-in" },
      capabilities: {
        ...communityCapabilities,
        auth: { methods: ["password"], signup: "open" }
      }
    }
  }
};

export const PasswordOrCode: Story = {
  parameters: {
    screen: {
      route: { path: "/sign-in" },
      capabilities: {
        ...communityCapabilities,
        auth: { methods: ["password", "email_code"], signup: "invite" }
      }
    }
  }
};

export const Invited: Story = {
  beforeEach: () => {
    markInviteInFlight();
    return () => sessionStorage.clear();
  }
};

export const InvalidCredentials: Story = {
  parameters: {
    screen: {
      route: { path: "/sign-in" },
      auth: (auth: AuthContextValue) => {
        (
          auth.signInWithPassword as unknown as {
            mockRejectedValue(e: unknown): void;
          }
        ).mockRejectedValue(grpcError(GrpcCode.PERMISSION_DENIED));
      }
    }
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByLabelText("Email"), "pedro@acme.com");
    await userEvent.type(canvas.getByLabelText("Password"), "wrong-password");
    await userEvent.click(canvas.getByRole("button", { name: "Sign in" }));
    await expect(
      await canvas.findByText("Invalid credentials")
    ).toBeInTheDocument();
  }
};
