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
import { randomInt } from "node:crypto";
import { ListRequest, ListResponse } from "@fonoster/types";
import { filterByAccessKeyId } from "../resources/paginationUtils";

const PAGE_SIZE = 100;
const PASSWORD_ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

/** A 24-character SIP password with at least one upper, one lower and one digit. */
function generatePassword(): string {
  for (;;) {
    const password = Array.from(
      { length: 24 },
      () => PASSWORD_ALPHABET[randomInt(PASSWORD_ALPHABET.length)]
    ).join("");
    if (
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /\d/.test(password)
    ) {
      return password;
    }
  }
}

type Listed = { extended?: Record<string, unknown> };
type Lister<T> = (request: ListRequest) => Promise<ListResponse<T>>;

/** The first item that matches, through every page Routr has, with or without a workspace filter. */
async function findWhere<T extends Listed>(
  list: Lister<T>,
  match: (item: T) => boolean,
  accessKeyId?: string
): Promise<T | undefined> {
  let pageToken: string | undefined;
  for (;;) {
    const { items = [], nextPageToken } = await list({
      pageSize: PAGE_SIZE,
      pageToken
    });
    const candidates = accessKeyId
      ? filterByAccessKeyId(
          items as (T & { extended?: { accessKeyId?: string } })[],
          accessKeyId
        )
      : items;
    const found = candidates.find(match);
    if (found || !nextPageToken || items.length < PAGE_SIZE) {
      return found;
    }
    pageToken = nextPageToken;
  }
}

/** The caller's first resource that matches. */
function findOwned<T extends Listed>(
  list: Lister<T>,
  accessKeyId: string,
  match: (item: T) => boolean
): Promise<T | undefined> {
  return findWhere(list, match, accessKeyId);
}

/** The first resource of any workspace that matches (Routr lists every workspace's items). */
function findAny<T extends Listed>(
  list: Lister<T>,
  match: (item: T) => boolean
): Promise<T | undefined> {
  return findWhere(list, match);
}

export { findAny, findOwned, generatePassword };
