import { Application } from "@fonoster/types";

export type ApplicationDTO = {
  ref: string;
  projectId: string;
  tts: string;
  stt: string;
} & Partial<Application>;
