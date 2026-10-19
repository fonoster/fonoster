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
import type { INumber } from "@fonoster/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { Alert } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { Field } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { Select } from "~/components/ui/select";
import { Sheet, SheetContent } from "~/components/ui/sheet";
import { errorMessage } from "~/lib/errors";
import { useAllTrunks } from "~/trunks/trunks.service";
import { COUNTRY_OPTIONS, countryName } from "./countries";
import { useApplicationOptions, useSipAgentOptions } from "./lookups";
import {
  useAllNumbers,
  useCreateNumber,
  useUpdateNumber
} from "./numbers.service";
import { RoutePicker } from "./route-picker";
import {
  formatLocation,
  formatNumber,
  routeOf,
  toTelUrl,
  type Route
} from "./routing";

const route = z.object({
  kind: z.enum(["agent", "app", "sip"]),
  to: z.string().min(1)
});

const editSchema = z.object({
  name: z.string().trim().min(1, "Enter a name"),
  telUrl: z.string(),
  city: z.string(),
  countryIsoCode: z.string(),
  trunkRef: z.string(),
  route: route.optional()
});

const createSchema = editSchema.extend({
  telUrl: z
    .string()
    .trim()
    .refine(
      (value) => /^\+?[0-9]{6,15}$/.test(toTelUrl(value).slice(4)),
      "Enter the number in E.164 format, e.g. +18095550100"
    ),
  city: z.string().trim().min(1, "Enter the city"),
  countryIsoCode: z.string().length(2, "Choose the country")
});

type Values = z.infer<typeof editSchema>;

const EMPTY: Values = {
  name: "",
  telUrl: "",
  city: "",
  countryIsoCode: "",
  trunkRef: "",
  route: undefined
};

