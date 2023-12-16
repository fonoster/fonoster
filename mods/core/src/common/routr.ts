import {
  APISERVER_ROUTR_API_HOST,
  APISERVER_ROUTR_API_PORT,
  APISERVER_ROUTR_API_SECRET,
  APISERVER_ROUTR_API_USERNAME
} from "../envs";
import RoutrClient from "./routr_client";

const apiUrl = `https://${APISERVER_ROUTR_API_HOST}:${APISERVER_ROUTR_API_PORT}/api/v1beta1`;

export const routr = new RoutrClient(
  apiUrl,
  APISERVER_ROUTR_API_USERNAME,
  APISERVER_ROUTR_API_SECRET
);
