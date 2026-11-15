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
import { status } from "@grpc/grpc-js";
import { expect } from "chai";
import { handleError } from "../../src/errors/handleError";
import { PrismaErrorEnum } from "../../src/errors/PrismaErrorEnum";
import { GrpcErrorMessage } from "../../src/errors/types";

const GENERIC = "The requested resource was not found";

function answer(error: unknown): GrpcErrorMessage {
  let got: GrpcErrorMessage | undefined;
  handleError(error as Error, (e) => (got = e));
  return got!;
}

describe("@common/handleError NOT_FOUND", function () {
  it("passes a public not-found message to the caller verbatim", function () {
    expect(
      answer({
        code: status.NOT_FOUND,
        message: "Call not found: 95dbd8d4",
        public: true
      })
    ).to.deep.equal({
      code: status.NOT_FOUND,
      message: "Call not found: 95dbd8d4"
    });
  });

  it("answers the generic message for an unmarked NOT_FOUND", function () {
    expect(
      answer({ code: status.NOT_FOUND, message: "Resource not found: abc" })
    ).to.deep.equal({ code: status.NOT_FOUND, message: GENERIC });
  });

  it("answers the generic message for a gRPC ServiceError", function () {
    const serviceError = Object.assign(
      new Error("5 NOT_FOUND: Number not found: +15555550100"),
      { code: status.NOT_FOUND, details: "Number not found: +15555550100" }
    );
    expect(answer(serviceError)).to.deep.equal({
      code: status.NOT_FOUND,
      message: GENERIC
    });
  });

  it("answers the generic message for a Prisma P2025", function () {
    expect(
      answer({
        code: PrismaErrorEnum.RECORD_NOT_FOUND,
        message: "No record was found for an update."
      })
    ).to.deep.equal({ code: status.NOT_FOUND, message: GENERIC });
  });
});
