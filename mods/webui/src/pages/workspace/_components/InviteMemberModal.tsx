import { Dialog, DialogTitle, DialogContent, Box, Button } from "@mui/material";
import { FormProvider, useForm } from "react-hook-form";
import { SelectContext } from "@/common/hooksForm/SelectContext";
import { InputContext } from "@/common/hooksForm/InputContext";
import { Role } from "@fonoster/types";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const inviteMemberSchema = z.object({
  role: z.string().min(1, "Please select a role"),
  name: z.string().min(1, "Please enter full name"),
  email: z.string().email("Invalid email").min(1, "Please enter email address")
});

type InviteMemberFormData = z.infer<typeof inviteMemberSchema>;

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: InviteMemberFormData) => void;
}

export const InviteMemberModal = ({ open, onClose, onSubmit }: Props) => {
  const methods = useForm<InviteMemberFormData>({
    resolver: zodResolver(inviteMemberSchema),
    defaultValues: {
      role: "",
      name: "",
      email: ""
    }
  });

  const roleOptions = Object.entries(Role).map(([key, value]) => ({
    value: value,
    label: key
  }));

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle
        sx={{
          fontSize: "1.2rem",
          fontWeight: 500,
          pb: 1
        }}
      >
        Invite a new member to your workspace
      </DialogTitle>
      <DialogContent>
        <FormProvider {...methods}>
          <Box
            component="form"
            onSubmit={methods.handleSubmit(onSubmit)}
            sx={{ mt: 2 }}
          >
            <Box sx={{ mb: 3 }}>
              <SelectContext
                name="role"
                label="Role"
                options={roleOptions}
                id="member-role"
              />
            </Box>

            <Box sx={{ mb: 3 }}>
              <InputContext
                name="name"
                label="Name"
                helperText="Please enter full name"
                id="member-name"
              />
            </Box>

            <Box sx={{ mb: 3 }}>
              <InputContext
                name="email"
                label="Email Address"
                type="email"
                helperText="Please enter email address"
                id="member-email"
              />
            </Box>

            <Button
              type="submit"
              variant="contained"
              fullWidth
              sx={{
                mt: 2,
                textTransform: "uppercase",
                py: 1.5
              }}
            >
              Invite Member
            </Button>
          </Box>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
};
