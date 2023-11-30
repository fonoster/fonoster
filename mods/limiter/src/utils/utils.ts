/* eslint-disable require-jsdoc */
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
import { UserLimiter } from "@fonoster/users/dist/service/types";
import {
  Limit,
  Limiter,
  RedisClient,
  RESOURCE,
  RoutrClient,
  ROUTR_RESOURCES
} from "../service/types";
import { LIMITERS_PATH } from "../envs";
import { getLogger } from "@fonoster/logger";
import userDecoder from "@fonoster/users/dist/service/decoder";
import UserPB from "@fonoster/users/dist/service/protos/users_pb";

const logger = getLogger({ service: "limiter", filePath: __filename });

export function getUserByAccessKeyId(redis: RedisClient) {
  return async (accessKeyId: string): Promise<UserPB.User> => {
    // Will return User or Project
    const jsonStr = await redis.get(accessKeyId);
    if (!jsonStr) {
      return null;
    }

    if (!accessKeyId.startsWith("PJ")) {
      return userDecoder(jsonStr);
    }

    return userDecoder(
      await redis.get((JSON.parse(jsonStr) as { userRef: string }).userRef)
    );
  };
}

export function getLimiterByName(limiters: Limiter[]) {
  return (limiterName?: string): Limiter => {
    const lname = limiterName ? limiterName : UserLimiter.DEFAULT;
    const limiter = limiters?.find(
      (l) => l.name.toLowerCase() === lname.toLowerCase()
    );
    return limiter;
  };
}

export function getLimit(limiter: Limiter, path: string): Limit {
  return limiter?.limits?.find((l) => l.path === path);
}

export function getResourceCount(redis: RedisClient, routr: RoutrClient) {
  return async (userAccessKeyId: string, resource: string): Promise<number> => {
    const pAccessKeyIds = await redis.smembers("u_" + userAccessKeyId);

    if (resource?.toLowerCase() === RESOURCE.PROJECT) {
      return pAccessKeyIds.length;
    }

    if (
      ROUTR_RESOURCES.map((r) => r.toString()).includes(resource?.toLowerCase())
    ) {
      const res =
        resource.toLowerCase() === RESOURCE.PROVIDER
          ? RESOURCE.PROVIDER_ALIAS
          : `${resource.toLowerCase()}s`;

      await routr.connect();
      routr.resourceType(res);

      return (
        await Promise.all<number>(
          pAccessKeyIds.map(async (id: string) => {
            const result = await routr.list(
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
    return require(LIMITERS_PATH) as Limiter[];
  } catch (e) {
    logger.info("no configuration found", {
      path: LIMITERS_PATH
    });
    return [];
  }
}
