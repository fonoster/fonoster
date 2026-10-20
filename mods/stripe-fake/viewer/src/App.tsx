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
import {
  CircleX,
  Coins,
  FastForward,
  FlaskConical,
  Gauge,
  Moon,
  Receipt,
  RotateCcw,
  Sun,
  Timer,
  Users,
  Webhook,
  type LucideIcon
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { control, useFakeState, type FakeState } from "./api";
import { date } from "./format";
import { CreditGrants } from "./screens/CreditGrants";
import { Customers } from "./screens/Customers";
import { Invoices } from "./screens/Invoices";
import { Meters } from "./screens/Meters";
import { Webhooks } from "./screens/Webhooks";
import { useTheme } from "./theme";

const SCREENS: { path: string; label: string; icon: LucideIcon }[] = [
  { path: "customers", label: "Customers", icon: Users },
  { path: "meters", label: "Meters", icon: Gauge },
  { path: "credit-grants", label: "Credit grants", icon: Coins },
  { path: "invoices", label: "Invoices", icon: Receipt },
  { path: "webhooks", label: "Webhooks", icon: Webhook }
];

/** `#/webhooks` and the like; the fake serves the viewer at `/` only. */
function useRoute(): string {
  const read = () => location.hash.replace(/^#\/?/, "") || "customers";
  const [route, setRoute] = useState(read);
  useEffect(() => {
    const on = () => setRoute(read());
    addEventListener("hashchange", on);
    return () => removeEventListener("hashchange", on);
  }, []);
  return route;
}

/** The test clock's time: the first test clock's, or the fake's own clock without one. */
const clockTime = (s: FakeState) =>
  (s.clocks[0]?.frozen_time as number | undefined) ?? s.now;

/** Seconds from a moment to the same day next month (UTC). */
function oneMonthFrom(seconds: number) {
  const d = new Date(seconds * 1000);
  const next = Date.UTC(
    d.getUTCFullYear(),
    d.getUTCMonth() + 1,
    d.getUTCDate(),
    d.getUTCHours(),
    d.getUTCMinutes(),
    d.getUTCSeconds()
  );
  return next / 1000 - seconds;
}

export function App() {
  const { state, error, live } = useFakeState();
  const route = useRoute();
  const [theme, setTheme] = useTheme();
  const [customerId, setCustomerId] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string>();

  const customer =
    state?.customers.find((c) => c.id === customerId) ?? state?.customers[0];
  const run = (action: () => Promise<unknown>) => {
    setBusy(true);
    setFailure(undefined);
    action()
      .catch((e: Error) => setFailure(e.message))
      .finally(() => setBusy(false));
  };

  let screen: ReactNode = null;
  if (state) {
    const props = { state, run, customer, selectCustomer: setCustomerId };
    if (route === "meters") screen = <Meters {...props} />;
    else if (route === "credit-grants") screen = <CreditGrants {...props} />;
    else if (route === "invoices") screen = <Invoices {...props} />;
    else if (route === "webhooks") screen = <Webhooks {...props} />;
    else screen = <Customers {...props} />;
  }
  const armed = customer && state?.control.nextPayment[customer.id as string];

  return (
    <div className="flex h-screen flex-col">
      <header className="flex h-14 flex-none items-center gap-4 border-b border-border bg-surface px-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-accent">
            <FlaskConical size={14} className="text-on-accent" />
          </div>
          <div className="flex items-end gap-[5px] text-lg leading-none">
            <span className="font-extrabold tracking-[-0.6px]">stripe</span>
            <span className="font-medium tracking-[-0.4px] text-accent">
              fake
            </span>
          </div>
          <span className="font-mono text-xs text-text-muted">
            {location.host}
          </span>
          <span
            title={live ? "Live: updates as the fake changes" : "Reconnecting…"}
            className={`h-1.5 w-1.5 rounded-full ${live ? "bg-accent" : "bg-danger"}`}
          />
        </div>
        <div className="flex-1" />
        <div
          role="radiogroup"
          aria-label="Theme"
          className="flex items-center gap-0.5 rounded-[7px] border border-border p-0.5"
        >
          {(
            [
              ["light", Sun, "Light"],
              ["dark", Moon, "Dark"]
            ] as const
          ).map(([value, Icon, label]) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={theme === value}
              aria-label={label}
              onClick={() => setTheme(value)}
              className={`flex h-6 w-7 cursor-pointer items-center justify-center rounded-[5px] ${theme === value ? "bg-muted text-accent" : "text-text-muted hover:text-text"}`}
            >
              <Icon size={14} />
            </button>
          ))}
        </div>
        {state && (
          <div className="flex items-center gap-2 rounded-md border border-border px-2.5 py-1.5 text-xs">
            <Timer size={14} className="text-text-muted" />
            Test clock: {date(clockTime(state))}
          </div>
        )}
        <button
          type="button"
          disabled={!state || busy}
          onClick={() =>
            run(() =>
              control("clock/advance", {
                seconds: oneMonthFrom(clockTime(state!))
              })
            )
          }
          className="flex cursor-pointer items-center gap-2 rounded-md bg-accent px-3.5 py-2 text-xs font-semibold text-on-accent hover:opacity-90 disabled:opacity-50"
        >
          <FastForward size={14} />
          Advance 1 month
        </button>
      </header>
      <div className="flex min-h-0 flex-1">
        <nav className="flex w-[220px] flex-none flex-col gap-0.5 border-r border-border bg-surface p-3">
          {SCREENS.map(({ path, label, icon: Icon }) => {
            const active =
              route === path ||
              (path === "customers" && !SCREENS.some((s) => s.path === route));
            return (
              <a
                key={path}
                href={`#/${path}`}
                className={`flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] no-underline ${active ? "bg-muted text-text" : "text-text-muted hover:text-text"}`}
              >
                <Icon size={15} />
                {label}
              </a>
            );
          })}
          <div className="flex-1" />
          <div className="flex flex-col gap-0.5 border-t border-border pt-2.5">
            <div className="px-2.5 py-1 text-[11px] uppercase tracking-wide text-text-muted">
              Control
            </div>
            <NavAction
              icon={CircleX}
              disabled={!customer || busy}
              title={
                customer
                  ? `The next payment of ${customer.id} is declined`
                  : "No customer yet"
              }
              onClick={() =>
                run(() =>
                  control(`customers/${customer!.id}/next_payment`, {
                    outcome: "decline"
                  })
                )
              }
            >
              {armed === "decline" ? "Next payment fails" : "Fail next payment"}
            </NavAction>
            <NavAction
              icon={RotateCcw}
              disabled={busy}
              onClick={() => run(() => control("reset"))}
            >
              Reset state
            </NavAction>
          </div>
        </nav>
        <main className="flex min-w-0 flex-1 flex-col gap-6 overflow-auto px-8 py-6">
          {(error || failure) && (
            <div
              role="alert"
              className="rounded-lg border border-border bg-surface px-4 py-3 text-[13px] text-danger"
            >
              {failure ?? `Can't reach the fake: ${error}`}
            </div>
          )}
          {screen}
        </main>
      </div>
    </div>
  );
}

function NavAction({
  icon: Icon,
  children,
  onClick,
  disabled,
  title
}: {
  icon: LucideIcon;
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className="flex cursor-pointer items-center gap-2.5 rounded-md bg-transparent px-2.5 py-2 text-left text-[13px] text-text-muted hover:text-text disabled:cursor-default disabled:opacity-50"
    >
      <Icon size={15} />
      {children}
    </button>
  );
}
