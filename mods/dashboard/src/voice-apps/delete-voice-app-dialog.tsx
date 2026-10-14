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
import type { Application } from "@fonoster/types";
import { ConfirmDialog } from "~/components/data/confirm-dialog";
import { useDeleteVoiceApp } from "./voice-apps.service";

/** Asks before deleting a voice app. */
export function DeleteVoiceAppDialog({
  app,
  onClose,
  onDeleted
}: {
  /** The app to delete; the dialog is open while set. */
  app?: Pick<Application, "ref" | "name">;
  onClose: () => void;
  onDeleted?: () => void;
}) {
  const remove = useDeleteVoiceApp();
  return (
    <ConfirmDialog
      open={Boolean(app)}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
          remove.reset();
        }
      }}
      title={`Delete ${app?.name ?? "voice app"}?`}
      description="Numbers pointing here stop answering until you route them elsewhere."
      pending={remove.isPending}
      error={remove.error}
      onConfirm={() =>
        app &&
        remove.mutate(app.ref, {
          onSuccess: () => {
            onClose();
            onDeleted?.();
          }
        })
      }
    />
  );
}
