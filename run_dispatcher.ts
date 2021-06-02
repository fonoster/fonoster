#!/usr/bin/env node
import dotenv from "dotenv";
import {join} from "path";

if (process.env.NODE_ENV === "dev") {
  dotenv.config({path: join(__dirname, ".env")});
}

import "./mods/dispatcher/src/dispatcher";
