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
import type { Trunk } from "@fonoster/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState, type ReactNode } from "react";
import {
  Controller,
  useForm,
  useWatch,
  type UseFormReturn
} from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router-dom";
import { PageHeader } from "~/app/shell/page";
import { ConfirmDialog } from "~/components/data/confirm-dialog";
import {
  SIP_LABEL,
  SipNameInput,
  sipNameLabel,
  toSipLabel,
  useSipNameRule
} from "~/components/data/sip-name-input";
import { Alert } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { Field } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { Select } from "~/components/ui/select";
import { Skeleton } from "~/components/ui/skeleton";
import { Switch } from "~/components/ui/switch";
import { errorMessage, GrpcCode, grpcCode } from "~/lib/errors";
import { useAllNumbers } from "~/numbers/numbers.service";
import { CarrierHint } from "~/regions/connection";
import { formatNumber } from "~/numbers/routing";
import { OutboundUris } from "./outbound-uris";
import {
  NONE,
  toRequest,
  toValues,
  trunkSchema,
  type TrunkValues
} from "./trunk-form";
import {
  useAclOptions,
  useCreateTrunk,
  useCredentialsOptions,
  useDeleteTrunk,
  useTrunk,
  useUpdateTrunk
} from "./trunks.service";

/**
 * The inbound URI as a label plus the install's fixed `.sip.<domain>`, which
 * the API requires (features.trunks.inboundUri: domain). A new trunk's label
 * follows its name until edited. With `any`, it's a free host or IP.
 */
/**
 * The inbound URI as a label plus the install's fixed `.pstn.<domain>`, which
 * the API requires (features.sip.names: domain). A new trunk's label follows its
 * name until edited. With `any`, it's a free host or IP.
 */
function InboundUriField({
  form,
  isNew,
  previous
}: {
  form: UseFormReturn<TrunkValues>;
  isNew: boolean;
  /** The saved URI when it isn't under the root (a trunk made before the rule). */
  previous?: string;
}) {
  const { strict, suffix } = useSipNameRule("pstn");
  const [uri, name] = useWatch({
    control: form.control,
    name: ["inboundUri", "name"]
  });
  const [edited, setEdited] = useState(!isNew);
  const error = form.formState.errors.inboundUri?.message;

  useEffect(() => {
    if (!strict || edited) return;
    const label = toSipLabel(name ?? "");
    form.setValue("inboundUri", label ? label + suffix : "");
  }, [name, strict, edited, suffix, form]);

  if (!strict) {
    return (
      <Field
        label="Inbound URI"
        error={error}
        hint="Give this to your carrier: a host name or IP that reaches this install."
      >
        {(a11y) => (
          <Input
            {...a11y}
            {...form.register("inboundUri")}
            className="font-mono"
            placeholder={`acme${suffix}`}
            autoComplete="off"
            spellCheck={false}
          />
        )}
      </Field>
    );
  }

  const label = sipNameLabel(uri, suffix) ?? "";
  return (
    <Field
      label="Inbound URI"
      error={
        error && label && !SIP_LABEL.test(label)
          ? "Use lowercase letters, digits and dashes."
          : error
      }
      hint={
        previous
          ? `Was ${previous}. Saving moves it under ${suffix.slice(1)}; update your carrier.`
          : "Give this to your carrier."
      }
    >
      {(a11y) => (
        <SipNameInput
          {...a11y}
          value={uri}
          suffix={suffix}
          placeholder="acme"
          onChange={(next) => {
            setEdited(true);
            form.setValue("inboundUri", next, {
              shouldDirty: true,
              shouldValidate: form.formState.isSubmitted
            });
          }}
        />
      )}
    </Field>
  );
}

