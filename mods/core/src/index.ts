import FonosService from "./common/fonos_service";
import {ServiceOptions} from "./common/types";
import {getClientCredentials, getServerCredentials} from "./common/trust_util";
import getAccessKeyId from "./common/get_access_key_id"
import getRedisConnection from "./common/redis"
import {
  extract,
  removeDirSync,
  uploadToFS,
  getFilesizeInBytes,
  fsInstance
} from "./common/utils";
import runServices from "./service_runner"
import routr from "./common/routr"
import ResourceServer from "./resources/resource_server";
import createResource from "./resources/create_resource";
import updateResource from "./resources/update_resource";
import { Kind, ResourceBuilder } from "./common/resource_builder";

export {
  ResourceServer,
  ServiceOptions,
  FonosService,
  Kind,
  ResourceBuilder,
  routr,
  getRedisConnection,
  getClientCredentials,
  getServerCredentials,
  getAccessKeyId,
  extract,
  removeDirSync,
  uploadToFS,
  getFilesizeInBytes,
  fsInstance,
  runServices,
  createResource,
  updateResource
};
