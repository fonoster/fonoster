import { Dialog, Box } from "@mui/material";
import { Button } from "@stories/button/Button";
import PageContainer from "@/common/components/layout/pages";
import { useState } from "react";
import { TrunkURIFormFields } from "../shared/TrunkURIFormFields";
import { useTrunkURIForm, TrunkURIFormData } from "../hooks/useTrunkURIForm";
import { ChipData } from "@/common/hooksForm/ChipsContext";

/**
 * Type definition for a TrunkURI object used in callbacks
 */
export type TrunkURIData = TrunkURIFormData;

/**
 * Props for the CreateTrunkURIModal component
 */
interface CreateTrunkURIModalProps {
  /** Controls whether the modal is visible */
  open: boolean;

  /** Function to call when the modal should close */
  onClose: () => void;

  /** Optional callback when a URI is successfully created */
  onSave?: (uri: TrunkURIData) => void;

  /** Optional title for the modal */
  title?: string;

  /** Existing URIs to validate against */
  existingUris?: ChipData<TrunkURIData>[];
}

/**
 * Modal component for creating new SIP URIs for trunks
 *
 * This component provides a popup modal with a form
 * for creating new SIP URIs that can be reused across
 * different parts of the application.
 */
export default function CreateTrunkURIModal({
  open,
  onClose,
  onSave,
  title = "Create New Outbound SIP URI",
  existingUris = []
}: CreateTrunkURIModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { methods, isValid, onSubmit, reset } = useTrunkURIForm({
    onSuccess: (uri) => {
      const isDuplicate = existingUris.some(
        (existingUri) =>
          existingUri.value.host === uri.host &&
          existingUri.value.port === uri.port
      );

      if (isDuplicate) {
        setError("A URI with this host and port combination already exists");
        return;
      }

      if (onSave) {
        onSave(uri);
      }
      handleClose();
    }
  });

  /**
   * Handles modal close action, resetting the form
   */
  const handleClose = () => {
    reset();
    setError(null);
    onClose();
  };

  /**
   * Handles form submission with loading state
   */
  const handleSubmit = () => {
    setIsSubmitting(true);
    setError(null);
    onSubmit();
    setIsSubmitting(false);
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "4px",
          maxWidth: "450px"
        }
      }}
    >
      <Box sx={{ px: 3, pt: 3, pb: 3 }}>
        <PageContainer>
          <PageContainer.Header title={title} />
          <PageContainer.Subheader>
            Define an outbound SIP URI to connect to your provider
          </PageContainer.Subheader>

          {error && <Box sx={{ color: "error.main" }}>{error}</Box>}

          <TrunkURIFormFields methods={methods} formId="trunk-uri-modal-form">
            <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={!isValid || isSubmitting}
              >
                {isSubmitting ? "adding..." : "Add URI"}
              </Button>
            </Box>
          </TrunkURIFormFields>
        </PageContainer>
      </Box>
    </Dialog>
  );
}
