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
// The install of a private region: the Ansible playbook that ships in the release archive
// (fonoster/ansible). Must equal the command on docs-site/private-regions/install-region.mdx
// (install.test.ts): copy the example inventory, put the token in the vault, plan, apply.
export const composeCommand = (token: string) =>
  [
    "cd fonoster/ansible && mkdir -p inventory/group_vars/regions && cp inventory.example/region.example.yml inventory/region.yml",
    `ansible-vault encrypt_string '${token}' --name vault_enroll_token >> inventory/group_vars/regions/vault.yml`,
    "ansible-playbook -i inventory/region.yml playbooks/region.yml --check --diff --ask-vault-pass",
    "ansible-playbook -i inventory/region.yml playbooks/region.yml --ask-vault-pass"
  ].join("\n");
export const helmCommand = (token: string) =>
  `helm install fonoster-region ops/rebuild/helm/fonoster-rebuild --set regionAgent.enabled=true --set regionAgent.enroll.token=${token}`;
export const secretCommand = (name: string) =>
  `fonoster-region secrets set ${name}`;
