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
import { ComingSoon } from "../parts";

export function KnowledgeTab() {
  return (
    <ComingSoon
      title="Knowledge"
      description="Upload PDFs the agent searches when a caller asks something the prompt doesn't cover: prices, hours, policies."
      missing="Document upload isn't available in the API yet. Until then, keep the facts the agent needs in the system prompt."
    />
  );
}

export function TestsTab() {
  return (
    <ComingSoon
      title="Tests"
      description="Scripted conversations that check the agent says the right things and calls the right tools, run against your saved prompt."
      missing="The dashboard can't store or run test scenarios yet. Define testCases in the agent's YAML and run them with the ctl CLI."
    >
      <code className="rounded-control bg-muted px-3 py-1 font-mono text-[12px] text-muted-foreground">
        npx @fonoster/ctl applications:eval -f agent.yaml
      </code>
    </ComingSoon>
  );
}

export function CallsTab() {
  return (
    <ComingSoon
      title="Calls"
      description="Every call this agent handled, with its duration, status and transcript."
      missing="Call records don't say which agent answered yet, so they can't be listed per agent."
    />
  );
}
