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
import { AlertCircle, ArrowRight, Info, TriangleAlert, X } from "lucide-react";
import { useState } from "react";
import { parseAnnouncement } from "~/lib/announcement";
import { DASHBOARD_FILE_KEY, loadDashboardFile } from "~/lib/dashboard-file";
import { STORAGE_KEYS, storage } from "~/lib/storage";
import {
  useBillingNotice,
  type BillingNoticeValue
} from "./billing-notice-context";

const ICONS = { info: Info, warning: TriangleAlert, critical: AlertCircle };

/**
 * The bar above every page: fonoster.com's notice bar, from config/dashboard.yaml. While billing
 * pauses the current workspace's calls, it says so instead, and can't be closed.
 */
export function AnnouncementBar({
  load = loadDashboardFile
}: {
  /** The parsed config/dashboard.yaml. */
  load?: () => Promise<unknown>;
}) {
  const { data } = useQuery({
    queryKey: DASHBOARD_FILE_KEY,
    queryFn: load,
    staleTime: Infinity,
    retry: false,
    select: parseAnnouncement
  });
  const [closed, setClosed] = useState(() =>
    storage.get(STORAGE_KEYS.announcement)
  );
  const billing = useBillingNotice();
  if (billing) return <CallsPausedBar notice={billing} />;
  if (!data) return null;
  // Closing hides this message only: any change to it shows the bar again.
  const id = JSON.stringify([
    data.tone,
    data.lead,
    data.text,
    data.cta,
    data.link
  ]);
  if (closed === id) return null;
  const close = () => {
    storage.set(STORAGE_KEYS.announcement, id);
    setClosed(id);
  };
  const Icon = ICONS[data.tone];
  return (
    <div
      className="fn-announcement"
      data-tone={data.tone}
      role={data.tone === "critical" ? "alert" : "status"}
    >
      <p>
        <Icon aria-hidden className="fn-announcement__icon" />
        {[
          data.lead && <strong key="lead">{data.lead}</strong>,
          data.text && <span key="text">{data.text}</span>,
          data.link && data.cta && (
            <a key="cta" href={data.link} target="_blank" rel="noreferrer">
              <span>{data.cta}</span>
              <ArrowRight aria-hidden />
            </a>
          )
        ]
          .filter(Boolean)
          .flatMap((part, i) => (i ? [" ", part] : [part]))}
      </p>
      <button
        type="button"
        className="fn-announcement__close"
        aria-label="Close the announcement"
        onClick={close}
      >
        <X aria-hidden />
      </button>
    </div>
  );
}

function CallsPausedBar({ notice }: { notice: BillingNoticeValue }) {
  const Icon = ICONS.critical;
  const { action } = notice;
  return (
    <div className="fn-announcement" data-tone="critical" role="alert">
      <p>
        <Icon aria-hidden className="fn-announcement__icon" />
        <span>{notice.text}</span>
        {action && (
          <>
            {" "}
            <a
              href={action.href}
              onClick={(event) => {
                // A plain click stays in this tab, through the router; modified clicks act as links.
                if (
                  event.button !== 0 ||
                  event.metaKey ||
                  event.ctrlKey ||
                  event.shiftKey ||
                  event.altKey
                )
                  return;
                event.preventDefault();
                action.go();
              }}
            >
              <span>{action.label}</span>
              <ArrowRight aria-hidden />
            </a>
          </>
        )}
      </p>
    </div>
  );
}
