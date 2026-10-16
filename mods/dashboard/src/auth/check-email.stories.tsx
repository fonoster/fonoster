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
import { grpcError } from "~/test/fake-auth";
import CheckEmailPage from "./check-email.page";

const route = {
  path: "/sign-in/code",
  state: { email: "pedro@acme.com", next: "/" }
};

const meta = {
  title: "Auth/Check email",
  component: CheckEmailPage,
  parameters: { screen: { route } }
} satisfies Meta<typeof CheckEmailPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Light: Story = { globals: { theme: "light" } };

export const WrongCode: Story = {
  parameters: {
    screen: {
      route,
      auth: (auth: AuthContextValue) => {
        (
          auth.signInWithCode as unknown as {
            mockRejectedValue(e: unknown): void;
          }
        ).mockRejectedValue(grpcError(GrpcCode.PERMISSION_DENIED));
      }
    }
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByLabelText("Sign-in code"), "000000");
    await expect(
      await canvas.findByText(/That code isn't valid/)
    ).toBeInTheDocument();
  }
};