function Section({
  title,
  id,
  children
}: {
  title: string;
  id: string;
  children: ReactNode;
}) {
  return (
    <section
      aria-labelledby={id}
      className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5"
    >
      <h2 id={id} className="font-display text-sm font-medium">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Breadcrumb({ current }: { current: string }) {
  return (
    <nav aria-label="Breadcrumb" className="px-4 pt-6 sm:px-8">
      <ol className="flex items-center gap-2 font-display text-[13px] text-muted-foreground">
        <li>
          <Link to=".." relative="path" className="hover:text-foreground">
            Trunks
          </Link>
        </li>
        <li aria-hidden>/</li>
        <li aria-current="page" className="truncate text-foreground">
          {current}
        </li>
      </ol>
    </nav>
  );
}

/** `trunks/new` and `trunks/:ref`: a trunk's inbound, outbound and security settings. */
export function TrunkPage() {
  const { ref } = useParams();
  const trunk = useTrunk(ref);

  if (!ref) return <TrunkForm />;
  if (trunk.isPending) {
    return (
      <>
        <Breadcrumb current="…" />
        <div className="flex flex-col gap-4 px-4 py-6 sm:px-8">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-56 w-full" />
        </div>
      </>
    );
  }
  if (trunk.error || !trunk.data) {
    return (
      <>
        <Breadcrumb current={ref} />
        <div className="px-4 py-6 sm:px-8">
          <Alert variant="error">
            {trunk.error ? errorMessage(trunk.error) : "Trunk not found."}{" "}
            <button
              type="button"
              className="cursor-pointer underline"
              onClick={() => void trunk.refetch()}
            >
              Try again
            </button>
          </Alert>
        </div>
      </>
    );
  }
  return <TrunkForm key={trunk.data.ref} trunk={trunk.data} />;
}

function TrunkForm({ trunk }: { trunk?: Trunk }) {
  const navigate = useNavigate();
  const create = useCreateTrunk();
  const update = useUpdateTrunk();
  const remove = useDeleteTrunk();
  const mutation = trunk ? update : create;
  const acls = useAclOptions();
  const credentials = useCredentialsOptions();
  const numbers = useAllNumbers();
  const [deleting, setDeleting] = useState(false);

  const form = useForm<TrunkValues>({
    resolver: zodResolver(trunkSchema),
    defaultValues: toValues(trunk)
  });
  const { errors } = form.formState;

  const rule = useSipNameRule("pstn");
  // A trunk made before the inbound URI rule moves under the root on save.
  const previous =
    rule.strict &&
    trunk?.inboundUri &&
    sipNameLabel(trunk.inboundUri, rule.suffix) === undefined
      ? trunk.inboundUri
      : undefined;

  useEffect(() => {
    if (!trunk) return;
    form.reset(toValues(trunk));
    if (previous) {
      const label = toSipLabel(previous.split(".")[0] ?? "");
      form.setValue("inboundUri", label ? label + rule.suffix : "", {
        shouldDirty: true
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trunk]);

  const onTrunk = trunk
    ? (numbers.data ?? []).filter((n) => n.trunk?.ref === trunk.ref)
    : [];

  const none = { value: NONE, label: "None" };
  const aclOptions = [
    none,
    ...(acls.data ?? []).map((a) => ({ value: a.ref, label: a.name }))
  ];
  const credentialOptions = [
    none,
    ...(credentials.data ?? []).map((c) => ({
      value: c.ref,
      label: c.name,
      description: c.username
    }))
  ];

  const onSubmit = form.handleSubmit(async (values) => {
    const request = toRequest(values);
    try {
      if (trunk) {
        await update.mutateAsync({ ref: trunk.ref, ...request });
      } else {
        const created = await create.mutateAsync(request);
        navigate(`../${created.ref}`, { relative: "path", replace: true });
      }
    } catch (error) {
      // Inbound URIs are unique across the install.
      if (grpcCode(error) === GrpcCode.ALREADY_EXISTS)
        form.setError("inboundUri", {
          message: "That inbound URI is taken. Pick another."
        });
    }
  });

  const title = trunk ? trunk.name : "New trunk";
  const count = numbers.isSuccess
    ? `${onTrunk.length} ${onTrunk.length === 1 ? "number rides" : "numbers ride"} on this trunk`
    : undefined;

  const select = (
    name:
      | "accessControlListRef"
      | "inboundCredentialsRef"
      | "outboundCredentialsRef",
    label: string,
    options: typeof aclOptions,
    hint?: string
  ) => (
    <Field label={label} hint={hint}>
      {(a11y) => (
        <Controller
          control={form.control}
          name={name}
          render={({ field }) => (
            <Select
              {...a11y}
              value={field.value}
              onValueChange={field.onChange}
              options={options}
            />
          )}
        />
      )}
    </Field>
  );

  return (
    <>
      <Breadcrumb current={title} />
      <PageHeader
        title={title}
        description={
          trunk
            ? [trunk.ref, count].filter(Boolean).join(" · ")
            : "A connection to your carrier. Numbers ride on trunks."
        }
        actions={
          <>
            {trunk && (
              <Button variant="outline" onClick={() => setDeleting(true)}>
                Delete
              </Button>
            )}
            <Button
              type="submit"
              form="trunk-form"
              loading={mutation.isPending}
            >
              {trunk ? "Save" : "Create trunk"}
            </Button>
          </>
        }
      />
      <form
        id="trunk-form"
        onSubmit={onSubmit}
        noValidate
        className="grid gap-5 px-4 pb-8 sm:px-8 lg:grid-cols-[minmax(0,1fr)_340px]"
      >
        <div className="flex min-w-0 flex-col gap-5">
          {mutation.error && (
            <Alert variant="error">{errorMessage(mutation.error)}</Alert>
          )}
          <Section id="inbound-title" title="Inbound · carrier → Fonoster">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name" error={errors.name?.message}>
                {(a11y) => (
                  <Input
                    {...a11y}
                    {...form.register("name")}
                    placeholder="Acme"
                    autoComplete="off"
                  />
                )}
              </Field>
              <InboundUriField form={form} isNew={!trunk} previous={previous} />
            </div>
            <CarrierHint />
          </Section>
          <OutboundUris form={form} />
        </div>
        <div className="flex min-w-0 flex-col gap-5">
          <Section id="security-title" title="Security">
            {select(
              "accessControlListRef",
              "Access control list",
              aclOptions,
              "Only these IPs can send calls in."
            )}
            {select(
              "inboundCredentialsRef",
              "Inbound credentials",
              credentialOptions
            )}
            {select(
              "outboundCredentialsRef",
              "Outbound credentials",
              credentialOptions
            )}
            <Controller
              control={form.control}
              name="sendRegister"
              render={({ field }) => (
                <div className="flex items-center justify-between gap-4">
                  <div className="flex flex-col gap-0.5">
                    <label
                      htmlFor="send-register"
                      className="font-display text-[13px] text-foreground"
                    >
                      Send REGISTER
                    </label>
                    <span
                      id="send-register-hint"
                      className="text-xs text-muted-foreground"
                    >
                      Only if your carrier requires registration
                    </span>
                  </div>
                  <Switch
                    id="send-register"
                    aria-describedby="send-register-hint"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </div>
              )}
            />
          </Section>
          {trunk && (
            <Section id="numbers-title" title="Numbers on this trunk">
              {numbers.isPending ? (
                <Skeleton className="h-4 w-32" />
              ) : numbers.error ? (
                <p className="text-[13px] text-destructive">
                  {errorMessage(numbers.error)}
                </p>
              ) : onTrunk.length === 0 ? (
                <p className="font-display text-[13px] text-muted-foreground">
                  No numbers use this trunk yet.
                </p>
              ) : (
                <ul className="flex flex-col gap-2 text-[13px]">
                  {onTrunk.map((n) => (
                    <li key={n.ref} className="flex justify-between gap-3">
                      <span className="font-mono">
                        {formatNumber(n.telUrl)}
                      </span>
                      <span className="truncate text-muted-foreground">
                        {n.name}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Section>
          )}
        </div>
      </form>
      {trunk && (
        <ConfirmDialog
          open={deleting}
          onOpenChange={(open) => {
            setDeleting(open);
            if (!open) remove.reset();
          }}
          title={`Delete ${trunk.name}?`}
          description={
            onTrunk.length > 0
              ? `${onTrunk.length} ${onTrunk.length === 1 ? "number uses" : "numbers use"} this trunk and will stop receiving calls through it.`
              : "Calls to and from this carrier will stop."
          }
          pending={remove.isPending}
          error={remove.error}
          onConfirm={() =>
            remove.mutate(trunk.ref, {
              onSuccess: () => navigate("..", { relative: "path" })
            })
          }
        />
      )}
    </>
  );
}
