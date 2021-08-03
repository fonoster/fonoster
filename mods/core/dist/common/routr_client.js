"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const btoa_1 = __importDefault(require("btoa"));
const routr_errors_1 = __importDefault(require("./routr_errors"));
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
/**
 * Oversimplified version of a Routr API Client
 */
class RoutrClient {
    constructor(apiUrl, username, secret) {
        this.apiUrl = apiUrl;
        this.username = username;
        this.secret = secret;
    }
    async connect() {
        this.token = await this.getToken(this.username, this.secret);
        return this;
    }
    resourceType(resource) {
        this.resource = resource;
        return this;
    }
    async getToken(username, password) {
        try {
            const response = await axios_1.default
                .create({
                baseURL: `${this.apiUrl}`,
                headers: { Authorization: `Basic ${btoa_1.default(username + ":" + password)}` }
            })
                .get("/token");
            return response.data.data;
        }
        catch (err) {
            routr_errors_1.default(err);
        }
    }
    async list(params) {
        const queryParams = (p) => Object.keys(p).map((k) => `${k}=${p[k]}`);
        try {
            const url = `${this.apiUrl}/${this.resource}?token=${this.token}&filter=*&${queryParams(params).join("&")}`;
            const response = await axios_1.default.get(url);
            return response.data;
        }
        catch (err) {
            routr_errors_1.default(err);
        }
    }
    async getDomainUriFromNumber(number) {
        const en = number.replace("+", "%2B");
        try {
            const url = `${this.apiUrl}/numbers?token=${this.token}&filter=@.spec.location.telUrl=='tel:${en}'`;
            const response = await axios_1.default.get(url);
            const numberObj = response.data.data[0];
            if (numberObj) {
                const url = `${this.apiUrl}/domains?token=${this.token}&filter=@.spec.context.egressPolicy.numberRef=='${numberObj.metadata.ref}'`;
                const res = await axios_1.default.get(url);
                const domainObj = res.data.data[0];
                if (domainObj) {
                    return domainObj;
                }
            }
        }
        catch (err) {
            routr_errors_1.default(err);
        }
    }
    async getNumber(number) {
        const en = number.replace("+", "%2B");
        try {
            const url = `${this.apiUrl}/numbers?token=${this.token}&filter=@.spec.location.telUrl=='tel:${en}'`;
            const response = await axios_1.default.get(url);
            const numberObj = response.data.data[0];
            return numberObj;
        }
        catch (err) {
            routr_errors_1.default(err);
        }
    }
    async get(ref) {
        const ep = `/${ref}`;
        try {
            const response = await axios_1.default.get(`${this.apiUrl}/${this.resource}${ep}?token=${this.token}`);
            return response.data.data;
        }
        catch (err) {
            routr_errors_1.default(err);
        }
    }
    async delete(ref) {
        const ep = `/${ref}`;
        try {
            await axios_1.default.delete(`${this.apiUrl}/${this.resource}${ep}?token=${this.token}`);
        }
        catch (err) {
            routr_errors_1.default(err);
        }
    }
    async create(data) {
        try {
            const response = await axios_1.default.post(`${this.apiUrl}/${this.resource}?token=${this.token}`, data);
            return response.data.data;
        }
        catch (err) {
            routr_errors_1.default(err);
        }
    }
    async update(data) {
        try {
            const ref = data.metadata.ref;
            const response = await axios_1.default.put(`${this.apiUrl}/${this.resource}/${ref}?token=${this.token}`, data);
            return response.data.data;
        }
        catch (err) {
            routr_errors_1.default(err);
        }
    }
}
exports.default = RoutrClient;
