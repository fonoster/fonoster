/*
 * Copyright (C) 2023 by Fonoster Inc (https://fonoster.com)
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
export interface IStorageClient {
  uploadObject(request: UploadObjectRequest): Promise<UploadObjectResponse>;
  getObjectURL(request: GetObjectURLRequest): Promise<GetObjectURLResponse>;
}

export interface UploadObjectRequest {
  bucket: string;
  filename: string;
  metadata?: unknown;
  accessKeyId?: string;
}

export interface GetObjectURLRequest {
  bucket: string;
  filename: string;
  accessKeyId?: string;
}

export interface GetObjectURLResponse {
  url: string;
}

export interface UploadObjectResponse {
  size: number;
}
