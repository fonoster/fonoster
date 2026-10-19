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
/**
 * The agent editor's form values, their validation, and the mapping to and
 * from the API's Application. Validation copies the rules of
 * @fonoster/common's sessionAgentSchema (common/src/agents), which
 * can't be imported into the browser bundle.
 */
import type {
  Application,
  CreateApplicationRequest,
  UpdateApplicationRequest
} from "@fonoster/types";
import { z } from "zod";
import { mergeUpdate } from "~/lib/app-request";

const POSITIVE = "Must be a positive number";
const NUMBER = "Enter a number";
const VALID_URL = "Must be a valid URL";
const BETWEEN_0_AND_2 = "Must be a number between 0 and 2";

const num = () => z.number({ invalid_type_error: NUMBER });
const positiveInt = () => num().int(POSITIVE).positive(POSITIVE);
const positive = () => num().positive(POSITIVE);

/** Function names the language model providers accept. */
const TOOL_NAME = /^[a-zA-Z0-9_-]{1,64}$/;
const RESERVED_HEADERS = ["accept", "content-type"];
const BUILT_IN_TOOLS = ["hangup", "transfer"];

const parameterSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name the parameter")
    .regex(/^[a-zA-Z0-9_]+$/, "Letters, numbers and underscores only"),
  type: z.string().min(1),
  format: z.enum(["", "enum", "date-time"]),
  required: z.boolean(),
  /** Keys the editor doesn't show (enum values, description…), kept as-is. */
  extra: z.record(z.unknown())
});

const headerSchema = z.object({
  key: z.string().trim(),
  value: z.string()
});

export const toolSchema = z
  .object({
    name: z
      .string()
      .trim()
      .regex(TOOL_NAME, "Letters, numbers, underscores and hyphens only")
      .refine((name) => !BUILT_IN_TOOLS.includes(name), {
        message: "That name is taken by a built-in tool"
      }),
    description: z.string().trim().min(1, "Describe when to use the tool"),
    method: z.enum(["get", "post"]),
    url: z.string().trim().url(VALID_URL),
    parametersType: z.enum(["object", "array"]),
    parameters: z.array(parameterSchema),
    headers: z.array(headerSchema),
    requestStartMessage: z.string(),
    waitForResponse: z.boolean()
  })
  .superRefine((tool, ctx) => {
    const seen = new Set<string>();
    tool.parameters.forEach((parameter, index) => {
      if (seen.has(parameter.name))
        ctx.addIssue({
          code: "custom",
          message: "Already used",
          path: ["parameters", index, "name"]
        });
      seen.add(parameter.name);
    });
    tool.headers.forEach((header, index) => {
      if (!header.key && !header.value) return;
      if (!header.key)
        ctx.addIssue({
          code: "custom",
          message: "Name the header",
          path: ["headers", index, "key"]
        });
      if (RESERVED_HEADERS.includes(header.key.toLowerCase()))
        ctx.addIssue({
          code: "custom",
          message: "Accept and Content-Type are set for you",
          path: ["headers", index, "key"]
        });
    });
  });

export const agentSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Name the agent")
      .max(255, "Use at most 255 characters"),
    // Catalog ids (deepgram/aura-2-thalia-en); the provider is the id's prefix.
    tts: z.object({
      voice: z.string().min(1, "Pick a voice")
    }),
    stt: z.object({
      model: z.string().min(1, "Pick a model"),
      languageCode: z.string().min(1, "Pick a language")
    }),
    conversation: z.object({
      firstMessage: z.string(),
      systemPrompt: z.string().trim().min(1, "Write the system prompt"),
      goodbyeMessage: z.string().trim().min(1, "Write a goodbye message"),
      systemErrorMessage: z.string().trim().min(1, "Write an error message"),
      initialDtmf: z
        .string()
        .trim()
        .regex(/^[0-9*#]*$/, "Must be a valid DTMF"),
      maxSessionMinutes: positive(),
      allowUserBargeIn: z.boolean(),
      idleMessage: z.string(),
      idleTimeoutSeconds: positive(),
      idleMaxTimeoutCount: positiveInt(),
      transferPhoneNumber: z
        .string()
        .trim()
        .regex(/^\+?[0-9 ()-]*$/, "Use a phone number like +18095550100"),
      transferMessage: z.string()
    }),
    model: z.object({
      model: z.string().trim().min(1, "Pick a model"),
      temperature: num().min(0, BETWEEN_0_AND_2).max(2, BETWEEN_0_AND_2),
      maxTokens: positiveInt()
    }),
    tools: z.array(toolSchema)
  })
  .superRefine((values, ctx) => {
    const names = new Set<string>();
    values.tools.forEach((tool, index) => {
      if (names.has(tool.name))
        ctx.addIssue({
          code: "custom",
          message: "Another tool has this name",
          path: ["tools", index, "name"]
        });
      names.add(tool.name);
    });
  });