/** Add a number, or change its name, routing and trunk. */
export function NumberDrawer({
  open,
  onOpenChange,
  number,
  onDelete
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The number to edit; adds a new one when absent. */
  number?: INumber;
  onDelete?: (number: INumber) => void;
}) {
  const create = useCreateNumber();
  const update = useUpdateNumber();
  const mutation = number ? update : create;
  const apps = useApplicationOptions();
  const sipAgents = useSipAgentOptions();
  const numbers = useAllNumbers();
  const trunks = useAllTrunks();
  const appList = useMemo(() => apps.data ?? [], [apps.data]);

  const form = useForm<Values>({
    resolver: zodResolver(number ? editSchema : createSchema),
    defaultValues: EMPTY
  });
  const { errors } = form.formState;

  useEffect(() => {
    if (!open) return;
    form.reset(
      number
        ? {
            ...EMPTY,
            name: number.name,
            trunkRef: number.trunk?.ref ?? "",
            route: routeOf(number, appList)
          }
        : EMPTY
    );
    create.reset();
    update.reset();
    // Reset when the drawer opens for a (different) number.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, number?.ref]);

  // Apps load after the drawer opens: refine agent vs stream then.
  useEffect(() => {
    if (!open || !number) return;
    const current = form.getValues("route");
    const loaded = routeOf(number, appList);
    if (current && loaded && current.to === loaded.to)
      form.setValue("route", loaded);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appList]);

  const trunkOptions = (trunks.data ?? []).map((t) => ({
    value: t.ref,
    label: t.name
  }));

  const routing = (value?: Route) =>
    value
      ? value.kind === "sip"
        ? { agentAor: value.to }
        : { appRef: value.to }
      : {};

  const onSubmit = form.handleSubmit(async (values) => {
    if (number) {
      await update.mutateAsync({
        ref: number.ref,
        name: values.name,
        ...(values.trunkRef ? { trunkRef: values.trunkRef } : {}),
        ...routing(values.route)
      });
    } else {
      await create.mutateAsync({
        name: values.name,
        telUrl: toTelUrl(values.telUrl),
        city: values.city,
        country: countryName(values.countryIsoCode),
        countryIsoCode: values.countryIsoCode,
        ...(values.trunkRef ? { trunkRef: values.trunkRef } : {}),
        ...routing(values.route)
      });
    }
    onOpenChange(false);
  });

  const description = number
    ? [
        number.trunk?.name && `${number.trunk.name} trunk`,
        formatLocation(number)
      ]
        .filter(Boolean)
        .join(" · ")
    : "Bring a number from one of your trunks and choose where its calls go.";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        title={number ? formatNumber(number.telUrl) : "New number"}
        description={description}
        footer={
          <>
            {number && onDelete ? (
              <button
                type="button"
                className="cursor-pointer font-display text-[13px] text-destructive hover:underline"
                onClick={() => onDelete(number)}
              >
                Remove number
              </button>
            ) : (
              <span />
            )}
            <div className="flex gap-2.5">
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                form="number-form"
                loading={mutation.isPending}
              >
                {number ? "Save" : "Create number"}
              </Button>
            </div>
          </>
        }
      >
        <form
          id="number-form"
          onSubmit={onSubmit}
          className="flex flex-col gap-[22px]"
          noValidate
        >
          {mutation.error && (
            <Alert variant="error">{errorMessage(mutation.error)}</Alert>
          )}
          {!number && (
            <Field
              label="Number"
              error={errors.telUrl?.message}
              hint="In E.164 format, as your carrier sends it."
            >
              {(a11y) => (
                <Input
                  {...a11y}
                  {...form.register("telUrl")}
                  placeholder="+18095550100"
                  inputMode="tel"
                  autoComplete="off"
                />
              )}
            </Field>
          )}
          <Field label="Name" error={errors.name?.message}>
            {(a11y) => (
              <Input
                {...a11y}
                {...form.register("name")}
                placeholder="Support desk"
                autoComplete="off"
              />
            )}
          </Field>
          <Controller
            control={form.control}
            name="route"
            render={({ field }) => (
              <RoutePicker
                key={`${open}-${number?.ref ?? "new"}`}
                value={field.value}
                onChange={field.onChange}
                apps={appList}
                sipAgents={sipAgents.data ?? []}
                numbers={numbers.data ?? []}
                currentRef={number?.ref}
                loading={apps.isPending || sipAgents.isPending}
                error={apps.error ?? sipAgents.error}
              />
            )}
          />
          <Field
            label="Trunk"
            error={errors.trunkRef?.message}
            hint={
              trunks.isSuccess && trunkOptions.length === 0
                ? "No trunks yet. Add one under Trunks."
                : undefined
            }
          >
            {(a11y) => (
              <Controller
                control={form.control}
                name="trunkRef"
                render={({ field }) => (
                  <Select
                    {...a11y}
                    value={field.value}
                    onValueChange={field.onChange}
                    options={trunkOptions}
                    placeholder={
                      trunks.isPending ? "Loading…" : "Choose a trunk"
                    }
                  />
                )}
              />
            )}
          </Field>
          {number ? (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Number">
                {(a11y) => (
                  <Input
                    {...a11y}
                    value={formatNumber(number.telUrl)}
                    readOnly
                    disabled
                  />
                )}
              </Field>
              <Field label="Location">
                {(a11y) => (
                  <Input
                    {...a11y}
                    value={formatLocation(number)}
                    readOnly
                    disabled
                  />
                )}
              </Field>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <Field label="City" error={errors.city?.message}>
                {(a11y) => (
                  <Input
                    {...a11y}
                    {...form.register("city")}
                    placeholder="Santo Domingo"
                    autoComplete="off"
                  />
                )}
              </Field>
              <Field label="Country" error={errors.countryIsoCode?.message}>
                {(a11y) => (
                  <Controller
                    control={form.control}
                    name="countryIsoCode"
                    render={({ field }) => (
                      <Select
                        {...a11y}
                        value={field.value}
                        onValueChange={field.onChange}
                        options={COUNTRY_OPTIONS}
                        placeholder="Choose…"
                      />
                    )}
                  />
                )}
              </Field>
            </div>
          )}
          <Alert variant="note">
            Routing lives on the number. An agent or stream can answer any
            number of numbers.
          </Alert>
        </form>
      </SheetContent>
    </Sheet>
  );
}
