import { useState } from "react";
import {
  Container,
  styled,
  Stack,
  Box,
  TextField,
  IconButton,
  InputAdornment
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { ProgressIndicator } from "../../../stories/progessindicator/ProgressIndicator";
import { useForm, FormProvider } from "react-hook-form";
import { InputContext } from "@/common/hooksForm/InputContext";
import { SelectContext } from "@/common/hooksForm/SelectContext";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useWorkspaces } from "@/common/sdk/hooks/useWorkspaces";
import { useAPIKey } from "@/common/sdk/hooks/useAPIKey";
import { Role } from "@fonoster/types";
import { useRouter } from "next/router";
import { Content } from "@/common/components/layout/noAuth/Layout";
import { Button } from "@stories/button/Button";
import { Typography } from "@stories/typography/Typography";

const WorkspaceContainer = styled(Container)(({ theme }) => ({
  minHeight: `calc(100vh - 80px)`,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  maxWidth: "1000px !important",
  padding: theme.spacing(3)
}));

const CardContainer = styled(Box)({
  display: "flex",
  justifyContent: "center",
  width: "50%"
});

type option = {
  value: string;
  label: string;
};

const combinedSchema = z.object({
  workspaceName: z.string().min(1, "Workspace name is required"),
  region: z.string().optional(),
  apiKey: z.string().optional(),
  secretName: z.string().min(1, "Secret name is required"),
  apiKeyDescription: z.string().optional(),
  accessRole: z.string().min(1, "Access role is required")
});

const regions = [{ value: "NYC01", label: "NYC01" }];

const accessRoles = [
  { value: "admin", label: "Admin" },
  { value: "user", label: "User" },
  { value: "viewer", label: "Viewer" }
];

const steps = ["Create workspace", "Select region", "Copy API Key"];
const deafultRegion = {
  value: process.env.NEXT_PUBLIC_FONOSTER_REGION || "NYC01",
  label: process.env.NEXT_PUBLIC_FONOSTER_REGION || "NYC01"
};

