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
import type { Route } from "./+types/numbers.page";
import { useCallback, useRef, useState } from "react";

import { Page } from "~/core/components/general/page/page";
import { DataTable } from "~/core/components/design-system/ui/data-table/data-table";
import { toast } from "~/core/components/design-system/ui/toaster/toaster";

import { columns } from "./numbers.columns";
import { NumbersPageHeader } from "./numbers.page-header";
import { APPS_SEARCHABLE_FIELDS } from "./numbers.const";
import { useResourceTable } from "~/core/hooks/use-resource-table";
import {
  useDeleteNumber,
  useNumbers
} from "~/numbers/services/numbers.service";
import type { INumber } from "@fonoster/types";
import { useNavigate } from "react-router";
import { useWorkspaceId } from "~/workspaces/hooks/use-workspace-id";

/**
 * Page metadata function for the Numbers page.
 *
 * Sets the page title and meta description for SEO and browser display.
 *
 * @param _ - Meta arguments provided by the router (not used here).
 * @returns An array of metadata objects for the page.
 */
export function meta(_: Route.MetaArgs) {
  return [
    { title: "Numbers | Fonoster" },
    {
      name: "description",
      content:
        "You will need a Number to make and receive calls from the PSTN (traditional phones)."
    }
  ];
}

/**
 * Numbers page component.
 *
 * Renders a table of phone numbers with search, pagination, deletion, and editing features.
 * Uses a reusable DataTable component for consistent design and behavior.
 *
 * @returns {JSX.Element} The rendered Numbers page.
 */
export default function Numbers() {
  /** Hook to navigate programmatically within the application. */
  const navigate = useNavigate();

  /** Retrieves the current workspace ID for API calls and navigation. */
  const workspaceId = useWorkspaceId();

  /** State to hold the current pagination token used to fetch a specific page of data. */
  const [pageToken, setPageToken] = useState<string | undefined>(undefined);

  /** Reference to the page size constant for controlling number of rows per page. */
  const { current: pageSize } = useRef(24);

  /** Fetch numbers data using the current page token and page size. */
  const { data, nextPageToken, isLoading } = useNumbers({
    pageSize,
    pageToken
  });

  /** Hook to delete a number via the API. */
  const { mutate: deleteNumber } = useDeleteNumber();

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
    pageSize,
    pageToken,
    setPageToken,
    deleteResource: deleteNumber,
    searchableFields: APPS_SEARCHABLE_FIELDS,
    defaultSearchBy: "name"
  });

  /**
   * Callback function to handle editing a selected number.
   *
   * Navigates to the edit page for the selected number.
   * Uses view transitions for a smoother user experience.
   * @param ref - The reference of the number to edit.
   * @param {INumber} ref - The number object containing the reference.
   * @returns {void}
   */
  const onEditSelected = useCallback(({ ref }: INumber) => {
    navigate(`/workspaces/${workspaceId}/sip-network/numbers/${ref}/edit`, {
      viewTransition: true
    });
  }, []);

  /**
   * Renders the Numbers page, including a header and a DataTable.
   */
  return (
    <Page>
      <NumbersPageHeader />

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
        searchableFields={APPS_SEARCHABLE_FIELDS}
        /** Number of rows displayed per page. */
        pageSize={pageSize}
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
        /** Handler for editing selected rows (currently shows a toast). */
        onEditSelected={onEditSelected}
      />
    </Page>
  );
}
