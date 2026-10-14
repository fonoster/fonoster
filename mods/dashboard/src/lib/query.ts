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
import { QueryClient } from "@tanstack/react-query";
import { GrpcCode, grpcCode } from "./errors";

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        retry: (count, error) => {
          const code = grpcCode(error);
          const final: number[] = [
            GrpcCode.UNAUTHENTICATED,
            GrpcCode.PERMISSION_DENIED,
            GrpcCode.NOT_FOUND,
            GrpcCode.INVALID_ARGUMENT
          ];
          return code !== undefined && final.includes(code) ? false : count < 2;
        }
      }
    }
  });
}
