/*
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
import { useState, type JSX } from "react";
import { type Meta, type StoryObj } from "@storybook/react";
import { DataTable } from "./data-table";
import type { ColumnDef } from "@tanstack/react-table";
import type { DataTableProps } from "./data-table.interfaces";
import { Box } from "@mui/material";

type App = {
  ref: string;
  name: string;
  tts: string;
  stt: string;
  type: string;
};

const mockData: App[] = Array.from({ length: 58 }, (_, i) => ({
  ref: `ref_4g2tj${i + 1}28`,
  name: `Application ${i + 1}`,
  tts: i % 2 === 0 ? "Google" : "Deepgram",
  stt: i % 2 === 0 ? "Google" : "Deepgram",
  type: i % 2 === 0 ? "External" : "Autopilot"
}));

const columns: ColumnDef<App>[] = [
  {
    accessorKey: "ref",
    header: "Ref",
    enableSorting: false
  },
  {
    accessorKey: "name",
    header: "Name"
  },
  {
    accessorKey: "tts",
    header: "TTS"
  },
  {
    accessorKey: "stt",
    header: "STT"
  },
  {
    accessorKey: "type",
    header: "Type"
  }
];

const searchableFields = [
  { label: "Name", value: "name" },
  { label: "Type", value: "type" },
  { label: "TTS", value: "tts" },
  { label: "STT", value: "stt" }
];

const meta: Meta<typeof DataTable<App>> = {
  title: "Components/DataTable",
  component: DataTable
};

export default meta;

type Story = StoryObj<typeof DataTable<App>>;

const createPagination = (start: number, limit: number) => {
  const total = mockData.length;
  const end = Math.min(start + limit, total);

  return {
    data: mockData.slice(start, end),
    pagination: {
      total,
      nextToken: end < total ? String(end) : null,
      prevToken: start > 0 ? String(Math.max(0, start - limit)) : null
    }
  };
};

const Template = (props: Partial<DataTableProps<App>>): JSX.Element => {
  const [cursor, setCursor] = useState(0);
  const [searchBy, onSearchByFieldChange] = useState("name");

  const pageSize = 7;
  const { data, pagination } = createPagination(cursor, pageSize);

  return (
    <Box sx={{ width: "85%", height: "100%", margin: "0 auto" }}>
      <DataTable
        data={data}
        columns={columns}
        searchBy={searchBy}
        searchableFields={searchableFields}
        getRowId={(row) => row.ref}
        pageSize={pageSize}
        pagination={{
          total: pagination.total,
          nextToken: pagination.nextToken,
          prevToken: pagination.prevToken
        }}
        onNextPage={() => {
          setCursor((prev) => parseInt(pagination.nextToken ?? `${prev}`));
        }}
        onPrevPage={() => {
          setCursor((prev) => parseInt(pagination.prevToken ?? `${prev}`));
        }}
        onSearch={(term) => console.log(term)}
        onSearchByFieldChange={onSearchByFieldChange}
        onSortChange={(col, order) => console.log("Sort: ", col, order)}
        onDeleteSelected={(rows) =>
          alert(`Delete: ${rows.map((r) => r.name).join(", ")}`)
        }
        onEditSelected={(row) => alert(`Edit: ${row.name}`)}
        {...props}
      />
    </Box>
  );
};

export const Overview: Story = {
  render: Template
};

export const NoSelection: Story = {
  render: Template,
  args: {
    features: ["pagination", "filters"]
  }
};

export const NoPagination: Story = {
  render: Template,
  args: {
    features: ["filters", "selection"]
  }
};

export const NoFilters: Story = {
  render: Template,
  args: {
    features: ["pagination", "selection"]
  }
};

export const NoFeatures: Story = {
  render: Template,
  args: {
    features: []
  }
};
