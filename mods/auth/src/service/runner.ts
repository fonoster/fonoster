#!/usr/bin/env node
import { Tracer as T } from "@fonoster/common";
T.init("auth-service");

import { AuthService } from "./protos/auth_grpc_pb";
import { runServices } from "@fonoster/common";
import { getSalt } from "@fonoster/certs";
import AuthServer from "./auth";
import logger from "@fonoster/logger";
import Auth from "../utils/auth_utils";
import JWT from "../utils/jwt";
import express from "express";

const app = express();

import AuthMiddleware from "../auth_middleware";
const authenticator = new Auth(new JWT());

app.get("/session_auth", async (req, res) => {
  const sessionToken = req.headers["x-session-token"] as string;
  const result = await authenticator.validateToken(
    { accessToken: sessionToken },
    getSalt()
  );

  if (!sessionToken || result.isValid === false) {
    res.status(401);
    res.send("Unauthorized");
    return;
  }

  res.status(200);
  res.send("Access granted");
});

// First starting the http 1.1 auth endpoint
app.listen(3000, () => {
  logger.info(`starting simple authentication service @ ${3000}`);

  const services = [
    {
      name: "auth",
      version: "v1beta1",
      service: AuthService,
      server: new AuthServer()
    }
  ];

  const middleware = {
    name: "authentication",
    middlewareObj: new AuthMiddleware(getSalt(), null).middleware
  };

  runServices(services, [middleware]);
});
