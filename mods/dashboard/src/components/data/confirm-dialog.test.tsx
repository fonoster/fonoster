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
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ConfirmDialog } from "./confirm-dialog";

const dialog = (confirmLabel?: string) => {
  const onConfirm = vi.fn();
  render(
    <ConfirmDialog
      open
      onOpenChange={() => undefined}
      title="Delete Claro?"
      description="It stops working right away."
      confirmLabel={confirmLabel}
      onConfirm={onConfirm}
    />
  );
  return onConfirm;
};

describe("ConfirmDialog", () => {
  it("deletes only after DELETE is typed", async () => {
    const user = userEvent.setup();
    const onConfirm = dialog();
    const button = screen.getByRole("button", { name: "Delete" });
    expect(button).toBeDisabled();
    await user.type(screen.getByLabelText(/to confirm/), "delete");
    expect(button).toBeDisabled();
    await user.clear(screen.getByLabelText(/to confirm/));
    await user.type(screen.getByLabelText(/to confirm/), "DELETE");
    await user.click(button);
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("asks for the word on Remove too", () => {
    dialog("Remove");
    expect(screen.getByLabelText(/to confirm/)).toBeInTheDocument();
  });

  it("keeps actions that don't delete one click", () => {
    dialog("Rotate");
    expect(screen.queryByLabelText(/to confirm/)).toBeNull();
    expect(screen.getByRole("button", { name: "Rotate" })).toBeEnabled();
  });
});
