/**
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
import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode
} from "react";

/** What the bar says while billing has paused calls in the current workspace. */
export type BillingNoticeValue = {
  text: string;
  /** An in-app link (the owner's "Go to Billing"), followed in this tab by the router. */
  action?: { label: string; href: string; go: () => void };
};

const Context = createContext<{
  notice: BillingNoticeValue | null;
  setNotice: (notice: BillingNoticeValue | null) => void;
}>({ notice: null, setNotice: () => {} });

/**
 * Wraps the announcement bar and the screens below it: BillingNotice (inside the workspace's
 * routes) sets the notice, and the bar, which sits outside the router, shows it.
 */
export function BillingNoticeProvider({ children }: { children: ReactNode }) {
  const [notice, setNotice] = useState<BillingNoticeValue | null>(null);
  const value = useMemo(() => ({ notice, setNotice }), [notice]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export const useBillingNotice = () => useContext(Context).notice;

export const useSetBillingNotice = () => useContext(Context).setNotice;
