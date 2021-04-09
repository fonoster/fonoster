export interface UploadObjectRequest {
  bucket: "apps" | "public" | "recordings";
  filename: string;
  metadata?: unknown;
  accessKeyId?: string;
}

export interface GetObjectURLRequest {
  bucket: "apps" | "public" | "recordings";
  filename: string;
  accessKeyId?: string;
}

export interface getObjectURLResponse {
  url: string;
}

export interface UploadObjectResponse {
  size: number;
}
