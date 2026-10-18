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
import * as path from "path";
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";

/** A route as Routr's location service stores it (the fields the rig checks). */
export type LocationRoute = {
  user: string;
  host: string;
  port: string;
  advertisedHost: string;
  advertisedPort: string;
  sessionCount: number;
  expires: number;
};

const PROTOS = path.join(
  path.dirname(require.resolve("@routr/common/package.json")),
  "dist",
  "protos"
);

/**
 * Reads the routes Routr holds for an AOR from its location service (not part of the public API;
 * the rig exposes the port only to check that `X-Session-Count` landed).
 */
export async function findRoutes(
  endpoint: string,
  aor: string
): Promise<LocationRoute[]> {
  const def = protoLoader.loadSync(path.join(PROTOS, "location.proto"), {
    includeDirs: [PROTOS],
    keepCase: false,
    longs: Number,
    enums: String,
    defaults: true
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pkg = grpc.loadPackageDefinition(def) as any;
  const Location = pkg.fonoster.routr.location.v2beta1.Location;
  const client = new Location(endpoint, grpc.credentials.createInsecure());
  try {
    return await new Promise((resolve, reject) =>
      // A fresh callId each time: Routr caches lookups per aor + callId.
      client.findRoutes(
        { aor, callId: `rig-${Date.now()}-${Math.random()}` },
        (err: Error | null, res: { routes: LocationRoute[] }) =>
          err ? reject(err) : resolve(res.routes)
      )
    );
  } finally {
    client.close();
  }
}
