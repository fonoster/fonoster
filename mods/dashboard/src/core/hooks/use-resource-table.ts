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
import { useState, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { getNestedValue } from "../helpers/get-nested-value";
import type { BaseApiObject } from "../providers/query-client/manage-resource-cache.helper";

/**
 * Interface representing the options passed to the useResourceTable hook.
 *
 * @template TResource - The resource type expected by the table (must have a `ref` field).
 */
export interface ResourceTableOptions<TResource> {
  /** The dataset to manage. */
  data: TResource[];
  /** Number of items per page (defaults to 24). */
  pageSize?: number;
  /** Optional function to delete a resource by ref. */
  deleteResource?: (ref: string) => Promise<string | BaseApiObject> | void;
  /** List of fields that can be searched. */
  searchableFields?: { label: string; value: string }[];
  /** The default field to search by (defaults to "ref"). */
  defaultSearchBy?: string;
  /** Current page token to manage pagination. */
  pageToken?: string;
  /** Setter function to update the current page token. */
  setPageToken: (token: string | undefined) => void;
}

/**
 * Generic hook to manage table search, filtering, pagination, and deletion logic
 * for any resource type.
 *
 * @template TResource - The resource type expected by the table (must have a `ref` field).
 *
 * @param options - Configuration object for the hook.
 * @returns An object containing state, handlers, and the filtered data.
 */
export function useResourceTable<TResource extends { ref: string }>(
  options: ResourceTableOptions<TResource>
) {
  const {
    data,
    pageSize = 24,
    deleteResource,
    searchableFields,
    defaultSearchBy = "ref",
    pageToken,
    setPageToken
  } = options;

  /** State to hold the current search term entered by the user. */
  const [searchTerm, setSearchTerm] = useState("");

  /** State to hold the field selected by the user to search by. */
  const [searchBy, setSearchBy] = useState(defaultSearchBy);

  /** Stack of previous page tokens to support backward navigation. */
  const [prevTokens, setPrevTokens] = useState<string[]>([]);

  /**
   * Advances to the next page using the provided token.
   * Stores the current token in the previous tokens stack to enable backward navigation.
   *
   * @param nextPageToken - The token representing the next page.
   */
  const handleNextPage = useCallback(
    (nextPageToken: string | undefined) => {
      if (nextPageToken) {
        setPrevTokens((prev) => [...prev, pageToken!]);
        setPageToken(nextPageToken);
      }
    },
    [pageToken, setPageToken]
  );

  /**
   * Returns to the previous page using the last stored token.
   * Pops the token stack and sets the pageToken to the previous value.
   */
  const handlePrevPage = useCallback(() => {
    const tokens = [...prevTokens];
    const prev = tokens.pop();
    setPrevTokens(tokens);
    setPageToken(prev || undefined);
  }, [prevTokens, setPageToken]);

  /**
   * Handles updates to the search term.
   * Resets pagination to the first page and clears previous tokens.
   *
   * @param term - The new search term entered by the user.
   */
  const handleSearch = useCallback(
    (term: string) => {
      setSearchTerm(term);
      setPageToken(undefined);
      setPrevTokens([]);
    },
    [setPageToken]
  );

  /**
   * Handles deletion of selected rows.
   * Executes the deleteResource function if provided, and displays a toast on completion.
   *
   * @param rows - Array of rows (each containing `ref` and `name`) to delete.
   */
  const handleDelete = useCallback(
    async (rows: { ref: string; name: string }[]) => {
      if (!deleteResource) return;

      if (
        window.confirm(
          `Are you sure you want to delete ${rows.length} resources?`
        )
      ) {
        rows.map((r) => deleteResource(r.ref));

        toast("Resources deleted successfully!");
      }
    },
    [deleteResource]
  );

  /**
   * Memoized filtered data based on the current search term and selected field.
   * Supports nested field access using getNestedValue.
   */
  const filteredData = useMemo(() => {
    if (data.length === 0) return [];

    if (!searchTerm) return data;

    return data.filter((resource) => {
      const rawValue = getNestedValue(resource, searchBy);
      const value = rawValue?.toString().toLowerCase();

      return value?.includes(searchTerm.toLowerCase());
    });
  }, [data, searchTerm, searchBy]);

  return {
    searchTerm,
    searchBy,
    setSearchBy,
    handleSearch,
    filteredData,
    pageToken,
    prevTokens,
    handleNextPage,
    handlePrevPage,
    handleDelete,
    pageSize,
    searchableFields
  };
}
