/**
 * Copyright (C) 2025 by Fonoster Inc (https://fonoster.com)
 * http://github.com/fonoster/fonoster
 *
 * This file is part of Fonoster
 *
 * Licensed under the MIT License (the "License");
 * you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 *
 *    https://opensource.org/licenses/MIT
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { expect } from "chai";
import { AddressInfo } from "net";
import WebSocket from "ws";
import { DeepgramSttAdapter } from "../src/deepgram";
import { Transcript } from "../src/speech";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const results = (text: string, final = true) =>
  JSON.stringify({
    type: "Results",
    is_final: final,
    channel: { alternatives: [{ transcript: text, confidence: 0.9 }] }
  });

/** A local stand-in for Deepgram's /v1/listen: records what each connection receives. */
async function fakeListen(
  onConnection: (socket: WebSocket) => void = () => {}
) {
  const server = new WebSocket.Server({
    host: "127.0.0.1",
    port: 0,
    path: "/v1/listen"
  });
  await new Promise((r) => server.once("listening", r));
  const text: string[] = [];
  let frames = 0;
  const sockets: WebSocket[] = [];
  server.on("connection", (socket) => {
    sockets.push(socket);
    socket.on("message", (d, binary) => {
      if (binary) frames++;
      else text.push(d.toString());
    });
    onConnection(socket);
  });
  const port = (server.address() as AddressInfo).port;
  return {
    server,
    sockets,
    text,
    frames: () => frames,
    url: `http://127.0.0.1:${port}`
  };
}

const open = (url: string) =>
  new DeepgramSttAdapter({ apiKey: "k", baseUrl: url }).open({
    language: "en"
  });

describe("@fonoster/community Deepgram STT finalize", function () {
  it("sends only Finalize on an open socket; audio and Results keep flowing", async function () {
    const v = await fakeListen((socket) =>
      socket.on("message", (d, binary) => {
        if (!binary && JSON.parse(d.toString()).type === "Finalize")
          socket.send(results("one, two"));
        if (binary) socket.send(results("three", false));
      })
    );
    const stt = open(v.url);
    const heard: Transcript[] = [];
    stt.on("transcript", (t: Transcript) => heard.push(t));
    await sleep(100);
    stt.finalize();
    await sleep(100);
    stt.write(Buffer.alloc(640));
    await sleep(100);
    // Exactly one Finalize, and no CloseStream: the stream stays open.
    expect(v.text).to.deep.equal(['{"type":"Finalize"}']);
    expect(v.frames()).to.equal(1);
    stt.close();
    v.server.close();
    expect(heard.map((t) => [t.text, t.final])).to.deep.equal([
      ["one, two", true],
      ["three", false]
    ]);
  });

  it("sends nothing while reconnecting or once closed", async function () {
    const v = await fakeListen();
    const stt = open(v.url);
    // Still connecting: nothing is sent or queued for later.
    stt.finalize();
    await sleep(100);
    expect(v.text).to.deep.equal([]);
    // Deepgram drops the stream; the adapter reconnects after 250 ms.
    v.sockets[0].close(1011, "NET-0000");
    await sleep(50);
    stt.finalize();
    await sleep(400);
    expect(v.sockets).to.have.length(2);
    expect(v.text).to.deep.equal([]);
    stt.close();
    await sleep(50);
    const sent = v.text.length;
    stt.finalize();
    await sleep(50);
    v.server.close();
    expect(v.text.slice(sent)).to.deep.equal([]);
  });
});
