import { assertIsE164 } from "../../src/service/assertions";
import { expect } from "chai";
import { FonosterInvalidArgument } from "@fonoster/errors";

describe("@fonoster/callmanager/service/assertions", async () => {
  it("should accept correct phone number", async () => {
    expect(() => assertIsE164("+33900112233", "from")).to.not.throw;
    }
  );

  it("should reject incorrect phone number", async () => {
    expect(() => assertIsE164("+3390011223", "from")).to.throw(FonosterInvalidArgument);
  });
});