export type AgentValues = z.infer<typeof agentSchema>;
export type ToolValues = AgentValues["tools"][number];
export type ParameterValues = ToolValues["parameters"][number];

// Defaults of common/src/agents/sessionAgentSchema.ts.
export const DEFAULTS = {
  maxSessionDuration: 30 * 60 * 1000,
  idleTimeout: 30000,
  idleMaxTimeoutCount: 2,
  temperature: 0.4,
  maxTokens: 300
};

/** The app's default voice when it names none (the API's DEFAULT_VOICE). */
const DEFAULT_VOICE = "deepgram/aura-2-thalia-en";
/** Shown for an agent saved before it named a transcriber. */
const DEFAULT_STT = "deepgram/nova-3";

export const EMPTY_TOOL: ToolValues = {
  name: "",
  description: "",
  method: "get",
  url: "",
  parametersType: "object",
  parameters: [],
  headers: [],
  requestStartMessage: "",
  waitForResponse: true
};

type Json = Record<string, unknown>;

const obj = (value: unknown): Json =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Json)
    : {};
const str = (value: unknown, fallback = "") =>
  typeof value === "string" ? value : fallback;
const numOr = (value: unknown, fallback: number) =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

function toolToValues(raw: unknown): ToolValues {
  const tool = obj(raw);
  const parameters = obj(tool.parameters);
  const properties = obj(parameters.properties);
  const required = Array.isArray(parameters.required)
    ? (parameters.required as string[])
    : [];
  const operation = obj(tool.operation);
  return {
    name: str(tool.name),
    description: str(tool.description),
    method: str(operation.method).toLowerCase() === "post" ? "post" : "get",
    url: str(operation.url),
    parametersType: parameters.type === "array" ? "array" : "object",
    parameters: Object.entries(properties).map(([name, value]) => {
      const { type, format, ...extra } = obj(value);
      return {
        name,
        type: str(type, "string"),
        format: format === "enum" || format === "date-time" ? format : "",
        required: required.includes(name),
        extra
      };
    }),
    headers: Object.entries(obj(operation.headers)).map(([key, value]) => ({
      key,
      value: str(value)
    })),
    requestStartMessage: str(tool.requestStartMessage),
    waitForResponse: operation.waitForResponse !== false
  };
}

/** The editor's values for a saved agent; missing settings get defaults. */
export function toValues(app: Application): AgentValues {
  const config = obj(app.intelligence?.config);
  // The session app model (CP-B13): catalog ids on the app's speech defaults.
  const speech = obj(app.speech);
  const conversation = obj(config.conversationSettings);
  const idle = obj(conversation.idleOptions);
  const transfer = obj(conversation.transferOptions);
  const languageModel = obj(config.languageModel);

  return {
    name: app.name ?? "",
    tts: { voice: str(speech.voice) || DEFAULT_VOICE },
    stt: {
      model: str(speech.sttModel) || DEFAULT_STT,
      languageCode: str(speech.language, "en-US")
    },
    conversation: {
      firstMessage: str(conversation.firstMessage),
      systemPrompt: str(conversation.systemPrompt),
      goodbyeMessage: str(conversation.goodbyeMessage),
      systemErrorMessage: str(conversation.systemErrorMessage),
      initialDtmf: str(conversation.initialDtmf),
      maxSessionMinutes:
        numOr(conversation.maxSessionDuration, DEFAULTS.maxSessionDuration) /
        60000,
      allowUserBargeIn: conversation.allowUserBargeIn !== false,
      idleMessage: str(idle.message),
      idleTimeoutSeconds: numOr(idle.timeout, DEFAULTS.idleTimeout) / 1000,
      idleMaxTimeoutCount: numOr(
        idle.maxTimeoutCount,
        DEFAULTS.idleMaxTimeoutCount
      ),
      transferPhoneNumber: str(transfer.phoneNumber),
      transferMessage: str(transfer.message)
    },
    model: {
      model: str(languageModel.model),
      temperature: numOr(languageModel.temperature, DEFAULTS.temperature),
      maxTokens: numOr(languageModel.maxTokens, DEFAULTS.maxTokens)
    },
    tools: Array.isArray(languageModel.tools)
      ? languageModel.tools.map(toolToValues)
      : []
  };
}

function toolToConfig(tool: ToolValues) {
  const headers = Object.fromEntries(
    tool.headers
      .filter((header) => header.key.trim())
      .map((header) => [header.key.trim(), header.value])
  );
  const required = tool.parameters
    .filter((parameter) => parameter.required)
    .map((parameter) => parameter.name);
  return {
    name: tool.name.trim(),
    description: tool.description.trim(),
    parameters: {
      type: tool.parametersType,
      properties: Object.fromEntries(
        tool.parameters.map((parameter) => {
          // The API rejects a property with both a format and a pattern.
          const { pattern, ...extra } = parameter.extra;
          return [
            parameter.name,
            {
              ...extra,
              type: parameter.type,
              ...(parameter.format
                ? { format: parameter.format }
                : pattern !== undefined
                  ? { pattern }
                  : {})
            }
          ];
        })
      ),
      ...(required.length > 0 ? { required } : {})
    },
    ...(tool.requestStartMessage.trim()
      ? { requestStartMessage: tool.requestStartMessage.trim() }
      : {}),
    operation: {
      method: tool.method,
      url: tool.url.trim(),
      waitForResponse: tool.waitForResponse,
      ...(Object.keys(headers).length > 0 ? { headers } : {})
    }
  };
}

