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
import type { INumber, LinkTwilioRequest } from "@fonoster/types";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type RefObject
} from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { Alert } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { Field } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { PasswordInput } from "~/components/ui/password-input";
import { Segmented } from "~/components/ui/segmented";
import { Sheet, SheetContent } from "~/components/ui/sheet";
import { toast } from "~/components/ui/sonner";
import { errorMessage, grpcCode, GrpcCode } from "~/lib/errors";
import { useApplicationOptions, useSipAgentOptions } from "./lookups";
import { useAllNumbers, useLinkTwilio } from "./numbers.service";
import { RoutePicker } from "./route-picker";
import { formatNumber, routeLabel, toTelUrl, type Route } from "./routing";

type CredentialKind = "apiKey" | "authToken";

const CREDENTIAL_KINDS: { value: CredentialKind; label: string }[] = [
  { value: "apiKey", label: "API key" },
  { value: "authToken", label: "Auth Token" }
];

/** "+1 (809) 555-0100" → "+18095550100", or undefined when it isn't E.164. */
function toE164(input: string): string | undefined {
  const digits = toTelUrl(input.trim()).slice(4).replace(/^\+/, "");
  return /^[0-9]{6,15}$/.test(digits) ? `+${digits}` : undefined;
}

const schema = z
  .object({
    phoneNumber: z.string(),
    route: z
      .object({ kind: z.enum(["agent", "app", "sip"]), to: z.string() })
      .optional(),
    accountSid: z.string().trim(),
    credentialKind: z.enum(["apiKey", "authToken"]),
    apiKeySid: z.string().trim(),
    apiKeySecret: z.string(),
    authToken: z.string()
  })
  .superRefine((values, ctx) => {
    const fail = (path: string, message: string) =>
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: [path], message });
    if (!toE164(values.phoneNumber))
      fail(
        "phoneNumber",
        "Enter the number in E.164 format, e.g. +18095550100"
      );
    if (!values.route) fail("route", "Choose where calls go.");
    if (!values.accountSid.startsWith("AC"))
      fail("accountSid", "Enter an Account SID that starts with AC.");
    if (values.credentialKind === "apiKey") {
      if (!values.apiKeySid.startsWith("SK"))
        fail("apiKeySid", "Enter an API key SID that starts with SK.");
      if (!values.apiKeySecret)
        fail("apiKeySecret", "Enter the API key secret.");
    } else if (!values.authToken) {
      fail("authToken", "Enter the Auth Token.");
    }
  });

type Values = z.infer<typeof schema>;

const EMPTY: Values = {
  phoneNumber: "",
  route: undefined,
  accountSid: "",
  credentialKind: "apiKey",
  apiKeySid: "",
  apiKeySecret: "",
  authToken: ""
};

/** Where a failed link shows: on Number, on the credentials, or above the form. */
type Failure = { on: "number" | "credentials" | "form"; message: string };

const TWILIO_UNAVAILABLE = "Twilio is unavailable; try again";

/** Places the server's texts (sipnet twilioLinkErrorToGrpc.ts); keep them in step. */
function placeFailure(error: unknown): Failure {
  const message = (error as { message?: unknown })?.message;
  const text = typeof message === "string" ? message : "";
  if (text.includes("isn't in Twilio account"))
    return { on: "number", message: text };
  if (
    text.startsWith("Twilio didn't accept") ||
    text.startsWith("This Twilio key can't")
  )
    return { on: "credentials", message: text };
  if (grpcCode(error) === GrpcCode.UNAVAILABLE && text === TWILIO_UNAVAILABLE)
    return { on: "form", message: text };
  return { on: "form", message: errorMessage(error) };
}

/** A sentence about a number already in the workspace, which linking moves. */
function inWorkspaceWarning(
  number: INumber,
  route: string | undefined
): string {
  const where = [
    route && `routed to ${route}`,
    number.trunk?.name && `on the ${number.trunk.name} trunk`
  ]
    .filter(Boolean)
    .join(" ");
  return `This number is in your workspace${where ? `, ${where}` : ""}. Linking moves it to Twilio Trunk and the route you choose.`;
}

