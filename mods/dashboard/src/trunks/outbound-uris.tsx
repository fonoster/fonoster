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
import { Plus, Trash2 } from "lucide-react";
import {
  Controller,
  useFieldArray,
  type FieldErrors,
  type UseFormReturn
} from "react-hook-form";
import { Input } from "~/components/ui/input";
import { Select } from "~/components/ui/select";
import { Switch } from "~/components/ui/switch";
import { NEW_URI, TRANSPORTS, type TrunkValues } from "./trunk-form";

const TRANSPORT_OPTIONS = TRANSPORTS.map((t) => ({ value: t, label: t }));

/** Row cells keep the field look (fill and border) so they read as editable. */
const cellInput =
  "h-8 rounded-[6px] px-2.5 font-mono text-xs hover:border-ring/60";

/** The editable table of a trunk's outbound SIP URIs. */
export function OutboundUris({ form }: { form: UseFormReturn<TrunkValues> }) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "uris"
  });
  const errors = (form.formState.errors.uris ?? []) as FieldErrors<
    TrunkValues["uris"][number]
  >[];

  return (
    <section
      aria-labelledby="outbound-title"
      className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id="outbound-title" className="font-display text-sm font-medium">
          Outbound · Fonoster → carrier
        </h2>
        <button
          type="button"
          onClick={() => append({ ...NEW_URI, priority: fields.length + 1 })}
          className="flex cursor-pointer items-center gap-1 rounded-[6px] px-1.5 py-1 font-display text-[13px] text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Plus className="size-3.5" aria-hidden /> Add URI
        </button>
      </div>
      <p className="font-display text-xs text-muted-foreground">
        Fonoster tries enabled URIs by priority, then spreads load by weight.
      </p>
      {fields.length === 0 ? (
        <p className="rounded-control border border-dashed border-border px-4 py-6 text-center font-display text-[13px] text-muted-foreground">
          No outbound URIs. Calls can come in on this trunk but not go out.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-control border border-border">
          <table
            className="w-full min-w-[620px] border-collapse text-left"
            aria-label="Outbound URIs"
          >
            <thead>
              <tr className="h-8 bg-muted text-[10.5px] uppercase text-muted-foreground">
                <th scope="col" className="px-3 font-normal">
                  Host
                </th>
                <th scope="col" className="w-20 px-2 font-normal">
                  Port
                </th>
                <th scope="col" className="w-24 px-2 font-normal">
                  Transport
                </th>
                <th scope="col" className="w-28 px-2 font-normal">
                  User
                </th>
                <th scope="col" className="w-20 px-2 font-normal">
                  Priority
                </th>
                <th scope="col" className="w-20 px-2 font-normal">
                  Weight
                </th>
                <th scope="col" className="w-14 px-2 font-normal">
                  On
                </th>
                <th scope="col" className="w-10 px-2">
                  <span className="sr-only">Remove</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {fields.map((field, index) => {
                const row = `URI ${index + 1}`;
                const error = errors[index];
                const invalid = (key: keyof NonNullable<typeof error>) =>
                  Boolean(error?.[key]);
                const message = error
                  ? Object.entries(error)
                      .map(([key, value]) =>
                        value && typeof value === "object" && "message" in value
                          ? `${key}: ${String(value.message)}`
                          : null
                      )
                      .filter(Boolean)
                      .join(" · ")
                  : "";
                return [
                  <tr key={field.id} className="border-t border-border">
                    <td className="px-3 py-2">
                      <Input
                        aria-label={`Host, ${row}`}
                        aria-invalid={invalid("host")}
                        placeholder="sip.carrier.com"
                        className={cellInput}
                        {...form.register(`uris.${index}.host`)}
                      />
                    </td>
                    <td className="px-2 py-2">
                      <Input
                        aria-label={`Port, ${row}`}
                        aria-invalid={invalid("port")}
                        inputMode="numeric"
                        className={cellInput}
                        {...form.register(`uris.${index}.port`, {
                          valueAsNumber: true
                        })}
                      />
                    </td>
                    <td className="px-2 py-2">
                      <Controller
                        control={form.control}
                        name={`uris.${index}.transport`}
                        render={({ field: transport }) => (
                          <Select
                            aria-label={`Transport, ${row}`}
                            value={transport.value}
                            onValueChange={transport.onChange}
                            options={TRANSPORT_OPTIONS}
                            className={cellInput}
                          />
                        )}
                      />
                    </td>
                    <td className="px-2 py-2">
                      <Input
                        aria-label={`User, ${row}`}
                        placeholder="optional"
                        className={cellInput}
                        {...form.register(`uris.${index}.user`)}
                      />
                    </td>
                    <td className="px-2 py-2">
                      <Input
                        aria-label={`Priority, ${row}`}
                        aria-invalid={invalid("priority")}
                        inputMode="numeric"
                        className={cellInput}
                        {...form.register(`uris.${index}.priority`, {
                          valueAsNumber: true
                        })}
                      />
                    </td>
                    <td className="px-2 py-2">
                      <Input
                        aria-label={`Weight, ${row}`}
                        aria-invalid={invalid("weight")}
                        inputMode="numeric"
                        className={cellInput}
                        {...form.register(`uris.${index}.weight`, {
                          valueAsNumber: true
                        })}
                      />
                    </td>
                    <td className="px-2 py-2">
                      <Controller
                        control={form.control}
                        name={`uris.${index}.enabled`}
                        render={({ field: enabled }) => (
                          <Switch
                            aria-label={`Enabled, ${row}`}
                            checked={enabled.value}
                            onCheckedChange={enabled.onChange}
                          />
                        )}
                      />
                    </td>
                    <td className="px-2 py-2">
                      <button
                        type="button"
                        aria-label={`Remove ${row}`}
                        onClick={() => remove(index)}
                        className="flex size-8 cursor-pointer items-center justify-center rounded-[6px] text-muted-foreground outline-none hover:bg-accent hover:text-destructive focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </td>
                  </tr>,
                  message && (
                    <tr key={`${field.id}-error`}>
                      <td
                        colSpan={8}
                        role="alert"
                        className="px-3 pb-2 text-xs text-destructive"
                      >
                        {row}: {message}
                      </td>
                    </tr>
                  )
                ];
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
