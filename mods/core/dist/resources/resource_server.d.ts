import grpc from "@grpc/grpc-js";
import { Kind } from "../common/resource_builder";
import { ListResourceResponse } from "./types";
export default class ResourceServer {
    static listResources(kind: Kind, call: grpc.ServerUnaryCall<any, ListResourceResponse>): Promise<ListResourceResponse>;
    static getResource(kind: Kind, call: grpc.ServerUnaryCall<any, unknown>): Promise<unknown>;
    static deleteResource(kind: Kind, call: grpc.ServerUnaryCall<any, any>): Promise<void>;
}
