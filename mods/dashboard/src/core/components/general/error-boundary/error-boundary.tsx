import { styled } from "@mui/material";
import { Button } from "../../design-system/ui/button/button";
import { useNavigate } from "react-router";

/*
 * Copyright (C) 2025 by Fonoster Inc (https://fonoster.com)
 * http://github.com/fonoster/fonoster
 *
 * This file is part of Fonoster
 *
 * Licensed under the MIT License (the "License");
 * you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 *
 *    https://opensource.org/licenses/MIT
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
export const ErrorLayout = ({ errorCode }: { errorCode: number }) => {
  const navigate = useNavigate();

  const errorMessage =
    errorCode === 404
      ? "Oops! Page not found"
      : "Oops! You've encountered an error. Please try again later.";

  return (
    <ErrorRoot>
      <ErrorMessage>
        <ErrorCode>{errorCode}</ErrorCode>
        <ErrorDescription>{errorMessage}</ErrorDescription>
      </ErrorMessage>
      <Button onClick={() => navigate("/", { viewTransition: true })}>
        Go to Home
      </Button>
    </ErrorRoot>
  );
};

export const ErrorRoot = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  height: "100vh",
  backgroundColor: theme.palette.background.default,
  color: theme.palette.text.primary,
  gap: theme.spacing(2)
}));

export const ErrorMessage = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  fontSize: theme.typography.h4.fontSize,
  color: theme.palette.error.main
}));

export const ErrorCode = styled("div")(({ theme }) => ({
  fontSize: theme.typography.h1.fontSize,
  fontWeight: "bold",
  color: theme.palette.base["03"]
}));

export const ErrorDescription = styled("div")(({ theme }) => ({
  fontSize: theme.typography.body1.fontSize,
  color: theme.palette.base["04"]
}));
