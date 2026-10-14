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
import { Modal } from "~/core/components/design-system/ui/modal/modal";
import { CreateWorkspaceForm } from "./create-workspace.form";

/**
 * Props for the CreateWorkspaceModal component.
 *
 * @property {boolean} isOpen - Controls the visibility of the modal.
 * @property {() => void} onClose - Function to close the modal.
 */
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * CreateWorkspaceModal component
 *
 * A modal dialog that contains the CreateWorkspaceForm.
 * When the form is successfully submitted, the modal automatically closes.
 *
 * @param {ModalProps} props - Props controlling the modal state.
 * @returns {JSX.Element} The rendered modal with the workspace creation form.
 */
export const CreateWorkspaceModal = ({ isOpen, onClose }: ModalProps) => {
  return (
    <Modal open={isOpen} onClose={onClose} title="Create workspace">
      <CreateWorkspaceForm onFormSubmit={onClose} />
    </Modal>
  );
};
