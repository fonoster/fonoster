import { useFormContext } from "react-hook-form";
import { Checkbox } from "@stories/checkbox/Checkbox";

const CheckboxContext = ({
  name,
  label,
  id
}: {
  name: string;
  label: string;
  id: string;
}) => {
  const { register } = useFormContext();

  return (
    <Checkbox {...register(name)} id={id}>
      {label}
    </Checkbox>
  );
};

export { CheckboxContext };
