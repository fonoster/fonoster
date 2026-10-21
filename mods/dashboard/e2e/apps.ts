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
/*
 * In-memory applications (agents and apps) behind GrpcWebMock. Create and Update
 * copy every field of the request onto the stored Application the way the API does
 * (an update replaces every column), the signing secret comes back only from create
 * and rotate, and the catalog offers the keyless fake provider.
 */
import { applications, providers, type GrpcWebMock } from "./grpc-web";

/** The fields CreateApplicationRequest and UpdateApplicationRequest share with Application. */
const FIELDS = [
  "Name",
  "Type",
  "Endpoint",
  "TextToSpeech",
  "SpeechToText",
  "Intelligence",
  "Url",
  "Protocol",
  "Speech",
  "Audio",
  "FallbackAppRef",
  "FallbackMessage",
  "ListenersList",
  "Recording",
  "Amd",
  "FiltersList"
];

const NOW = 1_760_000_000;

/* eslint-disable @typescript-eslint/no-explicit-any */
type Message = any;

function copyInto(target: Message, source: Message) {
  for (const field of FIELDS) {
    const get = source[`get${field}`];
    const set = target[`set${field}`];
    if (typeof get === "function" && typeof set === "function")
      set.call(target, get.call(source));
  }
}

export class FakeApplications {
  readonly apps = new Map<string, Message>();
  readonly secrets = new Map<string, string>();
  private seq = 0;

  /** Seeds an app; returns its ref. */
  add(
    name: string,
    type: "AUTOPILOT" | "STREAM",
    configure?: (app: Message) => void
  ) {
    this.seq += 1;
    const ref = `app-${this.seq}`;
    const app = new applications.Application();
    app.setRef(ref);
    app.setName(name);
    app.setType(applications.ApplicationType[type]);
    app.setCreatedAt(NOW);
    app.setUpdatedAt(NOW);
    if (type === "STREAM") {
      app.setUrl("wss://voice.acme.example/session");
      app.setProtocol("fonoster");
      app.setSigningSecretHint("abcd");
    }
    configure?.(app);
    this.apps.set(ref, app);
    return ref;
  }

  /** The saved application as plain values (decoded the way the dashboard sends it). */
  saved(ref: string) {
    return this.apps.get(ref)!.toObject();
  }

  install(api: GrpcWebMock) {
    api
      .on("Applications/ListApplications", () => {
        const list = new applications.ListApplicationsResponse();
        list.setItemsList([...this.apps.values()]);
        list.setNextPageToken("");
        return list;
      })
      .on("Applications/GetApplication", (bytes) => {
        const { ref } =
          applications.GetApplicationRequest.deserializeBinary(
            bytes
          ).toObject();
        return (
          this.apps.get(ref) ?? {
            error: { code: 5, message: `Application ${ref} not found` }
          }
        );
      })
      .on("Applications/CreateApplication", (bytes) => {
        const request =
          applications.CreateApplicationRequest.deserializeBinary(bytes);
        this.seq += 1;
        const ref = `app-${this.seq}`;
        const app = new applications.Application();
        copyInto(app, request);
        app.setRef(ref);
        app.setCreatedAt(NOW);
        app.setUpdatedAt(NOW);
        const response = new applications.CreateApplicationResponse();
        response.setRef(ref);
        if (app.getType() === applications.ApplicationType.STREAM) {
          const secret = `appsec_${ref}_first`;
          this.secrets.set(ref, secret);
          app.setSigningSecretHint(secret.slice(-4));
          response.setSigningSecret(secret);
          response.setSigningSecretHint(secret.slice(-4));
        }
        this.apps.set(ref, app);
        return response;
      })
      .on("Applications/UpdateApplication", (bytes) => {
        const request =
          applications.UpdateApplicationRequest.deserializeBinary(bytes);
        const app = this.apps.get(request.getRef());
        if (!app)
          return { error: { code: 5, message: "Application not found" } };
        copyInto(app, request);
        const response = new applications.UpdateApplicationResponse();
        response.setRef(request.getRef());
        return response;
      })
      .on("Applications/RotateSigningSecret", (bytes) => {
        const { ref } =
          applications.RotateSigningSecretRequest.deserializeBinary(
            bytes
          ).toObject();
        const secret = `appsec_${ref}_rotated`;
        this.secrets.set(ref, secret);
        this.apps.get(ref)?.setSigningSecretHint(secret.slice(-4));
        const response = new applications.RotateSigningSecretResponse();
        response.setRef(ref);
        response.setSigningSecret(secret);
        response.setSigningSecretHint(secret.slice(-4));
        return response;
      })
      .on("Applications/DeleteApplication", (bytes) => {
        const { ref } =
          applications.DeleteApplicationRequest.deserializeBinary(
            bytes
          ).toObject();
        this.apps.delete(ref);
        const response = new applications.DeleteApplicationResponse();
        response.setRef(ref);
        return response;
      })
      .on("Providers/ListCatalog", () => {
        const list = new providers.ListCatalogResponse();
        list.setItemsList(FAKE_CATALOG());
        return list;
      })
      .on(
        "Providers/ListProviderKeys",
        () => new providers.ListProviderKeysResponse()
      )
      .on("Providers/ListWarnings", () => new providers.ListWarningsResponse());
    return this;
  }
}

/** The keyless fake provider with one model of each kind and one voice. */
function FAKE_CATALOG() {
  const item = (id: string, kind: string, label: string, type?: string) => {
    const i = new providers.CatalogItem();
    const provider = id.split("/")[0];
    i.setId(id);
    i.setKind(kind);
    i.setLabel(label);
    i.setProviderId(provider);
    if (type) i.setType(type);
    if (kind === "provider") {
      // Only the fakes work without a key.
      i.setKeyless(provider === "fake");
      i.setCapabilitiesList(
        provider === "fake" ? ["stt", "tts", "llm"] : ["stt", "tts"]
      );
    }
    if (kind !== "provider") i.setLanguagesList(["en-US", "es-ES"]);
    return i;
  };
  return [
    item("fake", "provider", "Fakes"),
    item("fake/llm", "model", "Fake LLM", "llm"),
    item("fake/stt", "model", "Fake transcriber", "stt"),
    item("fake/default", "voice", "Fake voice", "tts"),
    // A keyed provider next to the fakes: a new agent must still prefer the keyless one.
    item("deepgram", "provider", "Deepgram"),
    item("deepgram/nova-3", "model", "Nova 3", "stt"),
    item("deepgram/aura-2-thalia-en", "voice", "Thalia", "tts")
  ];
}
/* eslint-enable @typescript-eslint/no-explicit-any */
