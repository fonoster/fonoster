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
import { Struct } from "google-protobuf/google/protobuf/struct_pb";
import { jsonToObject } from "../src/client/jsonToObject";
import { objectToJson } from "../src/client/objectToJson";
import {
  Application,
  AudioFilter,
  UpdateApplicationRequest
} from "../src/generated/node/applications_pb";
import { buildStructOverride, buildStructOverrideReverse } from "../src/utils";

// An app's audio filters travel as repeated AudioFilter messages whose options are a Struct.

describe("@sdk[applications/filters]", function () {
  it("sends filters with their options as a Struct", function () {
    const request = jsonToObject({
      json: buildStructOverride({
        ref: "app-1",
        filters: [
          { name: "aiCoustics", options: { enhancementLevel: 0.8 } },
          { name: "other" }
        ]
      }) as Record<string, unknown>,
      objectConstructor: UpdateApplicationRequest,
      objectMapping: [["filters", AudioFilter]]
    });

    const filters = request.getFiltersList();
    expect(filters.map((f) => f.getName())).to.deep.equal([
      "aiCoustics",
      "other"
    ]);
    expect(filters[0].getOptions()!.toJavaScript()).to.deep.equal({
      enhancementLevel: 0.8
    });
    expect(filters[1].getOptions()).to.equal(undefined);
  });

  it("sends an empty list to clear the filters", function () {
    const request = jsonToObject({
      json: buildStructOverride({ ref: "app-1", filters: [] }) as Record<
        string,
        unknown
      >,
      objectConstructor: UpdateApplicationRequest,
      objectMapping: [["filters", AudioFilter]]
    });
    expect(request.getFiltersList()).to.deep.equal([]);
  });

  it("returns filters with plain options", function () {
    const filter = new AudioFilter();
    filter.setName("aiCoustics");
    filter.setOptions(Struct.fromJavaScript({ bypass: true }));
    const app = new Application();
    app.setRef("app-1");
    app.setFiltersList([filter]);

    const json = buildStructOverrideReverse(
      objectToJson<Record<string, unknown>>(
        app as unknown as new () => unknown,
        undefined,
        undefined,
        [["filtersList", AudioFilter]]
      )
    );

    expect(json.filters).to.deep.equal([
      { name: "aiCoustics", options: { bypass: true } }
    ]);
  });
});
