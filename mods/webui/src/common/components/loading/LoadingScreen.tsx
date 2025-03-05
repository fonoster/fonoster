import React from "react";
import { Logo } from "@/common/components/logo/Logo";

interface LoadingScreenProps {
  logoSize?: "small" | "medium" | "large";
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  logoSize = "large"
}) => {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        flexDirection: "column",
        gap: "1rem"
      }}
    >
      <Logo size={logoSize} />
    </div>
  );
};
