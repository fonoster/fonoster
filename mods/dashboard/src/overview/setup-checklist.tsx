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
  ArrowUpRight,
  BookOpen,
  Check,
  MessagesSquare,
  Server
} from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { DOCS_URL, SUPPORT_URL } from "~/app/shell/nav";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { cn } from "~/lib/utils";
import { useWorkspace } from "~/lib/workspace";
import type { Setup } from "./overview.service";

const RESOURCES = [
  {
    icon: BookOpen,
    title: "Quickstart",
    description: "Your first agent in 10 minutes",
    href: `${DOCS_URL}quickstart`
  },
  {
    icon: Server,
    title: "Self-host Fonoster",
    description: "Run the whole stack on your servers",
    href: `${DOCS_URL}self-hosting/overview`
  },
  {
    icon: MessagesSquare,
    title: "Community",
    description: "Ask on Discord",
    href: SUPPORT_URL
  }
];

type Step = {
  title: string;
  description: string;
  done: boolean;
  /** The step's button; primary on the next step to do, outlined on the others. */
  action: (primary: boolean) => ReactNode;
};

/**
 * The Overview of a workspace with no calls yet: four steps to a first call, the
 * next one highlighted with the primary action, then links to the docs.
 */
export function SetupChecklist({
  setup,
  loading,
  onCreateAgent
}: {
  setup?: Setup;
  loading: boolean;
  onCreateAgent: () => void;
}) {
  const base = `/w/${useWorkspace().ref}`;
  if (loading || !setup) return <Skeleton className="h-96 rounded-xl" />;

  const steps: Step[] = [
    {
      title: "Create an agent or app",
      description: "An AI agent, or your own code connected over a stream.",
      done: setup.hasApp,
      action: (primary) => (
        <Button
          variant={primary ? "default" : "outline"}
          onClick={onCreateAgent}
        >
          Create agent
        </Button>
      )
    },
    {
      title: "Connect a trunk",
      description:
        "Bring your carrier (Twilio, Telnyx, your local operator…) so you have numbers to use.",
      done: setup.hasTrunk,
      action: (primary) => (
        <ActionLink primary={primary} to={`${base}/trunks/new`}>
          Create trunk
        </ActionLink>
      )
    },
    {
      title: "Point a number at your agent",
      description: "Add a number from that trunk and choose what answers it.",
      done: setup.hasRoutedNumber,
      action: (primary) => (
        <ActionLink primary={primary} to={`${base}/numbers?new=1`}>
          Create number
        </ActionLink>
      )
    },
    {
      title: "Make a test call",
      description: "Talk to your agent from the browser, or call its number.",
      done: false,
      action: (primary) =>
        setup.agentRef ? (
          <ActionLink
            primary={primary}
            to={`${base}/agents/${setup.agentRef}/configure?talk=1`}
          >
            Talk to agent
          </ActionLink>
        ) : null
    }
  ];
  const next = steps.findIndex((s) => !s.done);

  return (
    <div className="flex flex-col gap-5">
      <ol aria-label="Steps to your first call" className="flex flex-col gap-3">
        {steps.map((step, i) => (
          <li
            key={step.title}
            aria-current={i === next ? "step" : undefined}
            className={cn(
              "flex items-center gap-4 rounded-xl border bg-card px-5 py-5",
              i === next ? "border-foreground" : "border-border"
            )}
          >
            <span
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-full text-xs",
                step.done
                  ? "bg-brand-subtle text-brand-text"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {step.done ? (
                <Check className="size-4" aria-label="Done" />
              ) : (
                i + 1
              )}
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <h2
                className={cn(
                  "text-[15px] font-medium",
                  step.done && "text-muted-foreground"
                )}
              >
                {step.title}
              </h2>
              <p className="text-[13px] text-muted-foreground">
                {step.description}
              </p>
            </div>
            {!step.done && step.action(i === next)}
          </li>
        ))}
      </ol>
      <ul aria-label="Resources" className="grid gap-4 md:grid-cols-3">
        {RESOURCES.map(({ icon: Icon, title, description, href }) => (
          <li key={title}>
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 rounded-xl border border-border bg-card px-5 py-4 transition-colors hover:bg-muted/60"
            >
              <Icon className="size-4 text-muted-foreground" aria-hidden />
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-sm font-medium">{title}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {description}
                </span>
              </span>
              <ArrowUpRight
                className="size-3.5 text-muted-foreground"
                aria-hidden
              />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ActionLink({
  primary,
  to,
  children
}: {
  primary: boolean;
  to: string;
  children: ReactNode;
}) {
  return (
    <Button asChild variant={primary ? "default" : "outline"}>
      <Link to={to}>{children}</Link>
    </Button>
  );
}
