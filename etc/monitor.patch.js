"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MonitorService = exports.default = void 0;
const monitor_grpc_pb_1 = require("./protos/monitor_grpc_pb");
Object.defineProperty(exports, "MonitorService", { enumerable: true, get: function () { return monitor_grpc_pb_1.MonitorService; } });
const elasticsearch_1 = require("@elastic/elasticsearch");
const env_1 = require("../env");
const client = new elasticsearch_1.Client({
    node: `http://${env_1.LOGS_AGGREGRATOR_HOST}:${env_1.LOGS_AGGREGRATOR_PORT}`
});
// eslint-disable-next-line require-jsdoc
class MonitorServer {
    // eslint-disable-next-line require-jsdoc
    async searchEvents(call) {
        // const accessKeyId = getAccessKeyId(call);
        // // TODO:
        // // Assert toJavaScript is valid
        // const { body } = await client.search(
        //   {
        //     body: {
        //       query: call.request.getQuery().toJavaScript()
        //     }
        //   },
        //   {
        //     asStream: true
        //   }
        // );
        // body.setEncoding("utf8");
        // const entries = (chunk) =>
        //   JSON.parse(chunk)
        //     .hits?.hits?.filter(
        //       (hit) => hit["_source"]?.accessKeyId === accessKeyId
        //     )
        //     .map((hit) => {
        //       const entry = new Event();
        //       entry.setRef(hit["_id"]);
        //       entry.setMessage(hit["_source"].message);
        //       entry.setTimestamp(hit["_source"]["@timestamp"]);
        //       entry.setBody(Struct.fromJavaScript(hit["_source"]?.body));
        //       entry.setEventType(EventType.fromString(hit["_source"]?.eventType));
        //       entry.setLevel(Level.fromString(hit["_source"]?.level));
        //       return entry;
        //     });
        // let payload = "";
        // body.on("data", async (chunk) => (payload += chunk));
        // body.on(
        //   "error",
        //   (e: Error) => new FonosterError(e.message, ErrorCodes.UNKNOWN)
        // );
        // body.on("end", () => {
        //   entries(payload)?.forEach((e: Event) => call.write(e));
        //   call.end();
        // });
    }
}
exports.default = MonitorServer;
