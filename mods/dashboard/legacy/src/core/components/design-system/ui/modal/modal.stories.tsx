import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Modal } from "./modal";
import { Box } from "@mui/material";
import { Button } from "../button/button";

const meta: Meta<typeof ModalStory> = {
  title: "Components/Modals & Popups/Modal",
  component: Modal,
  tags: ["autodocs"],
  args: {
    open: true,
    title: "Invite new members to your workspace",
    hideCloseButton: false
  },
  argTypes: {
    open: {
      name: "Default Open",
      description: "When true, the modal will be open by default.",
      control: { type: "boolean" },
      table: {
        defaultValue: {
          summary: "true"
        }
      }
    },
    title: {
      name: "Title",
      description:
        "The title of the modal. If not provided, the title will not be displayed.",
      control: { type: "text" }
    },
    hideCloseButton: {
      name: "Hide Close Button",
      description:
        "When true, the close button will not be displayed in the modal header.",
      control: { type: "boolean" }
    }
  }
};

export default meta;

type Story = StoryObj<typeof ModalStory>;

const ModalStory = (props: {
  open: boolean;
  title: string;
  hideCloseButton: boolean;
}) => {
  const { open: defaultOpen, title, hideCloseButton } = props;
  const [open, setOpen] = useState(defaultOpen);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Open Modal</Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={title}
        hideCloseButton={hideCloseButton}
      >
        <Box>
          <Box sx={{ padding: "16px 0" }}>
            This is an example of a modal component. You can put any content
            here.
          </Box>
          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <Button>Button Copy</Button>
          </Box>
        </Box>
      </Modal>
    </>
  );
};

/**
 * Modal with configurable title, open state, and close button visibility
 */
export const ConfigurableModal: Story = {
  args: {
    open: true,
    title: "Invite new members to your workspace",
    hideCloseButton: false
  },
  render: (args) => <ModalStory {...args} />
};
