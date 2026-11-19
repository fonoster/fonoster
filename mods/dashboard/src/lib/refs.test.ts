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
import { NONE, refField, refUpdate } from "./refs";

describe("refUpdate", () => {
  it('sends "" when a set ref moves to None', () => {
    expect(refUpdate(NONE, "acl-1")).toBe("");
    expect(refUpdate(undefined, "acl-1")).toBe("");
  });

  it("sends the new ref when it changes", () => {
    expect(refUpdate("acl-2", "acl-1")).toBe("acl-2");
    expect(refUpdate("acl-2", undefined)).toBe("acl-2");
  });

  it("sends nothing when the ref didn't change", () => {
    expect(refUpdate("acl-1", "acl-1")).toBeUndefined();
    expect(refUpdate(NONE, undefined)).toBeUndefined();
    expect(refField("trunkRef", NONE, "")).toEqual({});
  });
});
