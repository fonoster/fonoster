"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const routr_client_1 = __importDefault(require("./routr_client"));
const host = process.env.SIPPROXY_HOST || "localhost";
const port = process.env.SIPPROXY_API_PORT || "4567";
const username = process.env.SIPPROXY_API_USERNAME || "admin";
const secret = process.env.SIPPROXY_API_SECRET || "changeit";
const apiUrl = `https://${host}:${port}/api/v1beta1`;
module.exports = new routr_client_1.default(apiUrl, username, secret);
