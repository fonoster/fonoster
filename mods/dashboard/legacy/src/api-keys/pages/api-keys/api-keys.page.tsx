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
import { useState } from "react";

import { Page } from "~/core/components/general/page/page";
import { DataTable } from "~/core/components/design-system/ui/data-table/data-table";

import { columns } from "./api-keys.columns";
import { ApiKeysPageHeader } from "./api-keys.page-header";
import { API_KEYS_SEARCHABLE_FIELDS } from "./api-keys.const";
import { useResourceTable } from "~/core/hooks/use-resource-table";
import { useApiKeys, useDeleteApiKey } from "../../services/api-keys.service";
import { useNavigate } from "react-router";
import { useWorkspaceId } from "~/workspaces/hooks/use-workspace-id";
import type { Route } from "./+types/api-keys.page";
import { PAGE_SIZE } from "~/core/shared/page-sizes.const";

/**
 * Page metadata function for the ApiKeys page.
 *
 * Sets the page title and meta description for SEO and browser display.
 *
 * @param _ - Meta arguments provided by the router (not used here).
 * @returns An array of metadata objects for the page.
 */
export function meta(_: Route.MetaArgs) {
  return [
    { title: "API Keys | Fonoster" },
    {
      name: "description",
      content:
        "Use API Keys to access Fonoster's APIs securely. Keys are encrypted and limited to this workspace."
    }
  ];
}

/**
 * ApiKeys page component.
 *
 * Renders a table of phone API keys with search, pagination, deletion, and editing features.
 * Uses a reusable DataTable component for consistent design and behavior.
 *
 * @returns {JSX.Element} The rendered ApiKeys page.
 */
export default function ApiKeysList() {
  /** State to hold the current pagination token used to fetch a specific page of data. */
  const [pageToken, setPageToken] = useState<string | undefined>(undefined);

  /** Fetch API keys data using the current page token and page size. */
  const { data, nextPageToken, isLoading } = useApiKeys({
    pageSize: PAGE_SIZE,
    pageToken
  });

  /** Hook to delete a API key via the API. */
  const { mutate: deleteApiKey } = useDeleteApiKey();

  /**
   * Custom hook for table management:
   * - Handles search functionality
   * - Handles pagination (next/prev pages)
   * - Handles deletion of selected rows
   * - Integrates with UI components
   */
  const {
    filteredData,
    searchBy,
    setSearchBy,
    handleNextPage,
    handlePrevPage,
    handleSearch,
    handleDelete,
    prevTokens
  } = useResourceTable({
    data,
    pageSize: PAGE_SIZE,
    pageToken,
    setPageToken,
    deleteResource: deleteApiKey,
    searchableFields: API_KEYS_SEARCHABLE_FIELDS,
    defaultSearchBy: "ref"
  });

  /**
   * Renders the ApiKeys page, including a header and a DataTable.
   */
  return (
    <Page>
      <ApiKeysPageHeader />

      <DataTable
        /** Indicates loading state during data fetch. */
        isLoading={isLoading}
        /** Data displayed in the table, filtered by search input. */
        data={filteredData}
        /** Column definitions for each table column. */
        columns={columns}
        /** Function to determine the unique row ID for each record. */
        getRowId={(row) => row.ref}
        /** The currently selected search field (e.g., "ref", "name"). */
        searchBy={searchBy}
        /** List of available searchable fields presented to the user. */
        searchableFields={API_KEYS_SEARCHABLE_FIELDS}
        /** ApiKey of rows displayed per page. */
        pageSize={PAGE_SIZE}
        /** Pagination configuration: total rows, next and previous tokens. */
        pagination={{
          total: filteredData.length,
          nextToken: nextPageToken,
          prevToken: prevTokens.length
            ? prevTokens[prevTokens.length - 1]
            : null
        }}
        /** Handler for navigating to the next page. */
        onNextPage={() => handleNextPage(nextPageToken)}
        /** Handler for navigating to the previous page. */
        onPrevPage={handlePrevPage}
        /** Handler for updating the search input. */
        onSearch={handleSearch}
        /** Handler for changing the search field selection. */
        onSearchByFieldChange={setSearchBy}
        /** Handler for deleting selected rows. */
        onDeleteSelected={handleDelete}
      />
    </Page>
  );
}
