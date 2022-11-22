import fs from "fs";
import jwt from "jsonwebtoken";
import { forge } from "acme-client";
import { join } from "path";
import { homedir } from "os";
import btoa from "btoa";

const BASE_DIR = join(homedir(), ".fonoster");
const PATH_TO_SALT = join(BASE_DIR, "private_key");
const PATH_TO_CONFIG = join(BASE_DIR, "config");
const ACCESS_KEY_ID = process.env.ACCESS_KEY_ID || "fonoster";
const AUTH_ISS = process.env.AUTH_ISS || "fonoster";

const getContent = (workdir: string, file: string) =>
  btoa(fs.readFileSync(`${workdir}/${file}`).toString("utf-8"));

if (!fs.existsSync(BASE_DIR)) fs.mkdirSync(BASE_DIR);

const getSalt = () => fs.readFileSync(PATH_TO_SALT).toString().trim();
const configExist = () => fs.existsSync(PATH_TO_CONFIG);
const saltExist = () => fs.existsSync(PATH_TO_SALT);

async function createAccessFile() {
  if (!saltExist()) {
    fs.writeFileSync(PATH_TO_SALT, await forge.createPrivateKey());
  }

  const salt = getSalt();
  const claims = { AUTH_ISS, sub: ACCESS_KEY_ID };
  const config = {
    accessKeyId: ACCESS_KEY_ID,
    accessKeySecret: jwt.sign(claims, salt)
  };
  fs.writeFileSync(PATH_TO_CONFIG, JSON.stringify(config, null, " "));
  return config;
}

const writeConfig = (config: string, pathToConfig: string, workdir: string) => {
  const content = JSON.stringify(config, null, "");
  if (!fs.existsSync(workdir)) fs.mkdirSync(workdir, { recursive: true });
  fs.writeFileSync(pathToConfig, content);
};

function createServerConfig(workdir: string) {
  try {
    const pathToConfig = join(workdir, "config");
    const config = JSON.parse(fs.readFileSync(pathToConfig).toString("utf-8"));
    config.caCertificate = getContent(workdir, "ca.crt");
    config.serverCertificate = getContent(workdir, "server.crt");
    config.serverKey = getContent(workdir, "server.key");
    writeConfig(config, pathToConfig, workdir);
  } catch (e) {
    console.error(e);
  }
}

function createClientConfig(workdir: string) {
  try {
    const pathToConfig = join(workdir, "config");
    const config = JSON.parse(fs.readFileSync(pathToConfig).toString("utf-8"));
    config.caCertificate = getContent(workdir, "ca.crt");
    config.clientCertificate = getContent(workdir, "client.crt");
    config.clientKey = getContent(workdir, "client.key");
    writeConfig(config, pathToConfig, workdir);
  } catch (e) {
    console.error(e);
  }
}

export {
  createAccessFile as default,
  createServerConfig,
  createClientConfig,
  getSalt,
  configExist,
  saltExist,
  PATH_TO_SALT,
  PATH_TO_CONFIG,
  ACCESS_KEY_ID,
  AUTH_ISS
};
