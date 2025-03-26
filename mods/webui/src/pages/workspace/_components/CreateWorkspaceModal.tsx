import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  IconButton
} from "@mui/material";
import { FormProvider, useForm } from "react-hook-form";
import { InputContext } from "@/common/hooksForm/InputContext";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useWorkspaces } from "@/common/sdk/hooks/useWorkspaces";
import CloseIcon from "@mui/icons-material/Close";
import { Button } from "@stories/button/Button";
import { alpha, styled, Theme } from "@mui/material/styles";
import { Typography } from "@stories/typography/Typography";
import { ErrorType, useNotification } from "@/common/hooks/useNotification";

const StyledDialogTitle = styled(DialogTitle)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: theme.spacing(2, 3),
  fontSize: "1.125rem",
  fontWeight: 500
}));

const StyledDialogContent = styled(DialogContent)(({ theme }) => ({
  padding: theme.spacing(2, 3, 3)
}));

const createWorkspaceSchema = z.object({
  workspaceName: z.string().min(1, "Workspace name is required")
});

type CreateWorkspaceFormData = z.infer<typeof createWorkspaceSchema>;

interface CreateWorkspaceModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const CreateWorkspaceModal = ({
  open,
  onClose,
  onSuccess
}: CreateWorkspaceModalProps) => {
  const { createWorkspace } = useWorkspaces();
  const { notifyError, notifySuccess, NotificationComponent } =
    useNotification();

  const methods = useForm<CreateWorkspaceFormData>({
    resolver: zodResolver(createWorkspaceSchema),
    defaultValues: {
      workspaceName: ""
    }
  });

  const {
    handleSubmit,
    formState: { errors, isSubmitting, isValid }
  } = methods;

  const onSubmit = async (data: CreateWorkspaceFormData) => {
    try {
      const result = await createWorkspace({
        name: data.workspaceName
      });

      if (result) {
        methods.reset();
        if (onSuccess) {
          onSuccess();
        }
        setTimeout(() => {
          notifySuccess("Workspace created successfully");
          onClose();
        }, 400);
      }
    } catch (error) {
      notifyError(error as ErrorType);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: "0px",
            boxShadow: "0px 4px 32px 0px rgba(0, 0, 0, 0.15)",
            maxWidth: "430px",
            margin: "0 auto",
            overflow: "visible"
          }
        },
        backdrop: {
          sx: (theme) => ({
            backgroundColor: alpha(String(theme.palette.primary["100"]), 0.75)
          })
        }
      }}
    >
      <NotificationComponent />
      <StyledDialogTitle>
        <Typography variant="body-large">Create workspace</Typography>
        <IconButton
          aria-label="close"
          onClick={onClose}
          size="small"
          sx={{
            color: (theme) => theme.palette.grey[500]
          }}
        >
          <CloseIcon />
        </IconButton>
      </StyledDialogTitle>
      <StyledDialogContent sx={{ overflow: "visible" }}>
        <FormProvider {...methods}>
          <Box
            component="form"
            onSubmit={handleSubmit(onSubmit)}
            sx={{
              width: "100%"
            }}
          >
            <Box sx={{ mb: 1 }}>
              <InputContext
                id="workspace-create-name"
                name="workspaceName"
                label="Name"
                type="text"
                shrink
              />
              {errors.workspaceName && (
                <Typography color="error" variant="body-small" sx={{ mt: 1 }}>
                  {errors.workspaceName.message}
                </Typography>
              )}
            </Box>

            <Box sx={{ mb: 3, ml: 2 }}>
              <Typography
                variant="body-small"
                sx={{
                  fontSize: "10px",
                  color: (theme: Theme) => theme.palette.text.secondary
                }}
              >
                Please enter full name
              </Typography>
            </Box>

            <Box sx={{ display: "flex", justifyContent: "center" }}>
              <Button
                variant="contained"
                disabled={isSubmitting || !isValid}
                onClick={handleSubmit(onSubmit)}
              >
                CREATE WORKSPACE
              </Button>
            </Box>
          </Box>
        </FormProvider>
      </StyledDialogContent>
    </Dialog>
  );
};
