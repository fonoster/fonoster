import FonosService from "./common/fonos_service";
import {ServiceOptions} from "./common/types";
import {getClientCredentials, getServerCredentials} from "./common/trust_util";
import getAccessKeyId from "./common/get_access_key_id"
import {
  extract,
  removeDirSync,
  uploadToFS,
  getFilesizeInBytes,
  fsInstance
} from "./common/utils";
import runService from "./service_runner"
import routr from "./common/routr"
import redis from "./common/redis"
import ResourceServer from "./resources/resource_server";
import createResource from "./resources/create_resource";
import updateResource from "./resources/update_resource";
import { Kind, REncoder } from "./common/resource_encoder"

export {
  ResourceServer,
  ServiceOptions,
  FonosService,
  Kind,
  REncoder,
  routr,
  redis,
  getClientCredentials,
  getServerCredentials,
  getAccessKeyId,
  extract,
  removeDirSync,
  uploadToFS,
  getFilesizeInBytes,
  fsInstance,
  runService,
  createResource,
  updateResource
};
