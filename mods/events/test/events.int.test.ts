import chai from "chai";
import sinon from "sinon";
import sinonChai from "sinon-chai";
import chaiAsPromised from "chai-as-promised";
import { join } from "path";
import EventsSender from "../src/events_sender";
import EventsRecvr from "../src/events_recvr";

const expect = chai.expect;
chai.use(sinonChai);
chai.use(chaiAsPromised);
const sandbox = sinon.createSandbox();

if (process.env.NODE_ENV === "dev") {
  require("dotenv").config({ path: join(__dirname, "..", "..", ".env") });
}

describe("Events Module", () => {
  it("send an events", async () => {
    const er = new EventsSender(
      [
        "amqp://localhost:5672",
        "amqp://localhost:5673",
        "amqp://localhost:5674"
      ],
      "test"
    );
    er.connect();
    // await er.sendToQ("APP_CREATED", {appId: "001", name: "blah"});
  });

  it("wait for events", async () => {
    const er = new EventsRecvr(
      [
        "amqp://localhost:5672",
        "amqp://localhost:5673",
        "amqp://localhost:5674"
      ],
      "test"
    );
    er.connect();
    er.watchEvents((content: any) => console.log(content.toString()));
  });
});
