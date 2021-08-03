"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const routr_1 = __importDefault(require("../common/routr"));
async function default_1(request) {
    if (!request.page)
        return {};
    await routr_1.default.connect();
    const result = await routr_1.default
        .resourceType(`${request.kind.toLowerCase()}s`)
        .list({
        page: request.page,
        itemsPerPage: request.itemsPerPage
    });
    const resources = [];
    for (const i in result.data) {
        if (result.data[i].metadata.accessKeyId === request.accessKeyId) {
            resources.push(result.data[i]);
        }
    }
    return {
        nextPageToken: resources.length > 0 ? request.page + 1 : null,
        resources
    };
}
exports.default = default_1;
