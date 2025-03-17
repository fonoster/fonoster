import { useFormContext } from "react-hook-form";
import { Checkbox } from "@stories/checkbox/Checkbox";

const CheckboxContext = ({ name, label }: { name: string; label: string }) => {
  const { register } = useFormContext();

  return <Checkbox {...register(name)}>{label}</Checkbox>;
};

export { CheckboxContext };
