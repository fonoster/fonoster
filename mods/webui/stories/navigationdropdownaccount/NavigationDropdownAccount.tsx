/*
 * Copyright (C) 2024 by Fonoster Inc (https://fonoster.com)
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
import {
    NavigationDropdownAccountContainer,
    NavigationDropdownAccountContent,
    NavigationDropdownAccountHeader,
    NavigationDropdownAccountMenuItem
} from "./NavigationDropdownAccount.styles";
import { NavigationDropdownAccountProps } from "./types";
import { Typography } from "../typography/Typography";

export const NavigationDropdownAccount = (
    props: NavigationDropdownAccountProps
) => {
    const { onAccountSettingsClicked, onSignoutClicked } = props;

    return (
        <NavigationDropdownAccountContainer>
            <NavigationDropdownAccountContent>
                <NavigationDropdownAccountHeader>
                    <Typography variant="body-medium">Account</Typography>
                </NavigationDropdownAccountHeader>

                <NavigationDropdownAccountMenuItem onClick={onAccountSettingsClicked}>
                    <Typography variant="body-small">Account settings</Typography>
                </NavigationDropdownAccountMenuItem>

                <NavigationDropdownAccountMenuItem onClick={onSignoutClicked}>
                    <Typography variant="body-small-underline">Sign Out</Typography>
                </NavigationDropdownAccountMenuItem>
            </NavigationDropdownAccountContent>
        </NavigationDropdownAccountContainer>
    );
};