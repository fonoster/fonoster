import logger from "@fonos/logger";
import Storage from "@fonos/storage";
import MaryTTS from "@fonos/marytts";
import Verbs from "@fonos/voice";
import getIngressInfo from "./utils";
import fs from "fs";
import phone from "phone";
import {NodeVM} from "vm2";
const {AGIServer} = require("agi-node");
const vm = new NodeVM(require("../etc/vm.json"));
const SERVICE_PORT = process.env.AGI_PORT || 4573;

function dispatch(channel: any) {
  try {
    const maryTTSConfig = {
      host: process.env.TTS_ENGINE_HOST,
      port: process.env.TTS_ENGINE_PORT,
      locale: "EN_US"
    };
    const e164Number = phone(channel.getVariable("DID_INFO"))[0];
    const ingressInfo = getIngressInfo(e164Number);
    const contents = fs.readFileSync(ingressInfo.entryPoint, "utf8");
    const chann = new Verbs(channel, {
      tts: new MaryTTS(maryTTSConfig),
      storage: new Storage({}),
      bucket: "public",
      accessKeyId: ingressInfo.accessKeyId
    });
    vm.run(contents, ingressInfo.entryPoint)(chann);
  } catch (err) {
    logger.log("error", err);
  }
}

logger.log("info", `Fonos Media Controller is online @ ${SERVICE_PORT}`);

new AGIServer(dispatch, SERVICE_PORT);
