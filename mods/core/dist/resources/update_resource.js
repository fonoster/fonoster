"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const routr_1 = __importDefault(require("../common/routr"));
async function default_1(request) {
    await routr_1.default.connect();
    const objFromDB = await routr_1.default
        .resourceType(`${request.resource["kind"].toLowerCase()}s`)
        .get(request.resource["metadata"].ref);
    if (objFromDB.metadata.accessKeyId === request.accessKeyId) {
        request.resource["metadata"].accessKeyId = request.accessKeyId;
        await routr_1.default
            .resourceType(`${request.resource["kind"].toLowerCase()}s`)
            .update(request.resource);
        return request.resource;
    }
    return null;
}
exports.default = default_1;
