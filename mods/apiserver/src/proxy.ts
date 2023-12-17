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
import { getLogger } from "../../logger/src";
import {
  APISERVER_ASTERISK_ARI_INTERNAL_URL,
  APISERVER_ASTERISK_ARI_USERNAME,
  APISERVER_ASTERISK_ARI_SECRET
} from "./envs";
import btoa from "btoa";
import express from "express";
import httpProxy from "http-proxy";

const logger = getLogger({ service: "apiserver", filePath: __filename });

const PORT = 4000;
const proxy = httpProxy.createProxyServer({});
const app = express();
const TARGET_SERVER = `${APISERVER_ASTERISK_ARI_INTERNAL_URL}/ari`;

proxy.on("proxyReq", (proxyReq) => {
  const encodedCredentials = btoa(
    `${APISERVER_ASTERISK_ARI_USERNAME}:${APISERVER_ASTERISK_ARI_SECRET}`
  );
  proxyReq.setHeader("Authorization", `Basic ${encodedCredentials}`);
});

app.use("/ari", (req, res) => {
  const targetUrl = TARGET_SERVER + req.url;

  logger.verbose(`proxying request to ${targetUrl}`, {
    targetUrl,
    url: req.url
  });

  proxy.web(req, res, { target: targetUrl, changeOrigin: true });
});

app.listen(PORT, () => {
  logger.info(`proxy server is running on http://localhost:${PORT}`);
});
