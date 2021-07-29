/**
 * The simplest Voice Application you can build in Fonos
 */
const { VoiceServer } = require("@fonos/voice");
voiceServer.listen((req, res) => {
  res.play("sound:tt-monkeys");
});