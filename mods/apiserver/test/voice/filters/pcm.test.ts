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
import { bufferToInt16, int16ToBuffer } from "../../../src/voice/filters";

describe("@voice/filters/pcm", function () {
  it("reads little-endian samples from an aligned buffer", function () {
    // Arrange
    const buffer = Buffer.from([0x01, 0x00, 0xff, 0xff]);

    // Act & Assert
    expect(Array.from(bufferToInt16(buffer))).to.deep.equal([1, -1]);
  });

  it("reads a buffer that starts at an odd byte offset", function () {
    // Arrange
    const buffer = Buffer.from([0x99, 0x02, 0x00, 0x03, 0x00]).subarray(1);

    // Act
    const samples = bufferToInt16(buffer);

    // Assert
    expect(buffer.byteOffset % 2).to.equal(1);
    expect(Array.from(samples)).to.deep.equal([2, 3]);
  });

  it("round-trips samples to bytes", function () {
    // Arrange
    const buffer = Buffer.from([0x99, 0x10, 0x20, 0x30, 0x40]).subarray(1);

    // Act
    const roundTrip = int16ToBuffer(bufferToInt16(buffer));

    // Assert
    expect(roundTrip.equals(buffer)).to.be.true;
  });
});