const CreateWorkspacePage = () => {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(0);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [apiKey, setApiKey] = useState("");
  const [apiKeySecret, setApiKeySecret] = useState("");
  const [isApiKeyGenerated, setIsApiKeyGenerated] = useState(false);
  const { createWorkspace } = useWorkspaces();
  const { createAPIKey } = useAPIKey();

  const methods = useForm({
    resolver: zodResolver(combinedSchema),
    defaultValues: {
      workspaceName: "",
      region: "",
      apiKey: "",
      secretName: "",
      apiKeyDescription: "",
      accessRole: ""
    },
    mode: "onChange"
  });

  const {
    handleSubmit,
    trigger,
    watch,
    formState: { errors }
  } = methods;

  const validateCurrentStep = async () => {
    const currentValues = methods.getValues();
    const activeStepFields = {
      0: ["workspaceName"],
      1: ["region"],
      2: ["secretName", "apiKeyDescription", "accessRole"]
    };

    if (activeStep === 0) {
      if (!currentValues.workspaceName?.trim()) {
        methods.setError("workspaceName", {
          type: "required",
          message: "Workspace name is required"
        });
        return false;
      }
      const isValid = await trigger("workspaceName");
      return isValid;
    } else if (activeStep === 1) {
      return true;
    } else if (activeStep === 2) {
      if (!isApiKeyGenerated) {
        if (!currentValues.secretName?.trim()) {
          methods.setError("secretName", {
            type: "required",
            message: "Secret name is required"
          });
          return false;
        }
        if (!currentValues.accessRole) {
          methods.setError("accessRole", {
            type: "required",
            message: "Access role is required"
          });
          return false;
        }
        const isValid = await trigger(["secretName", "accessRole"]);
        return isValid;
      }
      return true;
    }

    return true;
  };

  const handleStepSubmit = async (step: number) => {
    try {
      const isValid = await validateCurrentStep();

      if (!isValid) {
        return;
      }

      const data = methods.getValues();

      if (step === 0) {
        if (data.workspaceName) {
          const result = await createWorkspace({
            name: data.workspaceName as string
          });
          setActiveStep(1);
          setCurrentProgress(1);
        }
      } else if (step === 1) {
        setActiveStep(2);
        setCurrentProgress(2);
      } else if (step === 2) {
        if (!isApiKeyGenerated && data.secretName && data.accessRole) {
          const result = await createAPIKey({
            role: data.accessRole as Role
          });

          if (result) {
            setApiKey(result.accessKeyId);
            setApiKeySecret(result.accessKeySecret);
            setIsApiKeyGenerated(true);
          }
        }
      }
    } catch (error) {
      console.error("Error in submission:", error);
    }
  };

  const skipStep = (step: number) => {
    if (step === 0) {
      setActiveStep(1);
      setCurrentProgress(1);
    } else if (step === 1) {
      setActiveStep(2);
      setCurrentProgress(2);
    } else if (step === 2) {
      router.push("/workspace");
    }
  };

  const backStep = () => {
    const prevStep = activeStep - 1;
    if (prevStep >= 0) {
      setActiveStep(prevStep);
      setCurrentProgress(prevStep);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Content
            title="Create a workspace to begin managing your queue"
            description={
              "Manage all resources in your Fonoster workspace. You can also invite members, access applications, enable integrations, and more."
            }
          >
            <Stack spacing={3}>
              <InputContext
                id="workspace-create-workspace-name"
                name="workspaceName"
                label="Workspace Name"
                type="text"
                leadingIcon={null}
                trailingIcon={null}
                helperText="Please enter your workspace name"
              />

              {errors.workspaceName && (
                <Typography color="error" variant="body-small">
                  {errors.workspaceName.message}
                </Typography>
              )}

              <Box
                style={{
                  display: "flex",
                  justifyContent: "center",
                  marginTop: "2.5rem"
                }}
              >
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={() => handleStepSubmit(0)}
                  id="workspace-create-button-create-workspace"
                >
                  Create Workspace
                </Button>
              </Box>

              <Box
                style={{
                  display: "flex",
                  justifyContent: "center",
                  marginTop: "15px"
                }}
              >
                <Typography
                  variant="body-small-underline"
                  sx={{ cursor: "pointer" }}
                  onClick={() => skipStep(0)}
                >
                  Skip this step
                </Typography>
              </Box>
            </Stack>
          </Content>
        );

      case 1:
        return (
          <Stack>
            <Content
              title="Select your region"
              description={
                "Select the region closest to your business operations"
              }
            >
              <SelectContext
                id="workspace-create-region"
                name="region"
                label="Select Region"
                options={regions}
                defaultValue={deafultRegion}
                disabled={true}
              />

              {errors.region && (
                <Typography color="error" variant="body-small">
                  {errors.region.message}
                </Typography>
              )}

              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={() => handleStepSubmit(1)}
                id="workspace-create-button-continue"
              >
                Continue
              </Button>

              <Box
                sx={{ display: "flex", justifyContent: "space-between", mt: 1 }}
              >
                <Typography
                  variant="body-small-underline"
                  color="primary"
                  sx={{ cursor: "pointer", textDecoration: "underline" }}
                  onClick={backStep}
                >
                  Back Step
                </Typography>
                <Typography
                  variant="body-small-underline"
                  color="primary"
                  sx={{ cursor: "pointer", textDecoration: "underline" }}
                  onClick={() => skipStep(1)}
                >
                  Skip Step
                </Typography>
              </Box>
            </Content>
          </Stack>
        );

      case 2:
        return (
          <Stack spacing={3}>
            <Content
              title={isApiKeyGenerated ? "Copy API Key" : "Generate API Key"}
              description={
                isApiKeyGenerated
                  ? "Store this API key securely. You won't be able to see it again."
                  : "Fill in the details to generate your API key."
              }
            >
              {!isApiKeyGenerated ? (
                <>
                  <InputContext
                    id="workspace-create-secret-name"
                    name="secretName"
                    label="Secret Name"
                    type="text"
                    leadingIcon={null}
                    trailingIcon={null}
                  />

                  <InputContext
                    id="workspace-create-api-key-description"
                    name="apiKeyDescription"
                    label="API Key Description"
                    type="text"
                    leadingIcon={null}
                    trailingIcon={null}
                  />

                  <SelectContext
                    id="workspace-create-access-role"
                    name="accessRole"
                    label="Access Role"
                    options={accessRoles}
                    defaultValue={{ value: "admin", label: "Admin" }}
                  />

                  <Button
                    id="workspace-create-button-generate-api-key"
                    fullWidth
                    variant="contained"
                    size="large"
                    onClick={() => handleStepSubmit(2)}
                  >
                    Generate API Key
                  </Button>
                </>
              ) : (
                <>
                  <TextField
                    fullWidth
                    label="API Key"
                    value={apiKey}
                    InputProps={{
                      readOnly: true,
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            edge="end"
                            onClick={() => copyToClipboard(apiKey)}
                            aria-label="copy api key"
                          >
                            <ContentCopyIcon />
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                    variant="outlined"
                    margin="normal"
                  />

                  <TextField
                    fullWidth
                    label="API Secret"
                    value={apiKeySecret}
                    InputProps={{
                      readOnly: true,
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            edge="end"
                            onClick={() => copyToClipboard(apiKeySecret)}
                            aria-label="copy api secret"
                          >
                            <ContentCopyIcon />
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                    variant="outlined"
                    margin="normal"
                  />

                  <Typography variant="body-small" color="error" align="center">
                    Make sure to copy your API key and secret before closing
                    this window. You won't be able to see them again.
                  </Typography>
                </>
              )}

              <Box
                sx={{ display: "flex", justifyContent: "space-between", mt: 1 }}
              >
                <Typography
                  variant="body-small-underline"
                  color="primary"
                  sx={{ cursor: "pointer", textDecoration: "underline" }}
                  onClick={backStep}
                >
                  Back Step
                </Typography>
                <Typography
                  variant="body-small-underline"
                  color="primary"
                  sx={{ cursor: "pointer", textDecoration: "underline" }}
                  onClick={() => skipStep(2)}
                >
                  Skip Step
                </Typography>
              </Box>
            </Content>
          </Stack>
        );

      default:
        return "Unknown step";
    }
  };

  return (
    <WorkspaceContainer>
      <Box
        sx={{
          width: "100%",
          // display: "flex",
          justifyContent: "center",
          mb: 7,
          mt: 2
        }}
      >
        <ProgressIndicator steps={steps} current={currentProgress} />
      </Box>
      <CardContainer>
        <FormProvider {...methods}>
          <form onSubmit={(e) => e.preventDefault()}>
            {getStepContent(activeStep)}
          </form>
        </FormProvider>
      </CardContainer>
    </WorkspaceContainer>
  );
};

export default CreateWorkspacePage;
