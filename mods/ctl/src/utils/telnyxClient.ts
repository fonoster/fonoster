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
import { TELNYX_API_BASE } from "../constants";

type TelnyxApiError = {
  code: string;
  title: string;
  detail?: string;
  source?: { pointer?: string };
};

type TelnyxEnvelope<T> = { data?: T; errors?: TelnyxApiError[] };

type TelnyxPhoneNumber = { id: string; phone_number: string };

type TelnyxConnection = {
  id: string;
  connection_name: string;
  user_name?: string;
  password?: string;
};

type TelnyxVoiceProfile = { id: string };

type TelnyxFqdn = { id: string; fqdn: string; connection_id: string };

type TelnyxListMeta = { total_pages: number; page_size: number };

const PAGE_SIZE = 250;

/**
 * A small client for the parts of the Telnyx API the link flow needs.
 *
 * It uses plain requests instead of the official `telnyx` package: that package is
 * generated from the OpenAPI spec, and its create params do not carry the FQDN
 * connection's `user_name` and `password`, which the flow requires.
 */
class TelnyxClient {
  private readonly apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async request<T>(
    method: "GET" | "POST" | "PATCH",
    path: string,
    body?: unknown
  ): Promise<T> {
    const response = await fetch(`${TELNYX_API_BASE}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "content-type": "application/json"
      },
      ...(body ? { body: JSON.stringify(body) } : {})
    });

    const result = (await response.json()) as TelnyxEnvelope<T>;

    if (result.errors?.length) {
      throw new Error(
        `${result.errors[0].title}${
          result.errors[0].detail ? `: ${result.errors[0].detail}` : ""
        }`
      );
    }

    return result.data as T;
  }

  /**
   * Lists a resource across pages, so the caller can filter by a field the API
   * does not offer as a filter.
   */
  private async requestAllPages(
    path: string,
    page = 1
  ): Promise<Array<unknown>> {
    const response = await fetch(
      `${TELNYX_API_BASE}${path}?page[number]=${page}&page[size]=${PAGE_SIZE}`,
      { headers: { Authorization: `Bearer ${this.apiKey}` } }
    ).then(
      (r) =>
        r.json() as Promise<
          TelnyxEnvelope<Array<unknown>> & { meta: TelnyxListMeta }
        >
    );

    if (response.errors?.length) {
      throw new Error(
        `${response.errors[0].title}${
          response.errors[0].detail ? `: ${response.errors[0].detail}` : ""
        }`
      );
    }

    const items = response.data ?? [];

    if ((response.meta?.total_pages ?? page) <= page) {
      return items;
    }

    return items.concat(await this.requestAllPages(path, page + 1));
  }

  /**
   * Finds a phone number in the account. The filter takes digits only: it is
   * numerical, so the "+" of E.164 goes.
   */
  async findPhoneNumber(
    phoneNumber: string
  ): Promise<TelnyxPhoneNumber | undefined> {
    const numbers = await this.request<TelnyxPhoneNumber[]>(
      "GET",
      `/phone_numbers?filter[phone_number]=${phoneNumber.replace(/\D/g, "")}`
    );
    return numbers?.[0];
  }

  async listFqdnConnections(): Promise<TelnyxConnection[]> {
    return (await this.requestAllPages(
      "/fqdn_connections"
    )) as TelnyxConnection[];
  }

  async createOutboundVoiceProfile(name: string): Promise<TelnyxVoiceProfile> {
    return this.request<TelnyxVoiceProfile>(
      "POST",
      "/outbound_voice_profiles",
      {
        name,
        traffic_type: "conversational",
        service_plan: "global"
      }
    );
  }

  async createFqdnConnection(params: {
    connectionName: string;
    userName: string;
    password: string;
    outboundVoiceProfileId: string;
  }): Promise<TelnyxConnection> {
    return this.request<TelnyxConnection>("POST", "/fqdn_connections", {
      active: true,
      connection_name: params.connectionName,
      user_name: params.userName,
      password: params.password,
      inbound: {
        ani_number_format: "+E.164",
        dnis_number_format: "+e164"
      },
      outbound: {
        outbound_voice_profile_id: params.outboundVoiceProfileId
      },
      transport_protocol: "UDP"
    });
  }

  async listFqdns(): Promise<TelnyxFqdn[]> {
    return (await this.requestAllPages("/fqdns")) as TelnyxFqdn[];
  }

  async createFqdn(params: {
    connectionId: string;
    fqdn: string;
  }): Promise<TelnyxFqdn> {
    return this.request<TelnyxFqdn>("POST", "/fqdns", {
      connection_id: params.connectionId,
      fqdn: params.fqdn,
      port: 5060,
      dns_record_type: "a"
    });
  }

  /**
   * Points a phone number at a connection, so Telnyx sends its calls to the
   * connection's FQDNs.
   */
  async assignNumberToConnection(
    phoneNumberId: string,
    connectionId: string
  ): Promise<void> {
    await this.request("PATCH", `/phone_numbers/${phoneNumberId}`, {
      connection_id: connectionId
    });
  }
}

export { TelnyxClient };
export type { TelnyxConnection, TelnyxFqdn, TelnyxPhoneNumber };
