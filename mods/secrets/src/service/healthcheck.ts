#!/usr/bin/env node
import {healthcheck} from "@fonos/common";
import axios from "axios";
import logger from "@fonos/logger";

// First checks the grpc health
//healthcheck();

// Next, ensure vault is up
axios
  .get(`${process.env.VAULT_ADDR}/v1/sys/health`)
  .then((result) => {
    if (!result.data || result.data.sealed) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  })
  .catch((e) => {
    logger.error(e);
    process.exit(1);
  });
