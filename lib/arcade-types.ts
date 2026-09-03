import type { PrivateContext } from './vitrine.ts';

/**
 * Booleans only. The status route never returns token status text or URLs.
 * `shopping` means Walmart.SearchProducts requirements.met, i.e. SERP_API_KEY is present.
 */
export type ArcadeStatus = {
  configured: boolean;
  gmailRead: boolean;
  calendar: boolean;
  shopping: boolean;
};

export type VaultState = {
  status: 'sealed' | 'loading' | 'loaded' | 'failed';
  context: PrivateContext | null;
  via: 'arcade' | 'fixture' | null;
  reason?: string;
};
