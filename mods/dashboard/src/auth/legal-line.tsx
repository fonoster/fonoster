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
import { useQuery } from "@tanstack/react-query";
import { DASHBOARD_FILE_KEY, loadDashboardFile } from "~/lib/dashboard-file";
import { parseLegal } from "~/lib/legal";

/** "By continuing, you agree to the Terms and Privacy Policy." from config/dashboard.yaml. */
export function LegalLine({
  load = loadDashboardFile
}: {
  load?: () => Promise<unknown>;
}) {
  const { data } = useQuery({
    queryKey: DASHBOARD_FILE_KEY,
    queryFn: load,
    staleTime: Infinity,
    retry: false,
    select: parseLegal
  });
  if (!data) return null;
  const links = [
    data.terms && <LegalLink key="terms" href={data.terms} label="Terms" />,
    data.privacy && (
      <LegalLink key="privacy" href={data.privacy} label="Privacy Policy" />
    )
  ]
    .filter(Boolean)
    .flatMap((link, i) => (i ? [" and ", link] : [link]));
  return (
    <p className="text-center font-display text-[13px] leading-normal text-muted-foreground">
      By continuing, you agree to the {links}.
    </p>
  );
}

function LegalLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="underline underline-offset-2 hover:text-foreground"
    >
      {label}
    </a>
  );
}
