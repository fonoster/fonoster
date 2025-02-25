import { useFormContext } from "react-hook-form";
import { Select } from "@stories/select/Select";
import { ReactNode } from "react";

interface SelectContextProps {
  name: string;
  label: string;
  options: Array<{
    value: string | number;
    label: string;
  }>;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  disabled?: boolean;
  defaultValue?: string | number;
  id: string;
}

const SelectContext = ({
  name,
  label,
  options,
  leadingIcon,
  trailingIcon,
  disabled = false,
  defaultValue = ''
}: SelectContextProps) => {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  return (
    <Select
      {...register(name)}
      label={label}
      error={!!errors[name]}
      supportingText={errors[name]?.message?.toString() || ""}
      options={options}
      leadingIcon={leadingIcon}
      trailingIcon={trailingIcon}
      disabled={disabled}
      defaultValue={defaultValue}
    />
  );
};

export { SelectContext };