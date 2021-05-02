import grpc from "grpc";
import {Kind} from "../common/resource_builder";
import getResourceHere from "./get_resource";
import listResourcesHere from "./list_resources";
import deleteResourceHere from "./delete_resource";
import getAccessKeyId from "../common/get_access_key_id";
import {ListResourceResponse} from "./types";

export default class ResourceServer {
  async listResources(
    kind: Kind,
    call: grpc.ServerUnaryCall<any>
  ): Promise<ListResourceResponse> {
    try {
      return await listResourcesHere({
        accessKeyId: getAccessKeyId(call),
        kind,
        page: parseInt(call.request.getPageToken()),
        itemsPerPage: call.request.getPageSize()
      });
    } catch (e) {
      return null;
    }
  }

  async getResource(
    kind: Kind,
    call: grpc.ServerUnaryCall<any>
  ): Promise<unknown> {
    try {
      return await getResourceHere({
        ref: call.request.getRef(),
        kind,
        accessKeyId: getAccessKeyId(call)
      });
    } catch (e) {
      return null;
    }
  }

  async deleteResource(kind: Kind, call: grpc.ServerUnaryCall<any>) {
    await deleteResourceHere({
      ref: call.request.getRef(),
      kind,
      accessKeyId: getAccessKeyId(call)
    });
  }
}
