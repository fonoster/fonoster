"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const routr_1 = __importDefault(require("../common/routr"));
async function getResource(request) {
    await routr_1.default.connect();
    const jsonObj = await routr_1.default
        .resourceType(`${request.kind.toLowerCase()}s`)
        .get(request.ref);
    // Return only if exist and is the owner of the resource
    return jsonObj && jsonObj.metadata.accessKeyId === request.accessKeyId
        ? jsonObj
        : null;
}
exports.default = getResource;
