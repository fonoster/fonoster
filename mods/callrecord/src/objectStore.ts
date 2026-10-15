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
import * as fs from "fs";
import * as path from "path";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client
} from "@aws-sdk/client-s3";

// Object storage for sealed records and recordings (call-record "Records are stored in the
// call's region or the workspace's bucket"): the region's S3-compatible store (MinIO in tests and
// self-hosting), a workspace's own bucket, or a directory for development.

export interface ObjectStore {
  /** Where objects live, as stored in the index: `s3://bucket/prefix` or `file:///dir`. */
  readonly location: string;
  put(key: string, data: Buffer, contentType?: string): Promise<void>;
  get(key: string): Promise<Buffer | undefined>;
  /** Returns whether the object existed. */
  delete(key: string): Promise<boolean>;
  /** Every key under a prefix. */
  list(prefix: string): Promise<string[]>;
}

export class FsObjectStore implements ObjectStore {
  readonly location: string;

  constructor(private readonly dir: string) {
    fs.mkdirSync(dir, { recursive: true });
    this.location = `file://${path.resolve(dir)}`;
  }

  private file(key: string) {
    const file = path.resolve(this.dir, key);
    if (!file.startsWith(path.resolve(this.dir) + path.sep))
      throw new Error(`bad key ${key}`);
    return file;
  }

  async put(key: string, data: Buffer) {
    const file = this.file(key);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    // Write then rename, so a reader never sees half an object.
    const tmp = `${file}.${process.pid}.tmp`;
    fs.writeFileSync(tmp, data);
    fs.renameSync(tmp, file);
  }

  async get(key: string) {
    const file = this.file(key);
    return fs.existsSync(file) ? fs.readFileSync(file) : undefined;
  }

  async delete(key: string) {
    const file = this.file(key);
    if (!fs.existsSync(file)) return false;
    fs.rmSync(file);
    return true;
  }

  async list(prefix: string) {
    const base = path.resolve(this.dir);
    const out: string[] = [];
    const walk = (dir: string) => {
      if (!fs.existsSync(dir)) return;
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, e.name);
        if (e.isDirectory()) walk(full);
        else if (!e.name.endsWith(".tmp"))
          out.push(path.relative(base, full).split(path.sep).join("/"));
      }
    };
    walk(base);
    return out.filter((k) => k.startsWith(prefix)).sort();
  }
}

export type S3StoreConfig = {
  bucket: string;
  /** Key prefix inside the bucket (default none). */
  prefix?: string;
  region?: string;
  /** For MinIO and other S3-compatible stores. */
  endpoint?: string;
  forcePathStyle?: boolean;
  credentials?: { accessKeyId: string; secretAccessKey: string };
};

export class S3ObjectStore implements ObjectStore {
  readonly location: string;
  private readonly client: S3Client;
  private readonly prefix: string;

  constructor(private readonly config: S3StoreConfig) {
    this.prefix = config.prefix ? config.prefix.replace(/\/?$/, "/") : "";
    this.location = `s3://${config.bucket}/${this.prefix}`;
    this.client = new S3Client({
      region: config.region ?? "us-east-1",
      endpoint: config.endpoint,
      forcePathStyle: config.forcePathStyle ?? !!config.endpoint,
      credentials: config.credentials
    });
  }

  async put(key: string, data: Buffer, contentType?: string) {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.config.bucket,
        Key: this.prefix + key,
        Body: data,
        ContentType: contentType
      })
    );
  }

  async get(key: string) {
    try {
      const res = await this.client.send(
        new GetObjectCommand({
          Bucket: this.config.bucket,
          Key: this.prefix + key
        })
      );
      return Buffer.from(await res.Body!.transformToByteArray());
    } catch (e) {
      const name = (e as { name?: string }).name;
      if (name === "NoSuchKey" || name === "NotFound") return undefined;
      throw e;
    }
  }

  async delete(key: string) {
    const existed = (await this.get(key)) !== undefined;
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.config.bucket,
        Key: this.prefix + key
      })
    );
    return existed;
  }

  async list(prefix: string) {
    const out: string[] = [];
    let token: string | undefined;
    do {
      const res = await this.client.send(
        new ListObjectsV2Command({
          Bucket: this.config.bucket,
          Prefix: this.prefix + prefix,
          ContinuationToken: token
        })
      );
      for (const o of res.Contents ?? [])
        if (o.Key) out.push(o.Key.slice(this.prefix.length));
      token = res.IsTruncated ? res.NextContinuationToken : undefined;
    } while (token);
    return out.sort();
  }
}

/** A store from config: `{dir}` for development, `{s3: {...}}` for object storage. */
export type ObjectStoreConfig = { dir: string } | { s3: S3StoreConfig };

export function openObjectStore(config: ObjectStoreConfig): ObjectStore {
  return "dir" in config
    ? new FsObjectStore(config.dir)
    : new S3ObjectStore(config.s3);
}
