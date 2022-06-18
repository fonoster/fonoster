/* eslint-disable require-jsdoc */
/*
 * Copyright (C) 2022 by Fonoster Inc (https://fonoster.com)
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
import userDecoder from "@fonoster/users/dist/service/decoder";
import projectDecoder from "@fonoster/projects/dist/service/decoder";
import {UserLimiter} from "@fonoster/users/dist/service/types";
import {Limit, Limiter} from "../service/types";
import logger from "@fonoster/logger";

export function getUserByAccessKeyId(redis: any) {
  return async (accessKeyId: string) => {
    // Will return User or Project
    const raw = await redis.get(accessKeyId);
    if (raw) {
      if (accessKeyId.startsWith("US")) {
        return userDecoder(raw);
      }

      const project = projectDecoder(raw);
      return userDecoder(await redis.get(project.getUserRef()));
    }
    return null;
  };
}

export function getLimitForPath(limiters: Limiter[]) {
  return (limiterName: string, path: string): Limit => {
    const lname = limiterName ? limiterName : UserLimiter.DEFAULT;
    const limiter = limiters.find(
      (l) => l.name.toLowerCase() === lname.toLowerCase()
    );
    if (limiter) {
      return limiter.limits.find((l) => l.path === path);
    }
    return null;
  };
}

export function getResourceCount(redis: any, routr: any) {
  return async (userAccessKeyId: string, resource: string): Promise<number> => {
    const pAccessKeyIds = await redis.smembers("u_" + userAccessKeyId);

    if (resource?.toLowerCase() === "project") {
      return pAccessKeyIds.length;
    }

    if (
      ["provider", "domain", "number", "agent"].includes(
        resource?.toLowerCase()
      )
    ) {
      const res =
        resource.toLowerCase() === "provider"
          ? "gateways"
          : `${resource.toLowerCase()}s`;

      await routr.connect();

      return (
        await Promise.all<number>(
          pAccessKeyIds.map(async (id: string) => {
            const result = await routr.resourceType(res).list(
              {
                itemsPerPage: 10000
              },
              id
            );
            return result.meta.totalItems;
          })
        )
      ).reduce((prev: number, cur: number) => prev + cur, 0);
    }

    return 0;
  };
}

export function getLimiters(): Limiter[] {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require(process.env.LIMITERS_PATH ||
      "/home/fonoster/limiters.json") as Limiter[];
  } catch (e) {
    logger.info(
      "@fonoster/limiter failed to load limiters; starting without limiters"
    );
    return [];
  }
}
