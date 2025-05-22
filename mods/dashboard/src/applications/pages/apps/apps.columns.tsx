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
import type { ColumnDef } from "@tanstack/react-table";
import type { Application } from "@fonoster/types";

export const columns: ColumnDef<Application>[] = [
  {
    id: "ref",
    header: "Ref",
    accessorKey: "ref",
  },
  {
    id: "name",
    header: "Name",
    accessorKey: "name",
  },
  {
    id: "textToSpeech",
    header: "TTS",
    accessorKey: "textToSpeech.productRef",
  },
  {
    id: "speechToText",
    header: "STT",
    accessorKey: "speechToText.productRef",
  },
  {
    id: "appType",
    header: "Application Type",
    accessorKey: "type",
  }
];
