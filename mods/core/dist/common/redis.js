"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const ioredis_1 = __importDefault(require("ioredis"));
const host = process.env.DS_HOST || "localhost";
const port = process.env.DS_PORT || 6379;
const secret = process.env.DS_SECRET ? `:${process.env.DS_SECRET}@` : "";
module.exports = () => new ioredis_1.default(`redis://${secret}${host}:${port}`);
