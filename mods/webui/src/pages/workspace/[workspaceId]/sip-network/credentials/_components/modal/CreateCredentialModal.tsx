import { Dialog, Box } from '@mui/material';
import { Button } from '@stories/button/Button';
import PageContainer from '@/common/components/layout/pages';
import { useState } from 'react';
import { useCredentialForm } from '../hooks/useCredentialForm';
import { CredentialFormFields } from '../shared/CredentialFormFields';

/**
 * Type definition for a credential object used in callbacks
 */
export type CredentialData = {
    ref: string;
    name: string;
    username: string;
};

/**
 * Props for the CreateCredentialModal component
 */
interface CreateCredentialModalProps {
    /** Controls whether the modal is visible */
    open: boolean;

    /** Function to call when the modal should close */
    onClose: () => void;

    /** Optional callback when a credential is successfully created */
    onSave?: (credential: CredentialData) => void;

    /** Optional title for the modal */
    title?: string;
}

/**
 * Modal component for creating new credentials
 * 
 * This component provides a popup modal with a form for creating
 * new credentials that can be reused across different parts of the application.
 */
export default function CreateCredentialModal({
    open,
    onClose,
    onSave,
    title = "Create New Credential"
}: CreateCredentialModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Initialize form with the credential hook
    const { methods, isValid, onSubmit, reset } = useCredentialForm({
        isEditMode: false,
        onSuccess: (credential) => {
            if (onSave) {
                onSave(credential);
            }
            handleClose();
        }
    });

    /**
     * Handles modal close action, resetting the form
     */
    const handleClose = () => {
        reset();
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
                    <PageContainer.Header
                        title={title}
                    />
                    <PageContainer.Subheader>
                        Create a new credential to protect your Trunks or Agent
                    </PageContainer.Subheader>

                    <CredentialFormFields methods={methods} formId="credential-modal-form">
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                            <Button
                                variant="contained"
                                onClick={handleSubmit}
                                disabled={!isValid || isSubmitting}
                            >
                                {isSubmitting ? "SAVING..." : "SAVE"}
                            </Button>
                        </Box>
                    </CredentialFormFields>
                </PageContainer>
            </Box>
        </Dialog>
    );
} 