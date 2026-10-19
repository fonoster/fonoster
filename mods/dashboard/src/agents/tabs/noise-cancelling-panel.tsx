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
import { Select } from "~/components/ui/select";
import {
  filtersFor,
  noiseCancellingOf,
  noiseCancellingOptions
} from "~/session/noise-cancelling";
import { useAgent, useCatalog, useUpdateAgentFilters } from "../agents.service";
import { Panel, SettingRow } from "../parts";

// Layout and copy from designs/dashboard.pen "Agent / Detail / Advanced", Noise cancelling panel.
// The setting is on the application (its filters), so it saves on its own, as soon as it changes.
export function NoiseCancellingPanel({ appRef }: { appRef: string }) {
  const agent = useAgent(appRef);
  const catalog = useCatalog();
  const update = useUpdateAgentFilters();
  const app = agent.data;
  const options = noiseCancellingOptions(
    catalog.data?.ncProviders ?? [],
    app?.filters
  );
  return (
    <Panel
      title="Noise cancelling"
      description="Removes background noise and other voices before the agent listens. Keeps one speaker: not for speakerphone or IVR. Adds about 30 ms."
    >
      <SettingRow
        label="Provider"
        hint="None, or a vendor your workspace can use"
        htmlFor="noise-cancelling"
      >
        <Select
          id="noise-cancelling"
          aria-label="Noise cancelling"
          className="w-44"
          value={noiseCancellingOf(app?.filters)}
          options={options}
          disabled={!app || update.isPending}
          onValueChange={(v) =>
            app &&
            update.mutate({
              ...app,
              ref: app.ref,
              filters: filtersFor(v, app.filters)
            })
          }
        />
      </SettingRow>
    </Panel>
  );
}
