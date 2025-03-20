import { Dialog, Box } from "@mui/material";
import { Button } from "@stories/button/Button";
import PageContainer from "@/common/components/layout/pages";
import { useState } from "react";
import { useACLForm } from "../hooks/useACLForm";
import { ACLFormFields } from "../shared/ACLFormFields";
import CreateRuleModal from "./CreateRuleModal";

/**
 * Type definition for an ACL object used in callbacks
 */
export type ACLData = {
  ref: string;
  name: string;
};

/**
 * Props for the CreateACLModal component
 */
interface CreateACLModalProps {
  /** Controls whether the modal is visible */
  open: boolean;

  /** Function to call when the modal should close */
  onClose: () => void;

  /** Optional callback when an ACL is successfully created */
  onSave?: (acl: ACLData) => void;

  /** Optional title for the modal */
  title?: string;
}

/**
 * Modal component for creating new ACLs
 *
 * This component provides a popup modal with a form for creating
 * new ACLs that can be reused across different parts of the application.
 */
export default function CreateACLModal({
  open,
  onClose,
  onSave,
  title = "Create New ACL"
}: CreateACLModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);

  // Initialize form with the ACL hook
  const { methods, isValid, onSubmit, addRule, allow, deny } = useACLForm({
    isEditMode: false,
    onSuccess: (acl) => {
      if (onSave) {
        onSave(acl);
      }
      handleClose();
    }
  });

  /**
   * Handles modal close action, resetting the form
   */
  const handleClose = () => {
    methods.reset();
    onClose();
  };

  /**
   * Handles form submission with loading state
   */
  const handleSubmit = () => {
    setIsSubmitting(true);
    onSubmit().finally(() => {
      setIsSubmitting(false);
    });
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "4px",
            maxWidth: "550px"
          }
        }}
      >
        <Box sx={{ px: 3, pt: 3, pb: 3 }}>
          <PageContainer>
            <PageContainer.Header title={title} />
            <PageContainer.Subheader>
              Create a new ACL to control access to your SIP network.
            </PageContainer.Subheader>

            <ACLFormFields
              methods={methods}
              formId="acl-modal-form"
              onAddRuleClick={() => setIsRuleModalOpen(true)}
              allow={allow}
              deny={deny}
            >
              <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={!isValid || isSubmitting}
                >
                  {isSubmitting ? "SAVING..." : "SAVE ACL"}
                </Button>
              </Box>
            </ACLFormFields>
          </PageContainer>
        </Box>
      </Dialog>

      <CreateRuleModal
        open={isRuleModalOpen}
        onClose={() => setIsRuleModalOpen(false)}
        onSave={addRule}
      />
    </>
  );
}
