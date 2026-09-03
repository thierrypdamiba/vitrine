import type { VaultState } from './arcade-types.ts';
import { withheldFacts, type PublicBrief } from './vitrine.ts';

export type LeakRow = { key: string; value: string };

export type SeamCounts = {
  agentKnows: number;
  shopReceived: number;
  leaked: number;
};

/**
 * The three numbers at the top of the sidebar. Each is counted from state the
 * server produced or echoed, never from what the agent says it sent.
 */
export function seamCounts(
  vault: VaultState,
  receipt: PublicBrief | null,
  leakLedger: LeakRow[],
): SeamCounts {
  const agentKnows = vault.context ? withheldFacts(vault.context).length - 1 : 0;
  const shopReceived = receipt ? Object.keys(receipt).length : 0;
  return { agentKnows, shopReceived, leaked: leakLedger.length };
}
