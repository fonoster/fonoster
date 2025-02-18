import { useFormContext } from "react-hook-form";
import { InputText } from "../../../stories/inputtext/InputText";
import { ReactNode } from "react";

interface InputContextProps {
  name: string;
  label: string;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  type?: string;
}

const InputContext = ({ 
  name, 
  label, 
  leadingIcon, 
  trailingIcon, 
  type = "text"
}: InputContextProps) => {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  return (
    <InputText
      {...register(name)}
      label={label}
      error={!!errors[name]}
      supportingText={errors[name]?.message || ""}
      leadingIcon={leadingIcon}
      trailingIcon={trailingIcon}
      type={type}
    />
  );
};

export { InputContext }; 