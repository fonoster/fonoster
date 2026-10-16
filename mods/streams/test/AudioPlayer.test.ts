/*
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
import fs from "fs";
import net from "net";
import { Readable } from "stream";
import * as chai from "chai";
import { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import sinon, { createSandbox } from "sinon";
import sinonChai from "sinon-chai";
import { AudioPlayer } from "../src/AudioPlayer";

chai.use(chaiAsPromised);
chai.use(sinonChai);
const sandbox = createSandbox();

describe("@streams/AudioPlayer", function () {
  let socket: net.Socket;
  let audioPlayer: AudioPlayer;

  beforeEach(function () {
    socket = new net.Socket();
    // Stub write immediately to prevent socket errors
    sandbox.stub(socket, "write").returns(true);
    audioPlayer = new AudioPlayer(socket);
  });

  afterEach(function () {
    // Stop the player to clean up any active streams before restoring sandbox
    audioPlayer.stop();
    sandbox.restore();
  });

  it("should create a new instance", function () {
    // Arrange & Act
    const player = new AudioPlayer(socket);

    // Assert
    expect(player).to.be.instanceOf(AudioPlayer);
  });

  it("should not mix audio when playStream is called while another stream is playing", async function () {
    // Arrange
    const writtenData: string[] = [];
    let firstStreamReadCount = 0;
    const firstStream = new Readable({
      read() {
        if (firstStreamReadCount < 10) {
          this.push(Buffer.from("stream1-data"));
          firstStreamReadCount++;
        } else {
          this.push(null); // End stream
        }
      }
    });

    let secondStreamReadCount = 0;
    const secondStream = new Readable({
      read() {
        if (secondStreamReadCount < 3) {
          this.push(Buffer.from("stream2-data"));
          secondStreamReadCount++;
        } else {
          this.push(null); // End stream
        }
      }
    });

    // Replace the default stub with one that tracks data
    (socket.write as sinon.SinonStub).callsFake((data: Buffer) => {
      // Extract the payload after the header (first 4 bytes)
      const payload = data.subarray(4).toString();
      writtenData.push(payload);
      return true;
    });

    // Act - Start first stream
    audioPlayer.playStream(firstStream);

    // Wait a bit to ensure first stream is active
    await new Promise((resolve) => setTimeout(resolve, 30));

    // Start second stream while first is still playing
    const secondPlayPromise = audioPlayer.playStream(secondStream);

    // Wait for second stream to complete
    await Promise.race([
      secondPlayPromise,
      new Promise((resolve) => setTimeout(resolve, 500))
    ]);

    // Assert - After second stream starts, no stream1 data should be written
    // Find the first occurrence of stream2-data
    const firstStream2Index = writtenData.findIndex((d) =>
      d.includes("stream2")
    );

    // All data after stream2 starts should be stream2-data only
    const dataAfterStream2 = writtenData.slice(firstStream2Index);
    const mixedData = dataAfterStream2.filter((d) => d.includes("stream1"));
    expect(mixedData).to.have.length(0);
  });

  it("should stop active stream when play() is called", async function () {
    // Arrange
    const writtenData: string[] = [];
    let readCount = 0;
    const activeStream = new Readable({
      read() {
        if (readCount < 10) {
          this.push(Buffer.from("stream-data"));
          readCount++;
        } else {
          this.push(null);
        }
      }
    });

    // Replace the default stub with one that tracks data
    (socket.write as sinon.SinonStub).callsFake((data: Buffer) => {
      const payload = data.subarray(4).toString();
      writtenData.push(payload);
      return true;
    });
    sandbox.stub(fs, "readFileSync").returns(Buffer.from("file-data"));

    // Act - Start stream
    audioPlayer.playStream(activeStream);

    // Wait a bit
    await new Promise((resolve) => setTimeout(resolve, 30));

    // Call play() which should stop the active stream
    await audioPlayer.play("test-file");

    // Assert - After play() is called, no more stream data should be written
    const fileDataIndex = writtenData.findIndex((d) => d.includes("file-data"));
    const dataAfterFile = writtenData.slice(fileDataIndex);
    const streamDataAfterFile = dataAfterFile.filter((d) =>
      d.includes("stream-data")
    );
    expect(streamDataAfterFile).to.have.length(0);
  });

  it("should stop active stream when stop() is called", async function () {
    // Arrange
    const writtenData: string[] = [];
    let readCount = 0;
    const activeStream = new Readable({
      read() {
        if (readCount < 10) {
          this.push(Buffer.from("data"));
          readCount++;
        } else {
          this.push(null);
        }
      }
    });

    // Replace the default stub with one that tracks data
    (socket.write as sinon.SinonStub).callsFake((data: Buffer) => {
      writtenData.push(data.subarray(4).toString());
      return true;
    });

    // Act
    audioPlayer.playStream(activeStream);
    await new Promise((resolve) => setTimeout(resolve, 30));
    const dataBeforeStop = writtenData.length;
    audioPlayer.stop();
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Assert - No more data should be written after stop
    expect(writtenData.length).to.equal(dataBeforeStop);
  });

  // 320 bytes of slin (8kHz, 16-bit) is 20ms of audio; the player paces one
  // slice every 20ms, so N slices take roughly N * 20ms to write.
  const audio = (slices: number) => Buffer.alloc(slices * 320, 1);

  it("should not resolve playStream until the source ends and all audio is written", async function () {
    // Arrange: a source that delivers a second chunk only after the first
    // one has fully drained (what chunked TTS synthesis produces)
    const source = new Readable({ read() {} });
    let resolvedAt: number | null = null;
    const startedAt = Date.now();

    // Act
    const playback = audioPlayer.playStream(source).then(() => {
      resolvedAt = Date.now() - startedAt;
    });
    source.push(audio(5)); // ~100ms of audio, available immediately

    // The first chunk has drained by now, but the source has not ended
    await new Promise((resolve) => setTimeout(resolve, 250));
    expect(resolvedAt).to.equal(null);

    source.push(audio(5)); // ~100ms more
    source.push(null); // source ends; the second chunk is still unwritten

    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(resolvedAt).to.equal(null);

    await playback;

    // Assert: resolved only after the second chunk was written (~350ms+)
    expect(resolvedAt).to.be.at.least(340);
    expect(socket.write).to.have.callCount(10);
  });

  it("should resolve playStream when the source ends with nothing left to write", async function () {
    // Arrange
    const source = new Readable({ read() {} });

    // Act
    const playback = audioPlayer.playStream(source);
    source.push(audio(2));
    source.push(null);

    // Assert
    await expect(playback).to.eventually.be.fulfilled;
    expect(socket.write).to.have.callCount(2);
  });

  it("should resolve playStream when the source ends without data", async function () {
    // Arrange
    const source = new Readable({ read() {} });

    // Act
    const playback = audioPlayer.playStream(source);
    source.push(null);

    // Assert
    await expect(playback).to.eventually.be.fulfilled;
    expect(socket.write).to.not.have.been.called;
  });

  it("should resolve playStream when stop() is called mid-playback", async function () {
    // Arrange
    const source = new Readable({ read() {} });
    const playback = audioPlayer.playStream(source);
    source.push(audio(50)); // ~1s of audio

    await new Promise((resolve) => setTimeout(resolve, 50));

    // Act
    audioPlayer.stop();

    // Assert
    await expect(playback).to.eventually.be.fulfilled;
    expect((socket.write as sinon.SinonStub).callCount).to.be.below(50);
  });

  it("should resolve playStream when stop() is called before any data arrives", async function () {
    // Arrange
    const source = new Readable({ read() {} });
    const playback = audioPlayer.playStream(source);

    // Act
    audioPlayer.stop();

    // Assert
    await expect(playback).to.eventually.be.fulfilled;
  });

  it("should resolve the previous playStream when a new one starts", async function () {
    // Arrange
    const first = new Readable({ read() {} });
    const second = new Readable({ read() {} });
    const firstPlayback = audioPlayer.playStream(first);
    first.push(audio(50));

    await new Promise((resolve) => setTimeout(resolve, 50));

    // Act
    const secondPlayback = audioPlayer.playStream(second);
    second.push(audio(1));
    second.push(null);

    // Assert
    await expect(firstPlayback).to.eventually.be.fulfilled;
    await expect(secondPlayback).to.eventually.be.fulfilled;
  });

  it("should reject playStream when the source errors", async function () {
    // Arrange
    const source = new Readable({ read() {} });
    const playback = audioPlayer.playStream(source);

    // Act
    source.emit("error", new Error("synthesis failed"));

    // Assert
    await expect(playback).to.eventually.be.rejectedWith("synthesis failed");
  });

});
