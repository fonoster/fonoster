import RoutrClient from "./routr_client";

const host =
  process.env.SIPPROXY_API_HOST || process.env.SIPPROXY_HOST || "localhost";
const port = process.env.SIPPROXY_API_PORT || "4567";
const username = process.env.SIPPROXY_API_USERNAME || "admin";
const secret = process.env.SIPPROXY_API_SECRET || "changeit";
const apiUrl = `https://${host}:${port}/api/v1beta1`;

export const routr = new RoutrClient(apiUrl, username, secret);
