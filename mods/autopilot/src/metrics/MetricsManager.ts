/*
 * Copyright (C) 2024 by Fonoster Inc (https://fonoster.com)
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
import { ConversationMetrics, TurnMetrics, VendorInfo } from "./types";

class MetricsManager {
  private turns: TurnMetrics[] = [];
  private currentTurn: Partial<{
    sttRequestTimestamp: number;
    sttResponseTimestamp: number;
    llmRequestTimestamp: number;
    llmResponseTimestamp: number;
    ttsRequestTimestamp: number;
    ttsResponseTimestamp: number;
    userInput: string;
    llmResponse: string;
  }> = {};
  private vendorInfo: VendorInfo;

  constructor(vendorInfo: VendorInfo) {
    this.vendorInfo = vendorInfo;
  }

  startNewTurn(): void {
    this.currentTurn = {};
  }

  sttRequestSent(): void {
    this.currentTurn.sttRequestTimestamp = performance.now();
  }

  sttResponseReceived(userInput: string): void {
    this.currentTurn.sttResponseTimestamp = performance.now();
    this.currentTurn.userInput = userInput;
  }

  llmRequestSent(): void {
    this.currentTurn.llmRequestTimestamp = performance.now();
  }

  llmResponseReceived(llmResponse: string): void {
    this.currentTurn.llmResponseTimestamp = performance.now();
    this.currentTurn.llmResponse = llmResponse;
  }

  ttsRequestSent(): void {
    this.currentTurn.ttsRequestTimestamp = performance.now();
  }

  ttsResponseReceived(): void {
    this.currentTurn.ttsResponseTimestamp = performance.now();
  }

  finalizeCurrentTurn(): void {
    if (
      !(
        "sttRequestTimestamp" in this.currentTurn &&
        "sttResponseTimestamp" in this.currentTurn &&
        "llmRequestTimestamp" in this.currentTurn &&
        "llmResponseTimestamp" in this.currentTurn &&
        // "ttsRequestTimestamp" in this.currentTurn &&
        // "ttsResponseTimestamp" in this.currentTurn &&
        "userInput" in this.currentTurn &&
        "llmResponse" in this.currentTurn
      )
    ) {
      // throw new Error("Incomplete turn data; cannot finalize.");
      console.warn("incomplete turn data; cannot finalize.");
    }

    const turnMetrics: TurnMetrics = {
      sttLatencyMs:
        this.currentTurn.sttResponseTimestamp! -
        this.currentTurn.sttRequestTimestamp!,
      inferenceLatencyMs:
        this.currentTurn.llmResponseTimestamp! -
        this.currentTurn.llmRequestTimestamp!,
      ttsLatencyMs:
        this.currentTurn.ttsResponseTimestamp! -
        this.currentTurn.ttsRequestTimestamp!,
      userInput: this.currentTurn.userInput!,
      llmResponse: this.currentTurn.llmResponse!
    };

    this.turns.push(turnMetrics);
  }

  private calculateAverageLatencies(): {
    sttLatencyMs: number;
    inferenceLatencyMs: number;
    ttsLatencyMs: number;
  } {
    const totalTurns = this.turns.length;

    const sums = this.turns.reduce(
      (acc, turn) => {
        acc.sttLatencyMs += turn.sttLatencyMs;
        acc.inferenceLatencyMs += turn.inferenceLatencyMs;
        acc.ttsLatencyMs += turn.ttsLatencyMs;
        return acc;
      },
      { sttLatencyMs: 0, inferenceLatencyMs: 0, ttsLatencyMs: 0 }
    );

    return {
      sttLatencyMs: sums.sttLatencyMs / totalTurns,
      inferenceLatencyMs: sums.inferenceLatencyMs / totalTurns,
      ttsLatencyMs: sums.ttsLatencyMs / totalTurns
    };
  }

  getLastTurnMetrics(): TurnMetrics | null {
    if (this.turns.length === 0) {
      return null;
    }
    return this.turns[this.turns.length - 1];
  }

  getConversationMetrics(): ConversationMetrics {
    return {
      turns: this.turns,
      averageLatencies: this.calculateAverageLatencies(),
      vendorInfo: this.vendorInfo
    };
  }
}

export { MetricsManager };
