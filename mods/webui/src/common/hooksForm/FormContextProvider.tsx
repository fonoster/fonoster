import React from "react";
import { useForm, FormProvider } from "react-hook-form";

const FormContextProvider = ({ children }: { children: React.ReactNode }) => {
  const methods = useForm();

  return <FormProvider {...methods}>{children}</FormProvider>;
};

export default FormContextProvider;
