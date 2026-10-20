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
/** Who owns a workspace, from Identity (which has its own database). */
export type UsageDirectory = {
  workspace(accessKeyId: string): Promise<{ ownerRef: string } | undefined>;
  /** The access key ids of the workspaces a user owns. */
  ownedBy?(ownerRef: string): Promise<{ accessKeyId: string }[]>;
};

/** The raw-SQL part of a Prisma client or transaction that the usage ledger uses. */
export type UsageSql = {
  $queryRawUnsafe<T = unknown>(query: string, ...values: unknown[]): Promise<T>;
  $executeRawUnsafe(query: string, ...values: unknown[]): Promise<number>;
};

export type UsageDb = UsageSql & {
  $transaction<T>(fn: (tx: UsageSql) => Promise<T>): Promise<T>;
};
