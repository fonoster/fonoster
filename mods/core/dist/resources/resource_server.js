"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const get_resource_1 = __importDefault(require("./get_resource"));
const list_resources_1 = __importDefault(require("./list_resources"));
const delete_resource_1 = __importDefault(require("./delete_resource"));
const get_access_key_id_1 = __importDefault(require("../common/get_access_key_id"));
class ResourceServer {
    static async listResources(kind, call) {
        try {
            return await list_resources_1.default({
                accessKeyId: get_access_key_id_1.default(call),
                kind,
                page: parseInt(call.request.getPageToken()),
                itemsPerPage: call.request.getPageSize()
            });
        }
        catch (e) {
            return null;
        }
    }
    static async getResource(kind, call) {
        try {
            return await get_resource_1.default({
                ref: call.request.getRef(),
                kind,
                accessKeyId: get_access_key_id_1.default(call)
            });
        }
        catch (e) {
            return null;
        }
    }
    static async deleteResource(kind, call) {
        await delete_resource_1.default({
            ref: call.request.getRef(),
            kind,
            accessKeyId: get_access_key_id_1.default(call)
        });
    }
}
exports.default = ResourceServer;
