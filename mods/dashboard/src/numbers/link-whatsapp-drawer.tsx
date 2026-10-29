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
import type {
  LinkWhatsAppRequest,
  LinkWhatsAppResponse
} from "@fonoster/types";
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
import { CopyField } from "~/components/data/copy-field";
import { Alert } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { Field } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { PasswordInput } from "~/components/ui/password-input";
import { Segmented } from "~/components/ui/segmented";
import { Sheet, SheetContent } from "~/components/ui/sheet";
import { errorMessage, grpcCode, GrpcCode } from "~/lib/errors";
import { useApplicationOptions, useSipAgentOptions } from "./lookups";
import { useAllNumbers, useLinkWhatsApp } from "./numbers.service";
import { RoutePicker } from "./route-picker";
import { formatNumber, routeLabel, toTelUrl, type Route } from "./routing";

type CredentialKind = "token" | "password";

const CREDENTIAL_KINDS: { value: CredentialKind; label: string }[] = [
  { value: "token", label: "Meta access token" },
  { value: "password", label: "SIP password" }
];

/** The docs section that walks through WhatsApp Manager, for the SIP password side. */
const REGISTER_GUIDE =
  "https://docs.fonoster.com/telephony/link-whatsapp#point-meta-at-fonoster";

/** "+52 (55) 1234-5678" → "+525512345678", or undefined when it isn't E.164. */
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
    name: z.string().trim(),
    credentialKind: z.enum(["token", "password"]),
    phoneNumberId: z.string().trim(),
    accessToken: z.string().trim(),
    sipPassword: z.string().trim()
  })
  .superRefine((values, ctx) => {
    const fail = (path: string, message: string) =>
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: [path], message });
    if (!values.route) fail("route", "Choose where calls go.");
    if (values.credentialKind === "token") {
      if (!/^[0-9]{5,32}$/.test(values.phoneNumberId))
        fail(
          "phoneNumberId",
          "Enter the phone number ID from WhatsApp Manager."
        );
      if (!values.accessToken) fail("accessToken", "Enter the access token.");
    } else if (!toE164(values.phoneNumber)) {
      fail(
        "phoneNumber",
        "Enter the number in E.164 format, e.g. +525512345678"
      );
    }
  });

type Values = z.infer<typeof schema>;

const EMPTY: Values = {
  phoneNumber: "",
  route: undefined,
  name: "",
  credentialKind: "token",
  phoneNumberId: "",
  accessToken: "",
  sipPassword: ""
};

/** Where a failed link shows: on a field, or above the form. */
type Failure = {
  on: "number" | "phoneNumberId" | "accessToken" | "form";
  message: string;
};

const META_UNAVAILABLE = "Meta is unavailable; try again";

/** Places the server's texts (sipnet linkWhatsApp.ts, whatsAppLinkErrorToGrpc.ts); keep them in step. */
function placeFailure(error: unknown, kind: CredentialKind): Failure {
  const message = (error as { message?: unknown })?.message;
  const text = typeof message === "string" ? message : "";
  if (text.includes("didn't accept this access token"))
    return { on: "accessToken", message: text };
  if (text.includes("No WhatsApp number with id"))
    return { on: "phoneNumberId", message: text };
  if (text.includes("is already linked in another workspace"))
    return { on: kind === "password" ? "number" : "form", message: text };
  if (grpcCode(error) === GrpcCode.UNAVAILABLE && text === META_UNAVAILABLE)
    return { on: "form", message: text };
  return { on: "form", message: errorMessage(error) };
}

/** Hide the secret boxes from browsers' and password managers' autofill. */
const SECRET_INPUT = {
  autoComplete: "new-password",
  "data-1p-ignore": true,
  "data-lpignore": "true"
} as const;

type Done = { response: LinkWhatsAppResponse; route: string };

/**
 * Link a WhatsApp Business number. With a Meta access token Fonoster turns on
 * SIP calling in Meta too; with the SIP password the user registers the SIP
 * server in WhatsApp Manager. The token and the password live only in this
 * form.
 */
