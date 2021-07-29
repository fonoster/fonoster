const GoogleTTS = require("@fonos/googletts");
const { join } = require("path");
const PROJECT_ID = "clever-tube-275321";

// You need to have a set of Google credentials for this to work
function getCredentials() {
  return {
    PROJECT_ID,
    keyFilename: join(__dirname, `../google_credentials.json`)
  };
}


module.exports = {
  tts: new GoogleTTS(getCredentials())
};
