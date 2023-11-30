import Redis from "ioredis";
import { REDIS_HOST, REDIS_PORT, REDIS_SECRET } from "../envs";

const secret = REDIS_SECRET
  ? `:${REDIS_SECRET}@`
  : "";

const redis = () => new Redis(`redis://${secret}${REDIS_HOST}:${REDIS_PORT}`);

export default redis;