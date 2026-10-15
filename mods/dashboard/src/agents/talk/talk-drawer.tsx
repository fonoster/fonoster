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
import { Info, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import { CopyField } from "~/components/data/copy-field";
import { Alert } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { Sheet, SheetContent } from "~/components/ui/sheet";
import { useWorkspace } from "~/lib/workspace";
import { useAllNumbers } from "../agents.service";

/**
 * Talk to the saved agent by calling one of its numbers. In-browser calls (WebRTC) are not
 * available on the new voice path: the media node speaks plain SIP/RTP (no DTLS or ICE), so the
 * drawer points at the agent's phone numbers instead.
 */
export function TalkDrawer({
  open,
  onOpenChange,
  appRef,
  name,
  dirty
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appRef: string;
  name: string;
  /** The editor has unsaved changes the call won't use. */
  dirty: boolean;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        title={`Talk to ${name}`}
        description="Call one of its numbers"
        className="max-w-[440px]"
      >
        {open && <TalkBody appRef={appRef} dirty={dirty} />}
      </SheetContent>
    </Sheet>
  );
}

const display = (telUrl: string) => telUrl.replace(/^tel:/, "");

function TalkBody({ appRef, dirty }: { appRef: string; dirty: boolean }) {
  const workspace = useWorkspace();
  const numbers = useAllNumbers();
  const linked = (numbers.data ?? []).filter((n) => n.appRef === appRef);

  return (
    <>
      {dirty && (
        <Alert variant="warning">
          You have unsaved changes. Save first: calls reach the saved version.
        </Alert>
      )}

      <section
        aria-label="Call this number"
        className="flex flex-col gap-4 rounded-xl border border-border bg-background px-5 py-6"
      >
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Phone className="size-4" aria-hidden />
          </span>
          <p className="font-display text-base font-medium">Call this number</p>
        </div>

        {numbers.isPending ? (
          <p className="font-display text-sm text-muted-foreground">
            Loading numbers…
          </p>
        ) : numbers.isError ? (
          <Alert variant="error">Couldn't load this agent's numbers.</Alert>
        ) : linked.length > 0 ? (
          <div className="flex flex-col gap-3">
            {linked.map((n) => (
              <CopyField
                key={n.ref}
                label={n.name || "Number"}
                value={display(n.telUrl)}
              />
            ))}
            <p className="font-display text-xs text-muted-foreground">
              Calls to these numbers reach the saved version of the agent.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="font-display text-sm text-muted-foreground">
              No phone number is linked to this agent yet. Link one to call it.
            </p>
            <Button asChild variant="outline">
              <Link to={`/w/${workspace.ref}/numbers`}>Go to Numbers</Link>
            </Button>
          </div>
        )}
      </section>

      <p className="flex gap-2 font-display text-xs text-muted-foreground">
        <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        In-browser calls are not available yet. On the local stack, call the
        number from a softphone registered to the demo domain (see "Try the new
        platform" in the docs).
      </p>
    </>
  );
}
