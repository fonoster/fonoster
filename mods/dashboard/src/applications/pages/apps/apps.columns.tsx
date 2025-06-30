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
import { toTitleCase } from "../../../core/helpers/to-title-case";

/**
 * Column definitions for rendering a table of Fonoster Applications using TanStack Table.
 *
 * Each column maps a property of the `Application` object to a table header and cell.
 * This configuration enables sorting, filtering, and custom rendering in table UIs.
 */
export const columns: ColumnDef<Application>[] = [
  {
    /**
     * Unique identifier column for the application.
     *
     * This is typically a UUID or internal reference string.
     */
    id: "ref",
    header: "Ref",
    accessorKey: "ref"
  },
  {
    /**
     * Human-readable name of the application.
     *
     * Often used to identify the application in the UI.
     */
    id: "name",
    header: "Name",
    accessorKey: "name"
  },
  {
    /**
     * Text-to-Speech (TTS) provider used by the application.
     *
     * Displays the product reference for the TTS engine configured.
     */
    id: "textToSpeech",
    header: "TTS",
    accessorKey: "textToSpeech.productRef"
  },
  {
    /**
     * Speech-to-Text (STT) provider used by the application.
     *
     * Displays the product reference for the STT engine configured.
     */
    id: "speechToText",
    header: "STT",
    accessorKey: "speechToText.productRef"
  },
  {
    /**
     * Type or category of the application.
     *
     * Indicates how the application is intended to function (e.g., voice app, IVR, bot).
     */
    id: "appType",
    header: "Application Type",
    accessorKey: "type",
    cell: ({ row }) => toTitleCase(row.getValue("appType"))
  }
];
