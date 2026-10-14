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
import type { ReactNode, FC } from "react";
import { GoBackButton } from "../../design-system/ui/go-back/go-back";
import {
  PageHeaderDescriptionText,
  PageHeaderRoot,
  PageHeaderRow,
  PageHeaderTitleContainer,
  PageHeaderTitleText
} from "./page-header.styles";

export interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  onBack?: {
    label: string;
    onClick: VoidFunction;
  };
}

export const PageHeader: FC<PageHeaderProps> = ({
  title,
  description,
  actions,
  onBack
}) => {
  return (
    <PageHeaderRoot>
      {onBack && <GoBackButton {...onBack} />}
      <PageHeaderRow>
        <PageHeaderTitleContainer>
          <PageHeaderTitleText variant="heading-medium" color="base.03">
            {title}
          </PageHeaderTitleText>
          {description && (
            <PageHeaderDescriptionText variant="body-small" color="base.03">
              {description}
            </PageHeaderDescriptionText>
          )}
        </PageHeaderTitleContainer>
        {actions}
      </PageHeaderRow>
    </PageHeaderRoot>
  );
};
