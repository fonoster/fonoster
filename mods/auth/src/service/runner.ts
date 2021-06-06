#!/usr/bin/env node
import AuthServer from "./auth";
import {AuthService} from "./protos/auth_grpc_pb";
import {runServices} from "@fonos/common";
import logger from "@fonos/logger";
import express from "express";
const app = express()
import Auth from "../utils/auth_utils";
import JWT from "../utils/jwt";
import { getSalt } from "@fonos/certs";
const authenticator = new Auth(new JWT());

app.get('/session_auth', async(req, res) => {
  const sessionToken = req.headers["x-session-token"];
  const result = await authenticator.validateToken(
    {accessToken: sessionToken},
    getSalt()
  );

  if (!sessionToken || result.isValid === false) {
    res.status(401);
    res.send("Unauthorized");
    return;
  }

  res.status(200);
  res.send("Access granted")
})

// First starting the http 1.1 auth endpoint
app.listen(3000, () => {
  logger.info(`starting simple authentication service @ ${3000}`);

  const services = [
    {
      name: "auth",
      version: "v1alpha1",
      service: AuthService,
      server: new AuthServer()
    }
  ];
  
  runServices(services, []);
})

