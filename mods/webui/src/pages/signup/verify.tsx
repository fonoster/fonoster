import { useState, useEffect } from "react";
import { Button, Typography, useTheme, Box } from "@mui/material";
import { useForm } from "react-hook-form";
import { InputContext } from "@/common/hooksForm/InputContext";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Layout,
  PageContainer,
  Card,
  Content
} from "@/common/components/layout/noAuth/Layout";
import { ProgressIndicator } from "@stories/progessindicator/ProgressIndicator";
import { useUser } from "@/common/sdk/hooks/useUser";
import { useRouter } from "next/router";
import { useFonosterClient } from "@/common/sdk/hooks/useFonosterClient";
import { CodeType } from "@fonoster/types";

const steps = [
  "Verify email address",
  "Enter phone number",
  "Verify phone number"
];

const emailVerificationSchema = z.object({
  code: z.string().min(6, "Invalid code")
});

const phoneVerificationSchema = z.object({
  phoneNumber: z.string().min(10, "Invalid phone number"),
  code: z.string().min(6, "Invalid code").optional()
});

type EmailVerificationData = z.infer<typeof emailVerificationSchema>;
type PhoneVerificationData = z.infer<typeof phoneVerificationSchema>;

const VerifyPage = () => {
  const theme = useTheme();
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(1);
  const [emailResendTimer, setEmailResendTimer] = useState(0);
  const [phoneResendTimer, setPhoneResendTimer] = useState(0);
  const { loggedUser, idToken } = useUser();
  const [currentProgress, setCurrentProgress] = useState(1);
  const [isVerificationComplete, setIsVerificationComplete] = useState(false);
  const { verifyCode, sendVerificationCode, isReady } = useFonosterClient();

  useEffect(() => {
    const initVerificationFlow = async () => {
      try {
        const token = await idToken();
        if (token) {
          if (token.emailVerified) {
            setActiveStep(2);
            setCurrentProgress(2);
          } else {
            setActiveStep(1);
            setCurrentProgress(1);
            if (token.email) {
              const result = await sendVerificationCode({
                type: "EMAIL" as CodeType,
                value: token.email
              });
            }
          }
        }
      } catch (error) {}
    };
    if (isReady) {
      initVerificationFlow();
    }
  }, [isReady]);

  const emailMethods = useForm<EmailVerificationData>({
    resolver: zodResolver(emailVerificationSchema),
    defaultValues: {
      code: ""
    }
  });

  const phoneMethods = useForm<PhoneVerificationData>({
    resolver: zodResolver(phoneVerificationSchema),
    defaultValues: {
      phoneNumber: "",
      code: ""
    }
  });

  const startResendTimer = (
    setTimer: React.Dispatch<React.SetStateAction<number>>
  ) => {
    setTimer(30);
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleVerifyEmail = async (code: string) => {
    try {
      const token = await idToken();
      if (!token?.email) {
        return;
      }

      const result = await verifyCode({
        username: token.email,
        contactType: "EMAIL" as CodeType,
        value: token.email,
        verificationCode: code
      });

      if (result) {
        setActiveStep(2);
        setCurrentProgress(2);
      }
    } catch (error) {}
  };

  const handlePhoneSubmit = async (phoneNumber: string) => {
    try {
      await sendVerificationCode({
        type: "PHONE" as CodeType,
        value: phoneNumber
      });
      setActiveStep(3);
      setCurrentProgress(3);
    } catch (error) {}
  };

  const handleVerifyPhone = async (code: string) => {
    try {
      const user = await loggedUser();
      const phoneNumber = phoneMethods.getValues("phoneNumber");

      if (!user?.id || !phoneNumber) {
        return;
      }

      const result = await verifyCode({
        username: user.id,
        contactType: "PHONE" as CodeType,
        value: phoneNumber,
        verificationCode: code
      });

      if (result) {
        setIsVerificationComplete(true);
        setCurrentProgress(3);
        await router.push("/workspace").catch((error) => {});
      }
    } catch (error) {}
  };

  const getStepContent = (step: number) => {
    switch (step) {
      case 1:
        return (
          <Content
            title="Verify your email"
            description="Please enter the verification code we've sent to your email address."
          >
            <Box>
              <InputContext
                name="code"
                label="Verification Code"
                type="text"
                id="verificationCodeEmail"
                helperText="Please enter your verification code"
              />

              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={() => {
                  const code = emailMethods.getValues("code");
                  if (code) handleVerifyEmail(code);
                }}
              >
                Verify email address
              </Button>

              <Box sx={{ textAlign: "center", mt: 2 }}>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  display="inline"
                >
                  Didn't receive the code?{" "}
                </Typography>
                {emailResendTimer > 0 ? (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    display="inline"
                  >
                    Send again in {emailResendTimer} seconds
                  </Typography>
                ) : (
                  <Typography
                    variant="body2"
                    component="span"
                    color="primary"
                    onClick={() => {
                      startResendTimer(setEmailResendTimer);
                      handleVerifyEmail(emailMethods.getValues("code"));
                    }}
                    sx={{
                      cursor: "pointer",
                      "&:hover": { textDecoration: "underline" }
                    }}
                  >
                    Send again
                  </Typography>
                )}
              </Box>
            </Box>
          </Content>
        );

      case 2:
        return (
          <Content title="Enter your phone number">
            <Box>
              <InputContext
                name="phoneNumber"
                label="Phone Number"
                type="tel"
                id="phoneNumber"
                helperText="Please enter your phone number"
              />

              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={() => {
                  const phoneNumber = phoneMethods.getValues("phoneNumber");
                  if (phoneNumber) handlePhoneSubmit(phoneNumber);
                }}
              >
                Continue
              </Button>
            </Box>
          </Content>
        );

      case 3:
        return isVerificationComplete ? (
          <Content title="Verification Complete">
            <Box sx={{ textAlign: "center" }}>
              <Typography variant="body1" color="text.secondary">
                Your account has been successfully verified.
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Redirecting to workspace...
              </Typography>
            </Box>
          </Content>
        ) : (
          <Content title="Verify phone number">
            <Box>
              <InputContext
                name="code"
                label="Verification Code"
                type="text"
                id="phoneCode"
                helperText="Enter the code sent to your phone"
              />

              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={async () => {
                  const code = phoneMethods.getValues("code");
                  if (code) {
                    await handleVerifyPhone(code);
                  }
                }}
              >
                Verify Code
              </Button>

              <Box sx={{ textAlign: "center", mt: 2 }}>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  display="inline"
                >
                  Didn't receive the code?{" "}
                </Typography>
                {phoneResendTimer > 0 ? (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    display="inline"
                  >
                    Send again in {phoneResendTimer} seconds
                  </Typography>
                ) : (
                  <Typography
                    variant="body2"
                    component="span"
                    color="primary"
                    onClick={() => {
                      startResendTimer(setPhoneResendTimer);
                      handlePhoneSubmit(phoneMethods.getValues("phoneNumber"));
                    }}
                    sx={{
                      cursor: "pointer",
                      "&:hover": { textDecoration: "underline" }
                    }}
                  >
                    Send again
                  </Typography>
                )}
              </Box>
            </Box>
          </Content>
        );

      default:
        return null;
    }
  };

  return (
    <Layout methods={activeStep === 1 ? emailMethods : phoneMethods}>
      <PageContainer>
        <Box
          sx={{
            width: "100%",
            maxWidth: 1000,
            margin: "0 auto",
            marginBottom: theme.spacing(4),
            marginTop: theme.spacing(4)
          }}
        >
          <ProgressIndicator steps={steps} current={currentProgress} />
        </Box>
        <Card>{getStepContent(activeStep)}</Card>
      </PageContainer>
    </Layout>
  );
};

export default VerifyPage;
