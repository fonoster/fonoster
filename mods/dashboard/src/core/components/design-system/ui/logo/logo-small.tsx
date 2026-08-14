import { memo } from "react";
import { LogoMark } from "./logo-mark";

export const LogoSmall = memo(() => <LogoMark size={16} />);

LogoSmall.displayName = "LogoSmall";
