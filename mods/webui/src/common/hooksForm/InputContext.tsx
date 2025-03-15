import { useFormContext } from "react-hook-form";
import { InputText } from "@stories/inputtext/InputText";
import { ReactNode } from "react";

interface InputContextProps {
  name: string;
  label: string;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  type?: string;
  accept?: string;
  multiple?: boolean;
  helperText?: string;
  onFileChange?: (files: FileList | null) => void;
  id: string;
  shrink?: boolean;
  multiline?: boolean;
  placeholder?: string;
}

const InputContext = ({
  name,
  label,
  leadingIcon,
  trailingIcon,
  type = "text",
  accept,
  multiple = false,
  helperText,
  onFileChange,
  id,
  shrink = true,
  multiline = false,
  placeholder = ""
}: InputContextProps) => {
  const {
    register,
    formState: { errors }
  } = useFormContext();

  if (type === "file") {
    return (
      <InputText
        {...register(name, {
          onChange: (e) => {
            const files = e.target.files;
            if (onFileChange) {
              onFileChange(files);
            }
          }
        })}
        id={id}
        type="file"
        label={label}
        error={!!errors[name]}
        supportingText={errors[name]?.message?.toString() || helperText}
        leadingIcon={leadingIcon}
        trailingIcon={trailingIcon}
        accept={accept}
        multiple={multiple}
        shrink={shrink}
        placeholder={placeholder}
      />
    );
  }

  return (
    <InputText
      {...register(name)}
      label={label}
      id={id}
      error={!!errors[name]}
      supportingText={errors[name]?.message?.toString() || helperText}
      leadingIcon={leadingIcon}
      trailingIcon={trailingIcon}
      type={type}
      shrink={shrink}
      multiline={multiline}
      placeholder={placeholder}
    />
  );
};

export { InputContext };
