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
import { useState } from "react";
import { ModalTerms } from "./ModalTerms";
import { Button } from "../button/Button";
import { fn } from "@storybook/test";

export const DemoWrapper = () => {
  const [open, setOpen] = useState(false);

  const handleOpen = fn(() => setOpen(true));
  const handleClose = fn(() => setOpen(false));

  return (
    <div>
      <Button variant="contained" onClick={handleOpen}>
        Terms and Conditions
      </Button>

      <ModalTerms
        message="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur."
        open={open}
        onClose={handleClose}
      />
    </div>
  );
};
