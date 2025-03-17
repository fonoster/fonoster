import { Dialog, Box, Alert } from "@mui/material";
import { Button } from "@stories/button/Button";
import { InputContext } from "@/common/hooksForm/InputContext";
import { SelectContext } from "@/common/hooksForm/SelectContext";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import PageContainer from "@/common/components/layout/pages";
import { useEffect, useState } from "react";

const egressRuleSchema = z.object({
  rule: z.string().min(1, "Rule is required"),
  numberRef: z.string().min(1, "Outbound Number is required")
});

type EgressRuleFormData = z.infer<typeof egressRuleSchema>;

interface AddEgressRuleModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: EgressRuleFormData) => void;
  outboundNumbers?: { value: string; label: string }[];
  existingRules?: Array<{ rule: string; numberRef: string }>;
}

export default function AddEgressRuleModal({
  open,
  onClose,
  onSave,
  outboundNumbers = [],
  existingRules = []
}: AddEgressRuleModalProps) {
  const [duplicateError, setDuplicateError] = useState<string | null>(null);

  const methods = useForm<EgressRuleFormData>({
    resolver: zodResolver(egressRuleSchema),
    defaultValues: {
      rule: "*",
      numberRef: outboundNumbers.length > 0 ? outboundNumbers[0].value : ""
    },
    mode: "onChange"
  });

  const {
    handleSubmit,
    reset,
    formState: { isValid, errors },
    setValue,
    watch
  } = methods;
  const selectedNumberRef = watch("numberRef");

  useEffect(() => {
    setDuplicateError(null);
  }, [open, selectedNumberRef]);

  useEffect(() => {
    if (outboundNumbers.length > 0) {
      setValue("numberRef", outboundNumbers[0].value);
    }
  }, [outboundNumbers, setValue]);

  const handleClose = () => {
    reset();
    setDuplicateError(null);
    onClose();
  };

  const onSubmit = handleSubmit((data) => {
    const duplicateRule = existingRules.find(
      (rule) => rule.numberRef === data.numberRef
    );

    if (duplicateRule) {
      const numberLabel =
        outboundNumbers.find((n) => n.value === data.numberRef)?.label ||
        data.numberRef;
      setDuplicateError(
        `A rule already exists for number ${numberLabel} (Rule: ${duplicateRule.rule})`
      );
      return;
    }

    onSave(data);
    handleClose();
  });

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <Box sx={{ px: 6, pt: 4 }}>
        <PageContainer>
          <PageContainer.Header title="Add Egress Rule" />
          <PageContainer.Subheader>
            When the destination matches this rule the selected number is used
          </PageContainer.Subheader>
          <PageContainer.ContentForm
            methods={methods}
            formId="egress-rule-form"
          >
            {duplicateError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {duplicateError}
              </Alert>
            )}

            <InputContext
              name="rule"
              label="Rule"
              type="text"
              leadingIcon={null}
              trailingIcon={null}
              id="domain-rule"
            />

            <SelectContext
              name="numberRef"
              label="Select Outbound Number"
              options={outboundNumbers}
              id="domain-number-ref"
            />

            <Box
              sx={{ display: "flex", justifyContent: "center", mt: 3, pb: 3 }}
            >
              <Button
                variant="contained"
                onClick={onSubmit}
                disabled={!isValid}
              >
                SAVE
              </Button>
            </Box>
          </PageContainer.ContentForm>
        </PageContainer>
      </Box>
    </Dialog>
  );
}
