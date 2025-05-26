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
import * as SDK from "@fonoster/sdk";
import type {
  CreateApplicationRequest,
  UpdateApplicationRequest
} from "@fonoster/types";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useFonoster } from "~/core/sdk/hooks/use-fonoster";

export const useApplications = () => {
  const { client } = useFonoster();
  const applications = new SDK.Applications(client);

  return useQuery({
    queryKey: ["applications"],
    queryFn: () => applications.listApplications({ pageSize: 60 })
  });
};

export const useCreateApplication = () => {
  const { client } = useFonoster();
  const applications = new SDK.Applications(client);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreateApplicationRequest) =>
      applications.createApplication(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
    }
  });
};

export const useUpdateApplication = () => {
  const { client } = useFonoster();
  const applications = new SDK.Applications(client);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: UpdateApplicationRequest) =>
      applications.updateApplication(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
    }
  });
};

export const useDeleteApplication = () => {
  const { client } = useFonoster();
  const applications = new SDK.Applications(client);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ref: string) => applications.deleteApplication(ref),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
    }
  });
};
