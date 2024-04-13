/*
 * Copyright (C) 2023 by Fonoster Inc (https://fonoster.com)
 * http://github.com/fonoster/rox
 *
 * This file is part of Rox AI
 *
 * Licensed under the MIT License (the "License")
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
export interface ServerConfig {
  port: number;
  defaultLanguageCode: string;
  eventsServerEnabled: boolean;
  /**
   * Enable file retention policy
   *
   * @default true
   */
  fileRetentionPolicyEnabled?: boolean;
  /**
   * Directory where the file retention policy will be executed
   *
   * @default os.tmpdir()
   */
  fileRetentionPolicyDirectory?: string;
  /**
   * Cron expression to run the file retention policy
   *
   * @default 0 0 * * *
   * @see https://crontab.guru/#0_0_*_*_*
   */
  fileRetentionPolicyCronExpression?: string;
  /**
   * Max age in hours to keep files
   *
   * @default 24
   */
  fileRetentionPolicyMaxAge?: number;
  /**
   * File extension to be deleted
   *
   * @default .sln24
   */
  fileRetentionPolicyExtension?: string;
}

export enum TTSVendor {
  GOOGLE = "google",
  AMAZON = "amazon",
  MICROSOFT = "microsoft"
}