/** Hide the secret boxes from browsers' and password managers' autofill. */
const SECRET_INPUT = {
  autoComplete: "new-password",
  "data-1p-ignore": true,
  "data-lpignore": "true"
} as const;

/**
 * Link a number the user owns in Twilio: Fonoster sets up the trunk on both
 * sides and routes the number. The credentials live only in this form.
 */
export function LinkTwilioDrawer({
  open,
  onOpenChange,
  returnFocusTo
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The "Link number" menu's trigger: the menu item that opened this is gone by now. */
  returnFocusTo?: RefObject<HTMLElement | null>;
}) {
  const link = useLinkTwilio();
  const apps = useApplicationOptions();
  const sipAgents = useSipAgentOptions();
  const numbers = useAllNumbers();
  const appList = useMemo(() => apps.data ?? [], [apps.data]);
  const sipAgentList = useMemo(() => sipAgents.data ?? [], [sipAgents.data]);
  const credentialsLabelId = useId();
  const alertRef = useRef<HTMLDivElement>(null);
  const [failure, setFailure] = useState<Failure>();

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: EMPTY
  });
  const { errors } = form.formState;
  const credentialKind = form.watch("credentialKind");
  const phoneNumber = form.watch("phoneNumber");

  // Start empty each time, and drop the secret when the drawer closes.
  useEffect(() => {
    form.reset(EMPTY);
    link.reset();
    setFailure(undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (failure?.on === "number") form.setFocus("phoneNumber");
    else if (failure?.on === "credentials")
      form.setFocus(credentialKind === "apiKey" ? "apiKeySid" : "authToken");
    else if (failure?.on === "form") alertRef.current?.focus();
    // Focus once per failure, not when the credential kind changes after it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [failure]);

  const nameRoute = (route: Route) =>
    routeLabel(
      route.kind === "sip" ? { agentAor: route.to } : { appRef: route.to },
      appList,
      sipAgentList
    )?.label ?? route.to;

  const e164 = toE164(phoneNumber);
  const existing = e164
    ? (numbers.data ?? []).find((n) => n.telUrl === `tel:${e164}`)
    : undefined;

  const onSubmit = form.handleSubmit(async (values) => {
    setFailure(undefined);
    const route = values.route!;
    const telUrl = toTelUrl(toE164(values.phoneNumber)!);
    const request: LinkTwilioRequest = {
      phoneNumber: telUrl.slice(4),
      ...(route.kind === "sip" ? { agentAor: route.to } : { appRef: route.to }),
      credentials:
        values.credentialKind === "apiKey"
          ? {
              accountSid: values.accountSid,
              apiKeySid: values.apiKeySid,
              apiKeySecret: values.apiKeySecret
            }
          : { accountSid: values.accountSid, authToken: values.authToken }
    };
    try {
      await link.mutateAsync(request);
    } catch (error) {
      setFailure(placeFailure(error));
      return;
    }
    toast.success(
      `${formatNumber(telUrl)} linked. Calls now go to ${nameRoute(route)}.`
    );
    onOpenChange(false);
  });

  const credentialsError =
    failure?.on === "credentials" ? failure.message : undefined;
  // The server's credential error marks every credential box; its text shows under the last.
  const credentialProps = (a11y: { "aria-invalid": boolean }) => ({
    ...a11y,
    "aria-invalid": a11y["aria-invalid"] || Boolean(credentialsError)
  });

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        // While linking, Esc, the close button and clicks outside keep it open.
        if (!next && link.isPending) return;
        onOpenChange(next);
      }}
    >
      <SheetContent
        title="Link Twilio number"
        description="Send calls to a number you own in Twilio."
        onCloseAutoFocus={(event) => {
          if (!returnFocusTo?.current) return;
          event.preventDefault();
          returnFocusTo.current.focus();
        }}
        footer={
          <>
            <span />
            <div className="flex gap-2.5">
              <Button
                variant="ghost"
                disabled={link.isPending}
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                form="link-twilio-form"
                loading={link.isPending}
              >
                {link.isPending ? "Linking…" : "Link number"}
              </Button>
            </div>
          </>
        }
      >
        <form id="link-twilio-form" onSubmit={onSubmit} noValidate>
          <fieldset
            disabled={link.isPending}
            className="flex flex-col gap-[22px]"
          >
            {failure?.on === "form" && (
              <Alert ref={alertRef} tabIndex={-1} variant="error">
                {failure.message}
              </Alert>
            )}
            <div className="flex flex-col gap-2.5">
              <Field
                label="Number"
                error={
                  errors.phoneNumber?.message ??
                  (failure?.on === "number" ? failure.message : undefined)
                }
                hint="In E.164 format, as it shows in Twilio."
              >
                {(a11y) => (
                  <Input
                    {...a11y}
                    {...form.register("phoneNumber")}
                    placeholder="+18095550100"
                    inputMode="tel"
                    autoComplete="off"
                  />
                )}
              </Field>
              {existing && (
                <Alert variant="warning">
                  {inWorkspaceWarning(
                    existing,
                    routeLabel(existing, appList, sipAgentList)?.label
                  )}
                </Alert>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Controller
                control={form.control}
                name="route"
                render={({ field }) => (
                  <RoutePicker
                    key={String(open)}
                    value={field.value}
                    onChange={field.onChange}
                    apps={appList}
                    sipAgents={sipAgentList}
                    numbers={numbers.data ?? []}
                    loading={apps.isPending || sipAgents.isPending}
                    error={apps.error ?? sipAgents.error}
                  />
                )}
              />
              {errors.route?.message && (
                <p
                  role="alert"
                  className="font-display text-[11px] text-destructive"
                >
                  {errors.route.message}
                </p>
              )}
            </div>
            <Field
              label="Twilio Account SID"
              error={errors.accountSid?.message}
            >
              {(a11y) => (
                <Input
                  {...a11y}
                  {...form.register("accountSid")}
                  autoComplete="off"
                  className="font-mono"
                />
              )}
            </Field>
            <div className="flex flex-col gap-2.5">
              <span
                id={credentialsLabelId}
                className="font-display text-xs text-foreground"
              >
                Credentials
              </span>
              <Controller
                control={form.control}
                name="credentialKind"
                render={({ field }) => (
                  <Segmented
                    labelledBy={credentialsLabelId}
                    options={CREDENTIAL_KINDS}
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            </div>
            {credentialKind === "apiKey" ? (
              <>
                <Field label="API key SID" error={errors.apiKeySid?.message}>
                  {(a11y) => (
                    <Input
                      {...credentialProps(a11y)}
                      {...form.register("apiKeySid")}
                      autoComplete="off"
                      className="font-mono"
                    />
                  )}
                </Field>
                <Field
                  label="API key secret"
                  error={errors.apiKeySecret?.message ?? credentialsError}
                >
                  {(a11y) => (
                    <PasswordInput
                      {...credentialProps(a11y)}
                      {...form.register("apiKeySecret")}
                      {...SECRET_INPUT}
                      label="API key secret"
                    />
                  )}
                </Field>
              </>
            ) : (
              <Field
                label="Auth Token"
                error={errors.authToken?.message ?? credentialsError}
              >
                {(a11y) => (
                  <PasswordInput
                    {...credentialProps(a11y)}
                    {...form.register("authToken")}
                    {...SECRET_INPUT}
                    label="Auth Token"
                  />
                )}
              </Field>
            )}
            <div className="flex flex-col gap-2">
              <Alert variant="note">
                Use a Standard API key or your Auth Token.
              </Alert>
              <Alert variant="note">
                Fonoster uses these once to link this number, then discards
                them.
              </Alert>
              <Alert variant="note">
                Linking sends all of this number's calls to Fonoster through a
                SIP trunk in your Twilio account.
              </Alert>
            </div>
          </fieldset>
        </form>
      </SheetContent>
    </Sheet>
  );
}
