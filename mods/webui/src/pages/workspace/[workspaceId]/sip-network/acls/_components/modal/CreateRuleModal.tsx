import { Dialog, Box } from "@mui/material";
import { Button } from "@stories/button/Button";
import { InputContext } from "@/common/hooksForm/InputContext";
import { SelectContext } from "@/common/hooksForm/SelectContext";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import PageContainer from "@/common/components/layout/pages";
const isValidIP = (ip: string) => {
  const parts = ip.split(".");
  if (parts.length !== 4) return false;

  return parts.every((part) => {
    const num = parseInt(part, 10);
    return !isNaN(num) && num >= 0 && num <= 255 && part === num.toString();
  });
};

const isValidCIDR = (cidr: string) => {
  const [ip, prefix] = cidr.split("/");
  if (!ip || !prefix) return false;
  if (!isValidIP(ip)) return false;
  const prefixNum = parseInt(prefix, 10);
  return !isNaN(prefixNum) && prefixNum >= 0 && prefixNum <= 32;
};

const ruleSchema = z.object({
  ipOrCIDR: z
    .string()
    .min(1, "IP or CIDR is required")
    .refine((value) => isValidIP(value) || isValidCIDR(value), {
      message:
        "Must be a valid IP (e.g., 192.168.1.1) or CIDR range (e.g., 192.168.1.0/24)"
    }),
  category: z.enum(["Allow", "Deny"])
});

type RuleFormData = z.infer<typeof ruleSchema>;

interface CreateRuleModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: RuleFormData) => void;
}

export default function CreateRuleModal({
  open,
  onClose,
  onSave
}: CreateRuleModalProps) {
  const methods = useForm<RuleFormData>({
    resolver: zodResolver(ruleSchema),
    defaultValues: {
      ipOrCIDR: "",
      category: "Allow"
    },
    mode: "onChange"
  });

  const {
    handleSubmit,
    reset,
    formState: { isValid }
  } = methods;

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = handleSubmit((data) => {
    onSave(data);
    handleClose();
  });

  const categoryOptions = [
    { value: "Allow", label: "Allow" },
    { value: "Deny", label: "Deny" }
  ];

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <Box sx={{ px: 6, pt: 4 }}>
        <PageContainer>
          <PageContainer.Header title="Add Network Rule" />
          <PageContainer.Subheader>
            Create a new ACL to protect your Domains, Peers, and Trunks
          </PageContainer.Subheader>
          <PageContainer.ContentForm methods={methods} formId="rule-form">
            <InputContext
              name="ipOrCIDR"
              label="IP or CIDR*"
              type="text"
              leadingIcon={null}
              trailingIcon={null}
              id="acl-ipOrCIDR"
              placeholder="192.168.1.1 or 192.168.1.0/24"
            />

            <SelectContext
              name="category"
              label="Rule Type*"
              options={categoryOptions}
              id="acl-category"
            />

            <Box
              sx={{ display: "flex", justifyContent: "flex-end", mt: 3, pb: 3 }}
            >
              <Button
                variant="contained"
                onClick={onSubmit}
                disabled={!isValid}
              >
                Add Rule
              </Button>
            </Box>
          </PageContainer.ContentForm>
        </PageContainer>
      </Box>
    </Dialog>
  );
}
