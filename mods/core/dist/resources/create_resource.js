"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const routr_1 = __importDefault(require("../common/routr"));
async function default_1(resource) {
    await routr_1.default.connect();
    const ref = await routr_1.default
        .resourceType(`${resource["kind"].toLowerCase()}s`)
        .create(resource);
    // Get from the database
    return await routr_1.default
        .resourceType(`${resource["kind"].toLowerCase()}s`)
        .get(ref);
}
exports.default = default_1;
