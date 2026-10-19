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
import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Alert } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "~/components/ui/dialog";
import { errorMessage, useSessionMutation } from "./api";
import {
  blankStream,
  ConnectionFields,
  validateStream,
  type Draft,
  type SetDraft
} from "./streams";

/** Creates a stream from its name, URL and protocol, then opens it (like New agent). */
export function CreateStreamDialog({
  open,
  onOpenChange
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const navigate = useNavigate();
  const { workspaceRef } = useParams();
  const [app, setApp] = useState<Draft>(blankStream);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const create = useSessionMutation(
    (api, draft: Omit<Draft, "signingSecretHint">) => api.saveApp(draft),
    { success: "Stream created" }
  );
  const set: SetDraft = (key, value) => setApp((a) => ({ ...a, [key]: value }));

  useEffect(() => {
    if (!open) return;
    setApp(blankStream);
    setErrors({});
    create.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const found = validateStream(app);
    setErrors(found);
    if (Object.keys(found).length) return;
    const { signingSecretHint: _hint, ...rest } = app;
    create.mutate(rest, {
      onSuccess: (saved) => {
        onOpenChange(false);
        navigate(`/w/${workspaceRef}/streams/${saved.ref}`, {
          state: { secret: saved.signingSecret }
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>New stream</DialogTitle>
          <DialogDescription>
            The gateway dials this WebSocket URL for every call. You can change
            everything after.
          </DialogDescription>
        </DialogHeader>
        <form
          id="create-stream-form"
          onSubmit={submit}
          noValidate
          className="flex flex-col gap-5"
        >
          {create.error && (
            <Alert variant="error">{errorMessage(create.error)}</Alert>
          )}
          <ConnectionFields app={app} set={set} errors={errors} />
        </form>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="create-stream-form"
            loading={create.isPending}
          >
            Create stream
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