export function LinkWhatsAppDrawer({
  open,
  onOpenChange,
  returnFocusTo
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The "Link number" menu's trigger: the menu item that opened this is gone by now. */
  returnFocusTo?: RefObject<HTMLElement | null>;
}) {
  const link = useLinkWhatsApp();
  const apps = useApplicationOptions();
  const sipAgents = useSipAgentOptions();
  const numbers = useAllNumbers();
  const appList = useMemo(() => apps.data ?? [], [apps.data]);
  const sipAgentList = useMemo(() => sipAgents.data ?? [], [sipAgents.data]);
  const credentialsLabelId = useId();
  const alertRef = useRef<HTMLDivElement>(null);
  const [failure, setFailure] = useState<Failure>();
  const [done, setDone] = useState<Done>();

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: EMPTY
  });
  const { errors } = form.formState;
  const credentialKind = form.watch("credentialKind");

  // Start empty each time, and drop the token and the password when the drawer closes.
  useEffect(() => {
    form.reset(EMPTY);
    link.reset();
    setFailure(undefined);
    setDone(undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (failure?.on === "number") form.setFocus("phoneNumber");
    else if (failure?.on === "phoneNumberId") form.setFocus("phoneNumberId");
    else if (failure?.on === "accessToken") form.setFocus("accessToken");
    else if (failure?.on === "form") alertRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [failure]);

  const nameRoute = (route: Route) =>
    routeLabel(
      route.kind === "sip" ? { agentAor: route.to } : { appRef: route.to },
      appList,
      sipAgentList
    )?.label ?? route.to;

  const onSubmit = form.handleSubmit(async (values) => {
    setFailure(undefined);
    const route = values.route!;
    const request: LinkWhatsAppRequest = {
      ...(values.credentialKind === "token"
        ? {
            phoneNumberId: values.phoneNumberId,
            accessToken: values.accessToken
          }
        : {
            phoneNumber: toE164(values.phoneNumber)!,
            ...(values.sipPassword ? { sipPassword: values.sipPassword } : {})
          }),
      ...(values.name ? { name: values.name } : {}),
      ...(route.kind === "sip" ? { agentAor: route.to } : { appRef: route.to })
    };
    let response: LinkWhatsAppResponse;
    try {
      response = await link.mutateAsync(request);
    } catch (error) {
      setFailure(placeFailure(error, values.credentialKind));
      return;
    }
    // The secrets have done their work; the Done state replaces the form.
    form.reset(EMPTY);
    setDone({ response, route: nameRoute(route) });
  });

  const fieldError = (on: Failure["on"]) =>
    failure?.on === on ? failure.message : undefined;

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
        title="Link WhatsApp number"
        description="Answer calls to your WhatsApp Business number."
        onCloseAutoFocus={(event) => {
          if (!returnFocusTo?.current) return;
          event.preventDefault();
          returnFocusTo.current.focus();
        }}
        footer={
          <>
            <span />
            {done ? (
              <Button onClick={() => onOpenChange(false)}>Done</Button>
            ) : (
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
                  form="link-whatsapp-form"
                  loading={link.isPending}
                >
                  {link.isPending ? "Linking…" : "Link number"}
                </Button>
              </div>
            )}
          </>
        }
      >
        {done ? (
          <DoneState {...done} />
        ) : (
          <form id="link-whatsapp-form" onSubmit={onSubmit} noValidate>
            <fieldset
              disabled={link.isPending}
              className="flex flex-col gap-[22px]"
            >
              {failure?.on === "form" && (
                <Alert ref={alertRef} tabIndex={-1} variant="error">
                  {failure.message}
                </Alert>
              )}
              {credentialKind === "password" && (
                <Field
                  label="Number"
                  error={errors.phoneNumber?.message ?? fieldError("number")}
                  hint="In E.164 format, as it shows in WhatsApp Manager."
                >
                  {(a11y) => (
                    <Input
                      {...a11y}
                      {...form.register("phoneNumber")}
                      placeholder="+525512345678"
                      inputMode="tel"
                      autoComplete="off"
                    />
                  )}
                </Field>
              )}
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
              <Field label="Name" error={errors.name?.message}>
                {(a11y) => (
                  <Input
                    {...a11y}
                    {...form.register("name")}
                    placeholder="Defaults to the phone number"
                    autoComplete="off"
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
              {credentialKind === "token" ? (
                <>
                  <Field
                    label="Phone number ID"
                    error={
                      errors.phoneNumberId?.message ??
                      fieldError("phoneNumberId")
                    }
                    hint="From WhatsApp Manager › Phone numbers, or the App Dashboard."
                  >
                    {(a11y) => (
                      <Input
                        {...a11y}
                        {...form.register("phoneNumberId")}
                        inputMode="numeric"
                        autoComplete="off"
                        className="font-mono"
                      />
                    )}
                  </Field>
                  <Field
                    label="Access token"
                    error={
                      errors.accessToken?.message ?? fieldError("accessToken")
                    }
                    hint="A System User token with whatsapp_business_management."
                  >
                    {(a11y) => (
                      <PasswordInput
                        {...a11y}
                        {...form.register("accessToken")}
                        {...SECRET_INPUT}
                        label="access token"
                      />
                    )}
                  </Field>
                </>
              ) : (
                <Field
                  label="SIP password"
                  error={errors.sipPassword?.message}
                  hint="Optional now. You can add it after you register the SIP server in WhatsApp Manager."
                >
                  {(a11y) => (
                    <PasswordInput
                      {...a11y}
                      {...form.register("sipPassword")}
                      {...SECRET_INPUT}
                      label="SIP password"
                    />
                  )}
                </Field>
              )}
              <div className="flex flex-col gap-2">
                {credentialKind === "token" ? (
                  <Alert variant="note">
                    Fonoster uses the token once to turn on SIP calling for this
                    number, point it at Fonoster and read the SIP password, then
                    discards it.
                  </Alert>
                ) : (
                  <Alert variant="note">
                    Fonoster calls no Meta API on this side. Register the SIP
                    server it gives you and set SRTP to SDES in Meta's call
                    settings; the guide shows how.
                  </Alert>
                )}
                <Alert variant="note">
                  A number already in your workspace moves to its WhatsApp trunk
                  and the route you choose.
                </Alert>
              </div>
            </fieldset>
          </form>
        )}
      </SheetContent>
    </Sheet>
  );
}

/** After a successful link: what was set up, and what is left to do in Meta, if anything. */
function DoneState({ response, route }: Done) {
  const number = formatNumber(toTelUrl(response.phoneNumber));
  const who = response.verifiedName
    ? `${number} (${response.verifiedName})`
    : number;
  return (
    <div className="flex flex-col gap-[22px]" data-testid="link-whatsapp-done">
      <p className="font-display text-[13px] text-foreground">
        {who} is linked to {route}.
      </p>
      {response.metaConfigured ? (
        <p className="font-display text-[13px] text-muted-foreground">
          SIP calling is on for this number in WhatsApp, pointed at{" "}
          <span className="font-mono text-foreground">
            {response.sipServerHostname}:{response.sipServerPort}
          </span>{" "}
          with SDES. Calls to it ring in Fonoster now.
        </p>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            <CopyField
              label="SIP server to register in WhatsApp Manager"
              value={response.sipServerHostname}
            />
            <p className="font-display text-[11px] text-text-secondary">
              Port {response.sipServerPort} · SRTP: SDES
            </p>
          </div>
          <p className="font-display text-[13px] text-muted-foreground">
            {response.sipPasswordSet
              ? "SIP password: set"
              : "SIP password: not set yet. Open Link number again with the password once you have it from Meta."}
          </p>
          <a
            href={REGISTER_GUIDE}
            target="_blank"
            rel="noreferrer"
            className="font-display text-[13px] text-foreground underline underline-offset-4 hover:text-primary"
          >
            How to register it in WhatsApp Manager
          </a>
        </>
      )}
    </div>
  );
}
