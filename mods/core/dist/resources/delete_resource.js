"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const routr_1 = __importDefault(require("../common/routr"));
const get_resource_1 = __importDefault(require("./get_resource"));
async function deleteResource(request) {
    await routr_1.default.connect();
    if (await get_resource_1.default(request)) {
        await routr_1.default
            .resourceType(`${request.kind.toLowerCase()}s`)
            .delete(request.ref);
    }
    return request.ref;
}
exports.default = deleteResource;
