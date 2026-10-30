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
import { type Announcement, loadAnnouncement } from "~/lib/announcement";
import { STORAGE_KEYS, storage } from "~/lib/storage";

const ICONS = { info: Info, warning: TriangleAlert, critical: AlertCircle };

/** The bar above every page: fonoster.com's notice bar, from config/dashboard.yaml. */
export function AnnouncementBar({
  load = loadAnnouncement
}: {
  load?: () => Promise<Announcement | null>;
}) {
  const { data } = useQuery({
    queryKey: ["announcement"],
    queryFn: load,
    staleTime: Infinity,
    retry: false
  });
  const [closed, setClosed] = useState(() =>
    storage.get(STORAGE_KEYS.announcement)
  );
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
