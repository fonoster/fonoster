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
import { expect } from "chai";
import { toConnectionDetails } from "../src/client/AbstractClient";
import {
  ConnectionCapabilities,
  GetCapabilitiesResponse,
  PortRange,
  SipEndpoint
} from "../src/generated/node/capabilities_pb";

describe("@sdk[capabilities] connection details", function () {
  it("maps the SIP endpoints, addresses and RTP ports", function () {
    const sip = new SipEndpoint();
    sip.setHost("192.0.2.10");
    sip.setPort(5060);
    sip.setTransport("udp");
    const ports = new PortRange();
    ports.setMin(10000);
    ports.setMax(10999);
    const connection = new ConnectionCapabilities();
    connection.setSipList([sip]);
    connection.setSignalingAddressesList(["192.0.2.10"]);
    connection.setMediaAddressesList(["192.0.2.11"]);
    connection.setRtpPorts(ports);
    const response = new GetCapabilitiesResponse();
    response.setConnection(connection);

    // Through the wire format, as the client receives it.
    const received = GetCapabilitiesResponse.deserializeBinary(
      response.serializeBinary()
    );

    expect(toConnectionDetails(received)).to.deep.equal({
      sip: [{ host: "192.0.2.10", port: 5060, transport: "udp" }],
      signalingAddresses: ["192.0.2.10"],
      mediaAddresses: ["192.0.2.11"],
      rtpPorts: { min: 10000, max: 10999 }
    });
  });

  it("is empty for a server without the field", function () {
    expect(toConnectionDetails(new GetCapabilitiesResponse())).to.deep.equal({
      sip: [],
      signalingAddresses: [],
      mediaAddresses: [],
      rtpPorts: undefined
    });
  });
});
