import { Kind } from "../common/resource_builder";

export interface GetResourceRequest {
  ref: string;
  kind: Kind;
  accessKeyId: string;
}

export interface DeleteResourceRequest {
  ref: string;
  kind: Kind;
  accessKeyId: string;
}

export interface ListResourceRequest {
  accessKeyId: string;
  kind: Kind;
  page: number;
  itemsPerPage: number;
}

export interface ListResourceResponse {
  nextPageToken?: number;
  resources?: object[];
}

export interface UpdateResourceRequest {
  accessKeyId: string;
  resource: unknown;
}
