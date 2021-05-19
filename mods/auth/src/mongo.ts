import mongoose from "mongoose";
import logger from "@fonos/logger";

const host = process.env.DS_AUTH_HOST || "localhost";
const port = process.env.DS_AUTH_PORT || 27017;
const dbname = process.env.DS_AUTH_DB || "fonos_auth";

const credentials =
  process.env.DS_AUTH_USERNAME && process.env.DS_AUTH_SECRET
    ? `${process.env.DS_AUTH_USERNAME}:${process.env.DS_AUTH_SECRET}@`
    : "";

export const db = `mongodb://${credentials}${host}:${port}/${dbname}`;

export default async function () {
  try {
    await mongoose.connect(db, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
      useCreateIndex: true,
      autoIndex: false
    });
    logger.info(`@fonos/auth mongo [connected to db ${dbname}]`);
  } catch (e) {
    logger.error("Error connecting to database: ", e);
    process.exit(1);
  }
}
