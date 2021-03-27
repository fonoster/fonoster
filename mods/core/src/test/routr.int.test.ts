import chai from "chai";
import sinonChai from "sinon-chai";
import chaiAsPromised from "chai-as-promised";
import { join } from "path";

const expect = chai.expect;
chai.use(sinonChai);
chai.use(chaiAsPromised);

if (process.env.NODE_ENV === "dev") {
  require("dotenv").config({ path: join(__dirname, "..", "..", "..", ".env") });
}

import RoutrClient from "../common/routr_client";

const host = process.env.SIPPROXY_HOST || "localhost";
const port = process.env.SIPPROXY_API_PORT || "4567";

const rConfig = {
  username: process.env.SIPPROXY_API_USERNAME || "admin",
  secret: process.env.SIPPROXY_API_SECRET || "changeit",
  apiUrl: `https://${host}:${port}/api/v1beta1`
};

const domain = {
  apiVersion: "v1beta1",
  kind: "Domain",
  metadata: {
    name: "Local Office",
    ref: "DM001"
  },
  spec: {
    context: {
      domainUri: "sip.local001"
    }
  }
};

const agent = {
  apiVersion: "v1beta1",
  kind: "Agent",
  metadata: {
    name: "John",
    ref: "abc"
  },
  spec: {
    credentials: {
      username: "test",
      secret: "1234"
    },
    domains: ["sip.local001"]
  }
};

describe("Routr Server", () => {
  let routr: any;
  before(async () => {
    routr = new RoutrClient(rConfig.apiUrl, rConfig.username, rConfig.secret);
    await routr.connect();
  });

  it("creates new domain", async () => {
    await expect(routr.resourceType("domains").create(domain)).fulfilled;
  });

  it("creates new agent", async () => {
    await routr.resourceType("agents").create(agent);
  });

  it("failes because agent already exist", async () => {
    await expect(
      routr.resourceType("agents").create(agent)
    ).to.be.eventually.rejectedWith("Entity already exist");
  });

  it("deletes the agent and domain", async () => {
    await expect(routr.resourceType("agents").delete(agent.metadata.ref)).to.be
      .eventually.fulfilled;
    await expect(routr.resourceType("domains").delete(domain.metadata.ref)).to
      .be.eventually.fulfilled;
  });

  it("fails because of bad reference", async () => {
    agent.metadata.ref = "a";
    await expect(routr.resourceType("agents").create(agent)).to.be.rejectedWith(
      "$[0].metadata.ref: must be at least 3 characters long"
    );
  });
});
