"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateResource = exports.createResource = exports.getAccessKeyId = exports.getRedisConnection = exports.routr = exports.ResourceBuilder = exports.Kind = exports.ResourceServer = void 0;
/*
 * Copyright (C) 2021 by Fonoster Inc (https://fonoster.com)
 * http://github.com/fonoster/fonos
 *
 * This file is part of Project Fonos
 *
 * Licensed under the MIT License (the "License");
 * you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 *
 *    https://opensource.org/licenses/MIT
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const get_access_key_id_1 = __importDefault(require("./common/get_access_key_id"));
exports.getAccessKeyId = get_access_key_id_1.default;
const redis_1 = __importDefault(require("./common/redis"));
exports.getRedisConnection = redis_1.default;
const routr_1 = __importDefault(require("./common/routr"));
exports.routr = routr_1.default;
const resource_server_1 = __importDefault(require("./resources/resource_server"));
exports.ResourceServer = resource_server_1.default;
const create_resource_1 = __importDefault(require("./resources/create_resource"));
exports.createResource = create_resource_1.default;
const update_resource_1 = __importDefault(require("./resources/update_resource"));
exports.updateResource = update_resource_1.default;
const resource_builder_1 = require("./common/resource_builder");
Object.defineProperty(exports, "Kind", { enumerable: true, get: function () { return resource_builder_1.Kind; } });
Object.defineProperty(exports, "ResourceBuilder", { enumerable: true, get: function () { return resource_builder_1.ResourceBuilder; } });
