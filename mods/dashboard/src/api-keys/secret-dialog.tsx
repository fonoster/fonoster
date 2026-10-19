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
import { CodeBlock, SecretDialog } from "~/components/data/secret-dialog";

export type CreatedKey = { accessKeyId: string; accessKeySecret: string };

/** How to use a key from the SDK; the workspace's own access key ID goes in. */
export function sdkSnippet(workspaceAccessKeyId: string) {
  return `const client = new SDK.Client({ accessKeyId: "${workspaceAccessKeyId}" });\nawait client.loginWithApiKey(apiKey, apiSecret);`;
}

/** A new (or regenerated) key's secret, the only time it can be read, with an SDK snippet. */
export function ApiKeySecretDialog({
  apiKey,
  workspaceAccessKeyId,
  onDone
}: {
  /** The key to show; the dialog is open while set. */
  apiKey?: CreatedKey;
  workspaceAccessKeyId: string;
  onDone: () => void;
}) {
  return (
    <SecretDialog
      title="Save your API key"
      description="This is the only time we'll show it. Store it in your password manager or CI secrets."
      fields={
        apiKey && [
          { label: "API key", value: apiKey.accessKeyId },
          { label: "API secret", value: apiKey.accessKeySecret }
        ]
      }
      onDone={onDone}
    >
      <CodeBlock label="SDK snippet" code={sdkSnippet(workspaceAccessKeyId)} />
    </SecretDialog>
  );
}
