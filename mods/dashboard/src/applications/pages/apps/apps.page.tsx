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
import { type Application, ApplicationType } from "@fonoster/types";
import type { Route } from "./+types/apps.page";
import { Page } from "~/core/components/general/page/page";
import { DataTable } from "~/core/components/design-system/ui/data-table/data-table";
import { columns } from "./apps.columns";
import { useRef, useState } from "react";
import { toast } from "~/core/components/design-system/ui/toaster/toaster";
import { ApplicationsPageHeader } from "./apps.page-header";

export function meta(_: Route.MetaArgs) {
  return [
    { title: "Voice Applications | Fonoster" },
    {
      name: "description",
      content: "Use this section to connect your Dialogflow, IBM Watson, and OpenAI Assistants with your numbers."
    }
  ];
}

const searchableFields = [
  { label: "Name", value: "name" },
  { label: "Type", value: "type" },
  { label: "TTS", value: "tts" },
  { label: "STT", value: "stt" }
];

export default function Applications() {
  const [searchBy, onSearchByFieldChange] = useState("name");
  const applications: Application[] = [
    {
      ref: "ref_appp_4g2tj128",
      name: "Hodelpa Hotels",
      type: ApplicationType.AUTOPILOT,
      textToSpeech: {
        productRef: "ref_4g2tj128",
        config: {
          name: "Google TTS",
        },
      },
      speechToText: {
        productRef: "ref_4g2tj128",
        config: {
          name: "Google STT",
        },
      },
      createdAt: new Date("2023-01-01T00:00:00Z"),
      updatedAt: new Date("2025-01-01T00:00:00Z"),
    },
    {
      ref: "ref_appp_4g2tsdfsdfj128",
      name: "Hodelpa Hotels",
      type: ApplicationType.AUTOPILOT,
      textToSpeech: {
        productRef: "ref_4g2tj128",
        config: {
          name: "Google TTS",
        },
      },
      speechToText: {
        productRef: "ref_4g2tj128",
        config: {
          name: "Google STT",
        },
      },
      createdAt: new Date("2023-01-01T00:00:00Z"),
      updatedAt: new Date("2025-01-01T00:00:00Z"),
    }
  ];

  const { current: pageSize } = useRef(10);

  return (
    <Page>
      <ApplicationsPageHeader />
      <DataTable
        data={applications}
        columns={columns}
        searchBy={searchBy}
        searchableFields={searchableFields}
        getRowId={(row) => row.ref}
        pageSize={pageSize}
        pagination={{
          total: applications.length,
          nextToken: null,
          prevToken: null
        }}
        onNextPage={() => null}
        onPrevPage={() => null}
        onSearch={(term) => console.log(term)}
        onSearchByFieldChange={onSearchByFieldChange}
        onDeleteSelected={(rows) =>
          toast(`Delete: ${rows.map((r) => r.name).join(", ")}`)
        }
        onSortChange={() => null}
        onEditSelected={(row) => toast(`Edit: ${row.name}`)}
      />
    </Page>
  );
}
