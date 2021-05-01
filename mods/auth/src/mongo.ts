import mongoose from "mongoose";
import logger from "@fonos/logger";

const host = process.env.DS_AUTH_HOST || "localhost";
const port = process.env.DS_AUTH_PORT || 27017;
const dbname = process.env.DS_AUTH_DB || "fonos_auth";

let credentials =
  process.env.DS_AUTH_USERNAME && process.env.DS_SECRET
    ? `${process.env.DS_AUTH_USERNAME}:${process.env.DS_SECRET}@`
    : "";

export const db = `mongodb://${credentials}${host}:${port}/${dbname}`;

const mongoConnection = async() => {
  try { 
    await mongoose.connect(db, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useFindAndModify: false,
        useCreateIndex: true,
        autoIndex: false
      });

    // Hidding credentials...
    if (credentials.length > 0) {
      credentials = `${process.env.DS_AUTH_USERNAME}:*****@`;
    }
    logger.info(`Successfully connected to mongodb://${credentials}${host}:${port}/${dbname}`);
  } catch(error) {
    logger.error("Error connecting to database: ", error);
    process.exit(1);
  }
};

export default mongoConnection;