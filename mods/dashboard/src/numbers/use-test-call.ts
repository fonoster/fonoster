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
import type { CreateCallRequest } from "@fonoster/types";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useSdk } from "~/lib/auth";
import { fromStreamStatus, LIVE, type TestCallStatus } from "./test-call";

type State = {
  status: TestCallStatus;
  /** When ANSWER came; the timer counts from here. */
  answeredAt?: number;
  /** When the answered call's stream ended. */
  endedAt?: number;
};

/**
 * Places a test call and follows its TrackCall stream. stop() (or unmounting) only stops reading
 * the stream: there is no hang-up, and nothing more is sent.
 */
export function useTestCall() {
  const sdk = useSdk();
  const create = useMutation({
    mutationFn: (request: CreateCallRequest) => sdk.calls.createCall(request)
  });
  const [state, setState] = useState<State>({ status: "idle" });
  // Each start() is a run; a later run or stop() makes the earlier one stop updating state.
  const run = useRef(0);
  const stream = useRef<AsyncGenerator<unknown> | undefined>(undefined);

  const stop = () => {
    run.current += 1;
    void stream.current?.return(undefined);
    stream.current = undefined;
  };

  useEffect(() => stop, []);

  const start = async (request: CreateCallRequest) => {
    stop();
    const mine = run.current;
    const current = () => run.current === mine;
    setState({ status: "calling" });

    let call;
    try {
      call = await create.mutateAsync(request);
    } catch {
      if (current()) setState({ status: "idle" });
      return;
    }
    if (!current()) {
      void call.statusStream.return(undefined);
      return;
    }
    stream.current = call.statusStream;

    let answeredAt: number | undefined;
    try {
      for await (const update of call.statusStream) {
        if (!current()) return;
        const status = fromStreamStatus(update.status);
        if (!status) continue;
        if (status === "answered") answeredAt = Date.now();
        setState({ status, answeredAt });
      }
      if (!current()) return;
      // An answered call ends by closing the stream, with no final status.
      setState((s) =>
        s.status === "answered"
          ? { status: "ended", answeredAt, endedAt: Date.now() }
          : s
      );
    } catch {
      if (current())
        setState((s) => (LIVE.includes(s.status) ? { status: "lost" } : s));
    }
  };

  return {
    ...state,
    live: LIVE.includes(state.status),
    error: create.error,
    start
  };
}
