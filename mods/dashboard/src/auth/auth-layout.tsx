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
import type { ReactNode } from "react";
import { Logo } from "~/components/brand/logo";

/**
 * Every sign-in screen: the logo over the dotted pattern, the heading and form
 * in a near-black card, and the hint line below it.
 */
export function AuthLayout({
  title,
  description,
  children,
  footer
}: {
  title: string;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <main className="flex min-h-full items-center justify-center bg-background bg-[url(/pattern-center.png)] bg-cover bg-center px-4 py-12">
      <div className="flex w-full max-w-[440px] flex-col items-center gap-7">
        <Logo />
        <section className="flex w-full flex-col gap-7 rounded-m border border-border bg-card p-6 sm:p-8 dark:border-[#262626] dark:bg-[#0f0f0f] [&_[data-slot=label]]:text-[13px]">
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-[26px] font-semibold leading-tight">{title}</h1>
            {description && (
              <p className="font-display text-sm leading-normal text-muted-foreground">
                {description}
              </p>
            )}
          </div>
          <div className="flex w-full flex-col gap-4">{children}</div>
        </section>
        {footer && (
          <div className="flex items-center gap-2 text-center font-display text-[13px] text-muted-foreground">
            {footer}
          </div>
        )}
      </div>
    </main>
  );
}

/** Inputs and buttons on these screens are a little taller than in the app. */
export const authInput = "h-[46px] bg-card px-3.5 text-[15px]";
export const authButton = "h-[46px] w-full font-display text-[15px]";
