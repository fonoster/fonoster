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
import type { Route } from "./+types/apps.page";
import { useRef, useState } from "react";

import { Page } from "~/core/components/general/page/page";
import { DataTable } from "~/core/components/design-system/ui/data-table/data-table";
import { toast } from "~/core/components/design-system/ui/toaster/toaster";

import { columns } from "./apps.columns";
import { ApplicationsPageHeader } from "./apps.page-header";
import { APPS_SEARCHABLE_FIELDS } from "./apps.const";

import {
  useApplications,
  useDeleteApplication
} from "~/applications/services/applications.service";
import { useResourceTable } from "~/core/hooks/use-resource-table";

/**
 * Returns metadata for the applications page.
 * Used by the routing system to set the page title and meta description.
 *
 * @param _ - Meta arguments (unused in this case).
 * @returns Array of meta objects for the page.
 */
export function meta(_: Route.MetaArgs) {
  return [
    { title: "Voice Applications | Fonoster" },
    {
      name: "description",
      content:
        "Use this section to connect your Dialogflow, IBM Watson, and OpenAI Assistants with your numbers."
    }
  ];
}

/**
 * Main component responsible for displaying and managing voice applications.
 * Integrates search, pagination, delete, and edit functionalities via a reusable DataTable component.
 */
export default function Applications() {
  /** State to hold the current pagination token used to fetch a specific page of data. */
  const [pageToken, setPageToken] = useState<string | undefined>(undefined);

  /** Reference to the page size constant for controlling number of rows per page. */
  const { current: pageSize } = useRef(24);

  /** Fetch applications data using the current page token and page size. */
  const { data, nextPageToken, isLoading } = useApplications({
    pageSize,
    pageToken
  });

  /** Hook to delete an application via the API. */
  const { mutateAsync: deleteApplication } = useDeleteApplication();

  /**
   * Custom hook for table management:
   * - Handles search functionality
   * - Handles filtering
   * - Handles pagination (next/prev pages)
   * - Handles deletion of selected rows
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
    pageSize,
    pageToken,
    setPageToken,
    deleteResource: deleteApplication,
    searchableFields: APPS_SEARCHABLE_FIELDS,
    defaultSearchBy: "ref"
  });

  return (
    <Page>
      <ApplicationsPageHeader />

      <DataTable
        /** Displays loading state when data is being fetched. */
        isLoading={isLoading}
        /** Data to be displayed in the table (filtered based on search). */
        data={filteredData}
        /** Column definitions for the table. */
        columns={columns}
        /** Function to get a unique row ID for each record. */
        getRowId={(row) => row.ref}
        /** Current field selected for searching. */
        searchBy={searchBy}
        /** List of searchable fields displayed in the UI. */
        searchableFields={APPS_SEARCHABLE_FIELDS}
        /** Number of rows per page. */
        pageSize={pageSize}
        /** Pagination controls for next/prev pages. */
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
        /** Handler for updating the search term. */
        onSearch={handleSearch}
        /** Handler for changing the search field. */
        onSearchByFieldChange={setSearchBy}
        /** Handler for deleting selected rows. */
        onDeleteSelected={handleDelete}
        /** Handler for editing selected rows (currently shows a toast). */
        onEditSelected={(row) => toast(`Edit: ${row.name}`)}
      />
    </Page>
  );
}
