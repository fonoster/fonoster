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
import { Link } from "react-router-dom";
import { Alert } from "~/components/ui/alert";
import { errorMessage } from "~/lib/errors";
import { useRegion } from "./api";
import { ConnectionDetails } from "./connection";
import { regionLink } from "./links";
import { Row, STATUS_NOTE } from "./status";

/** Settings → Region: read-only; a workspace never changes region. */
export function RegionSettings() {
  const { data: region, isPrivate, isLoading, error } = useRegion();
  if (isLoading) return <p>Loading…</p>;
  if (error || !region)
    return (
      <Alert variant="error">
        {errorMessage(error ?? "Couldn't load the region")}
      </Alert>
    );
  const note = isPrivate ? STATUS_NOTE[region.status] : undefined;
  return (
    <section aria-label="Region" className="flex max-w-xl flex-col gap-5">
      {note && <Alert variant={note.variant}>{note.text}</Alert>}
      <dl>
        <Row label="Region" value={region.displayName} />
        <Row label="ID" value={region.id} />
        <Row label="Type" value={isPrivate ? "Private" : "Public"} />
      </dl>
      <ConnectionDetails region={region} />
      {isPrivate && (
        <Link
          to={regionLink(region.ref)}
          className="font-display text-sm underline"
        >
          Manage region
        </Link>
      )}
    </section>
  );
}
