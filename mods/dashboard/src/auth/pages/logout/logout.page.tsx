import { useSubmit } from "react-router";

import { Splash } from "~/core/components/general/splash/splash";
import { useFonoster } from "~/core/sdk/hooks/use-fonoster";
import { useLayoutEffect } from "react";

export { action } from "./logout.action";

export default function Logout() {
  const submit = useSubmit();
  const { logout } = useFonoster();

  useLayoutEffect(() => {
    logout();
    submit(null, { method: "post" });
  }, [logout]);

  return <Splash />;
}
