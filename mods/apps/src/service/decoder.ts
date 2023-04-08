/*
 * Copyright (C) 2023 by Fonoster Inc (https://fonoster.com)
 * http://github.com/fonoster/fonoster
 *
 * This file is part of Fonoster
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
import { Struct } from "google-protobuf/google/protobuf/struct_pb";
import { AppsPB } from "../client/apps";
import { App } from "./protos/apps_pb";

export default (raw: string): App => {
  const appJSON = JSON.parse(raw);
  const app = new App();
  const transferConfig = new AppsPB.TransferConfig();
  transferConfig.setMessage(appJSON?.transferConfig?.message);
  transferConfig.setMessageBusy(appJSON?.transferConfig?.messageBusy);
  transferConfig.setMessageNoAnswer(appJSON?.transferConfig?.messageNoAnswer);

  app.setRef(appJSON.ref);
  app.setAccessKeyId(appJSON.accessKeyId);
  app.setInitialDtmf(appJSON.initialDtmf);
  app.setActivationIntentId(appJSON.activationIntentId);
  app.setActivationTimeout(appJSON.activationTimeout);
  app.setInteractionTimeout(appJSON.interactionTimeout);
  app.setEnableEvents(appJSON.enableEvents);
  app.setTransferConfig(transferConfig);
  app.setIntentsEngineConfig(
    Struct.fromJavaScript(
      appJSON.intentsEngineConfig as unknown as Record<string, unknown>
    ) as unknown as Struct
  );
  app.setSpeechConfig(
    Struct.fromJavaScript(
      appJSON.speechConfig as unknown as Record<string, unknown>
    ) as unknown as Struct
  );
  app.setName(appJSON.name);
  app.setUpdateTime(appJSON.updateTime);
  app.setCreateTime(appJSON.createTime);
  return app;
};
