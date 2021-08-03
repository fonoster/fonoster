"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const errors_1 = require("@fonos/errors");
const errors_2 = require("@fonos/errors");
const grpc_1 = require("grpc");
function default_1(error) {
    if (!error.response)
        throw new errors_1.FonosError(error);
    const message = error.response.data.message;
    switch (error.response.status) {
        case 409:
            throw new errors_2.FonosFailedPrecondition(message);
        case 401:
            throw new errors_2.FonosAuthError(message);
        case 422:
            throw new errors_2.FonosFailedPrecondition(message);
        case 404:
            throw new errors_1.FonosError(message, grpc_1.status.NOT_FOUND);
        case 400:
            throw new errors_2.FonosInvalidArgument(message);
        default:
            throw new errors_1.FonosError(message);
    }
}
exports.default = default_1;