/**
 * The create/update payload. Settings the editor doesn't show (test cases,
 * knowledge base) are carried over from `base`, the agent as last saved.
 */
export function toRequest(
  values: AgentValues,
  base?: Application
): CreateApplicationRequest {
  // The session agent (sessionAgentSchema, CP-B13): strict, so only its keys are sent.
  const previous = obj(base?.intelligence?.config);
  const previousModel = obj(previous.languageModel);
  const c = values.conversation;
  const m = values.model;

  const conversationSettings = {
    ...(c.firstMessage.trim() ? { firstMessage: c.firstMessage.trim() } : {}),
    systemPrompt: c.systemPrompt,
    goodbyeMessage: c.goodbyeMessage.trim(),
    systemErrorMessage: c.systemErrorMessage.trim(),
    ...(c.initialDtmf.trim() ? { initialDtmf: c.initialDtmf.trim() } : {}),
    maxSessionDuration: Math.round(c.maxSessionMinutes * 60000),
    allowUserBargeIn: c.allowUserBargeIn,
    ...(c.idleMessage.trim()
      ? {
          idleOptions: {
            message: c.idleMessage.trim(),
            timeout: Math.round(c.idleTimeoutSeconds * 1000),
            maxTimeoutCount: c.idleMaxTimeoutCount
          }
        }
      : {}),
    ...(c.transferPhoneNumber.trim()
      ? {
          transferOptions: {
            phoneNumber: c.transferPhoneNumber.replace(/[ ()-]/g, ""),
            message: c.transferMessage.trim()
          }
        }
      : {})
  };

  const languageModel = {
    model: m.model.trim(),
    temperature: m.temperature,
    maxTokens: m.maxTokens,
    tools: values.tools.map(toolToConfig),
    knowledgeBase: Array.isArray(previousModel.knowledgeBase)
      ? previousModel.knowledgeBase
      : []
  };

  return {
    name: values.name.trim(),
    // @fonoster/types is CommonJS: no runtime enum imports in the browser.
    type: "AUTOPILOT" as CreateApplicationRequest["type"],
    speech: {
      voice: values.tts.voice,
      language: values.stt.languageCode,
      sttModel: values.stt.model
    },
    intelligence: {
      config: {
        conversationSettings,
        languageModel,
        ...(previous.testCases !== undefined
          ? { testCases: previous.testCases }
          : {})
      }
    }
  };
}

export function toUpdateRequest(
  ref: string,
  values: AgentValues,
  base?: Application
): UpdateApplicationRequest {
  // `type` must be sent: the API validates `intelligence` only for AUTOPILOT. The API replaces
  // every column on update, so the agent's call handling (fallback, listeners, recording, AMD,
  // audio, other speech settings) comes from the saved app.
  const request = toRequest(values, base);
  return base ? { ...mergeUpdate(base, request), ref } : { ref, ...request };
}

/** A rough token count (≈4 characters per token), for the prompt's size hint. */
export function approximateTokens(text: string): number {
  return Math.ceil(text.trim().length / 4);
}

/** Which tab holds each top-level field, to point at errors after Save. */
export function tabsWithErrors(errors: object): string[] {
  const tabs = new Set<string>();
  const e = errors as Record<string, Record<string, unknown> | undefined>;
  const conversation = e.conversation ?? {};
  if (e.name || e.tts || e.stt) tabs.add("configure");
  if (e.model) {
    const keys = Object.keys(e.model);
    if (keys.includes("model")) tabs.add("configure");
    if (keys.some((k) => k !== "model")) tabs.add("advanced");
  }
  const onConfigure = [
    "firstMessage",
    "systemPrompt",
    "goodbyeMessage",
    "systemErrorMessage",
    "allowUserBargeIn",
    "transferPhoneNumber",
    "transferMessage"
  ];
  // Call limits show in Configure's Behavior panel and in Advanced.
  const onBoth = [
    "maxSessionMinutes",
    "idleTimeoutSeconds",
    "idleMaxTimeoutCount"
  ];
  for (const key of Object.keys(conversation)) {
    if (onConfigure.includes(key) || onBoth.includes(key))
      tabs.add("configure");
    if (!onConfigure.includes(key)) tabs.add("advanced");
  }
  if (e.tools) tabs.add("tools");
  return [...tabs];
}
