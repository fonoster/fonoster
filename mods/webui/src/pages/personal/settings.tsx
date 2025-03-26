import { useState, useEffect } from "react";
import { Box, useTheme, Stack, Avatar, IconButton } from "@mui/material";
import { PhotoCamera } from "@mui/icons-material";
import { useForm } from "react-hook-form";
import { InputContext } from "@/common/hooksForm/InputContext";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useUser } from "@/common/sdk/hooks/useUser";
import PageContainer from "@/common/components/layout/pages";
import { Typography } from "@stories/typography/Typography";
import { Button } from "@stories/button/Button";
import { GenericToggle } from "@stories/generictoggle/GenericToggle";

const { ContentForm } = PageContainer;

type SettingsFormData = {
  ref?: string;
  name: string;
  email: string;
  newPassword?: string;
  confirmPassword?: string;
  avatar?: string;
};

const settingsSchema = z
  .object({
    ref: z.string().optional(),
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email address"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(/[^A-Za-z0-9]/, "Password must contain at least one symbol")
      .optional(),
    confirmPassword: z.string().optional(),
    avatar: z.string().optional()
  })
  .refine(
    (data) => {
      if (data.newPassword && data.newPassword !== data.confirmPassword) {
        return false;
      }
      return true;
    },
    {
      message: "Passwords don't match",
      path: ["confirmPassword"]
    }
  );

const SettingsPage = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [lightMode, setLightMode] = useState(true);
  const { updateUser, loggedUser } = useUser();

  const methods = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      ref: "",
      name: "",
      email: "",
      newPassword: "",
      confirmPassword: "",
      avatar: ""
    }
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await loggedUser();
        methods.reset({
          ref: userData?.ref || "",
          name: userData?.name || "",
          email: userData?.email || "",
          avatar: userData?.avatar || "",
          newPassword: "",
          confirmPassword: ""
        });
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      console.log("Avatar file:", e.target.files);
    }
  };

  const getInitials = (name: string) => {
    const nameParts = name.trim().split(" ");
    if (nameParts.length >= 2) {
      return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
    }
    return nameParts[0][0]?.toUpperCase() || "";
  };

  const avatar = methods.watch("avatar");
  const name = methods.watch("name");

  const onSubmit = async (data: SettingsFormData) => {
    try {
      const updatedData = {
        ...data,
        ref: String(data.ref),
        password: data.newPassword || undefined
      };

      await updateUser(updatedData);
    } catch (error) {
      console.error("Error updating settings:", error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <PageContainer>
      <ContentForm
        methods={methods}
        formId="personal-settings-form"
        onSubmit={methods.handleSubmit(onSubmit)}
      >
        <Typography variant="heading-small" sx={{ mt: 2 }}>
          Personal Settings
        </Typography>
        <InputContext id="user-settings-name" name="name" label="Name" />

        <InputContext
          id="user-settings-email"
          name="email"
          label="Email Address"
          type="email"
        />

        <Typography variant="heading-small" sx={{ mt: 2 }}>
          Change Password
        </Typography>

        <InputContext
          id="user-settings-new-password"
          name="newPassword"
          label="New Password"
          type="password"
        />

        <InputContext
          id="user-settings-confirm-password"
          name="confirmPassword"
          label="Confirm New Password"
          type="password"
        />

        <Box
          sx={{
            display: "flex",
            mb: 4
          }}
        >
          <Box sx={{ position: "relative" }}>
            <Avatar
              src={avatar || ""}
              alt={name}
              sx={{
                width: 100,
                height: 100,
                bgcolor: !avatar ? "primary.main" : undefined,
                fontSize: !avatar ? "2rem" : undefined
              }}
            >
              {!avatar && getInitials(name)}
            </Avatar>
            <IconButton
              color="primary"
              aria-label="upload picture"
              component="label"
              sx={{
                position: "absolute",
                bottom: 0,
                right: 0,
                backgroundColor: theme.palette.background.paper,
                "&:hover": { backgroundColor: theme.palette.background.paper }
              }}
            >
              <input
                hidden
                accept="image/*"
                type="file"
                onChange={handleAvatarChange}
              />
              <PhotoCamera />
            </IconButton>
          </Box>
        </Box>

        <Typography variant="body-medium" sx={{ mt: 2 }}>
          Display Settings
        </Typography>

        <Stack direction="row" alignItems="center" spacing={1}>
          <GenericToggle
            defaultValue
            checked={lightMode}
            onChange={(e) => setLightMode(e.target.checked)}
          />
          <Typography variant="body-medium">Light Mode</Typography>
        </Stack>

        <Button variant="contained">SAVE CHANGES</Button>
      </ContentForm>
    </PageContainer>
  );
};

export default SettingsPage;
