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
 * Starting points for a new agent. Each template is a short, real-world
 * prompt with its messages, in English (en-*) or Spanish (es-*, multi).
 */
import { defaultsFor, languageOf, type AgentCatalog } from "./catalog";
import { DEFAULTS, type AgentValues } from "./agent-form";

export type TemplateId = "receptionist" | "reminders" | "blank";

type Copy = {
  firstMessage: string;
  systemPrompt: string;
  goodbyeMessage: string;
  systemErrorMessage: string;
  idleMessage: string;
  transferMessage: string;
};

export const TEMPLATES: {
  id: TemplateId;
  label: string;
  description: string;
}[] = [
  {
    id: "receptionist",
    label: "Receptionist",
    description: "Answers, helps, transfers to a person"
  },
  {
    id: "reminders",
    label: "Reminders",
    description: "Calls customers about payments or appointments"
  },
  {
    id: "blank",
    label: "Blank",
    description: "An empty prompt and default voice"
  }
];

const COMMON: Record<
  "en" | "es",
  Omit<Copy, "firstMessage" | "systemPrompt">
> = {
  en: {
    goodbyeMessage: "Thanks for calling. Have a great day!",
    systemErrorMessage:
      "Sorry, something went wrong on our side. Please call again in a few minutes.",
    idleMessage: "Are you still there?",
    transferMessage: "One moment, I'm transferring you to a person."
  },
  es: {
    goodbyeMessage: "Gracias por su tiempo. ¡Que tenga buen día!",
    systemErrorMessage:
      "Disculpe, tuvimos un problema. Por favor llame de nuevo en unos minutos.",
    idleMessage: "¿Sigue ahí?",
    transferMessage: "Un momento, le transfiero con una persona."
  }
};

const PROMPTS: Record<
  TemplateId,
  Record<"en" | "es", Pick<Copy, "firstMessage" | "systemPrompt">>
> = {
  receptionist: {
    en: {
      firstMessage: "Hi, thanks for calling. How can I help you today?",
      systemPrompt: `# Role
You are the receptionist for our company. You answer calls in a warm, professional and brief way.

# Goal
Understand why the caller is calling and help them: answer simple questions, take a message, or transfer them to a person.

# Rules
- Keep answers short: one or two sentences. This is a phone call.
- Ask one question at a time.
- Never make up prices, policies or availability. If you don't know, offer to transfer the call or take a message.
- If the caller asks for a person, or is upset, transfer the call.
- When the caller has what they need, say goodbye and hang up.`
    },
    es: {
      firstMessage: "Hola, gracias por llamar. ¿En qué le puedo ayudar?",
      systemPrompt: `# Rol
Eres la recepcionista de nuestra empresa. Atiendes las llamadas de forma cálida, profesional y breve.

# Objetivo
Entender el motivo de la llamada y ayudar: responder preguntas sencillas, tomar un mensaje o transferir a una persona.

# Reglas
- Responde corto: una o dos oraciones. Es una llamada telefónica.
- Haz una pregunta a la vez.
- Nunca inventes precios, políticas ni disponibilidad. Si no lo sabes, ofrece transferir la llamada o tomar un mensaje.
- Si la persona pide hablar con alguien o está molesta, transfiere la llamada.
- Cuando la persona tenga lo que necesita, despídete y cuelga.`
    }
  },
  reminders: {
    en: {
      firstMessage:
        "Hi, I'm calling from our billing team about an open invoice. Do you have a minute?",
      systemPrompt: `# Role
You are a friendly agent who calls customers about upcoming payments and appointments.

# Goal
Remind the customer of what's due and agree on a date. Confirm the date back before ending the call.

# Rules
- Be polite and brief; never pressure the customer.
- Confirm you're speaking with the right person before sharing details. If it's someone else, ask them to pass on a message and end the call.
- If the customer disputes the charge or asks for a person, transfer the call.
- If you reach voicemail, leave a short message and hang up.`
    },
    es: {
      firstMessage:
        "Hola, le llamo del equipo de cobros sobre una factura pendiente. ¿Tiene un minuto?",
      systemPrompt: `# Rol
Eres un asistente amable que llama a clientes sobre pagos y citas próximas.

# Objetivo
Recordarle al cliente lo que tiene pendiente y acordar una fecha. Confirma la fecha antes de terminar la llamada.

# Reglas
- Sé cortés y breve; nunca presiones al cliente.
- Confirma que hablas con la persona correcta antes de dar detalles. Si es otra persona, pide que le pase el mensaje y termina la llamada.
- Si el cliente no reconoce el cargo o pide hablar con alguien, transfiere la llamada.
- Si contesta el buzón de voz, deja un mensaje corto y cuelga.`
    }
  },
  blank: {
    en: {
      firstMessage: "Hi, how can I help you?",
      systemPrompt: "You are a helpful voice agent. Keep answers short."
    },
    es: {
      firstMessage: "Hola, ¿en qué le puedo ayudar?",
      systemPrompt: "Eres un asistente de voz útil. Responde de forma breve."
    }
  }
};

/** The new agent's values for a template, name and language, with what the catalog offers. */
export function templateValues(
  template: TemplateId,
  name: string,
  languageCode: string,
  catalog: AgentCatalog
): AgentValues {
  const language = languageOf(languageCode);
  const picked = defaultsFor(catalog, languageCode);
  const locale = language?.locale ?? "en";
  const prompt = PROMPTS[template][locale];
  const copy = { ...COMMON[locale], ...prompt };

  return {
    name,
    tts: { voice: picked.voice },
    stt: { model: picked.stt, languageCode },
    conversation: {
      firstMessage: copy.firstMessage,
      systemPrompt: copy.systemPrompt,
      goodbyeMessage: copy.goodbyeMessage,
      systemErrorMessage: copy.systemErrorMessage,
      initialDtmf: "",
      maxSessionMinutes: DEFAULTS.maxSessionDuration / 60000,
      allowUserBargeIn: true,
      idleMessage: copy.idleMessage,
      idleTimeoutSeconds: 10,
      idleMaxTimeoutCount: 3,
      transferPhoneNumber: "",
      transferMessage: copy.transferMessage
    },
    model: {
      model: picked.llm,
      temperature: DEFAULTS.temperature,
      maxTokens: DEFAULTS.maxTokens
    },
    tools: []
  };
}
