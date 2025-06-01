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
import { useWorkspaceId } from "~/workspaces/hooks/use-workspace-id";
import type { Route } from "./+types/members.page";
import { Page } from "~/core/components/general/page/page";
import { DataTable } from "~/core/components/design-system/ui/data-table/data-table";
import { getColumns } from "./members.columns";
import { useCallback, useMemo, useState } from "react";
import type { WorkspaceMemberDTO } from "./members.interfaces";
import { toast } from "~/core/components/design-system/ui/toaster/toaster";
import { MembersPageHeader } from "./members.page-header";
import { useUsers } from "~/auth/services/auth.service";
import { useResourceTable } from "~/core/hooks/use-resource-table";
import { Logger } from "~/core/shared/logger";
import { PAGE_SIZE } from "~/core/shared/page-sizes.const";

/**
 * Page metadata function.
 *
 * Sets the page title and description for SEO and browser tab.
 *
 * @param {Route.MetaArgs} _ - Meta args provided by the route loader.
 * @returns {Array} An array containing the page metadata.
 */
export function meta(_: Route.MetaArgs) {
  return [
    { title: "Workspace Members | Fonoster" },
    {
      name: "description",
      content: "Manage your workspace members and their permissions."
    }
  ];
}

/**
 * Members page component
 *
 * Renders a list of workspace members in a table with actions
 * to delete or email members. Supports search, pagination, and
 * selection of rows for batch operations.
 *
 * @returns {JSX.Element} The rendered members page.
 */
export default function Members() {
  /** Retrieves the current workspace ID from the URL params. */
  const workspaceId = useWorkspaceId();

  /** State to hold the current pagination token used to fetch a specific page of data. */
  const [pageToken, setPageToken] = useState<string | undefined>(undefined);

  /** Fetches workspace members using the page size and token for pagination. */
  const { data, nextPageToken, isLoading } = useUsers({
    pageSize: PAGE_SIZE,
    pageToken
  });

  /**
   * Handler for deleting a member (placeholder).
   * Currently shows a toast indicating the feature is not implemented yet.
   *
   * @param {WorkspaceMemberDTO} member - The member to delete.
   */
  const onDelete = useCallback(
    (member: WorkspaceMemberDTO) => {
      Logger.debug("Delete member:", member);
      toast("Delete member not implemented yet");
    },
    [workspaceId]
  );

  /**
   * Handler for sending an email to a member (placeholder).
   * Currently shows a toast indicating the feature is not implemented yet.
   *
   * @param {WorkspaceMemberDTO} member - The member to email.
   */
  const onSendEmail = useCallback(
    (member: WorkspaceMemberDTO) => {
      Logger.debug("Send email:", member);
      toast("Send email not implemented yet");
    },
    [workspaceId]
  );

  /** Memoized column definitions to avoid unnecessary re-renders. */
  const columns = useMemo(
    () => getColumns(onDelete, onSendEmail),
    [onDelete, onSendEmail]
  );

  /**
   * Custom hook for table management:
   * - Handles search functionality
   * - Handles filtering
   * - Handles pagination (next/prev pages)
   * - Handles deletion of selected rows
   */
  const {
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
    deleteResource: () => {
      // Placeholder delete implementation
      return Promise.resolve({ ref: "" });
    },
    searchableFields: [], // Specify searchable fields if needed
    defaultSearchBy: "name"
  });

  /**
   * Renders the members page with a header and a data table.
   */
  return (
    <Page variant="form">
      <MembersPageHeader />

      <DataTable
        variant="compact"
        /** Displays loading state when data is being fetched. */
        isLoading={isLoading}
        /** Data to be displayed in the table (filtered based on search). */
        data={data}
        /** Column definitions for the table. */
        columns={columns}
        /** Function to get a unique row ID for each record. */
        getRowId={(row) => row.ref}
        /** Current field selected for searching. */
        searchBy={searchBy}
        /** List of searchable fields displayed in the UI. */
        searchableFields={[]} // Define as needed
        /** Number of rows per page. */
        pageSize={PAGE_SIZE}
        /** Pagination controls for next/prev pages. */
        pagination={{
          total: data.length,
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
        features={["pagination"]}
      />
    </Page>
  );
}
