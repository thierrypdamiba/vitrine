import type { ArcadeStatus } from './arcade-types.ts';
import {
  DAD_SCOTLAND_FIXTURE,
  parsePublicBrief,
  type PrivateContext,
  type PublicBrief,
} from './vitrine.ts';

/**
 * The page's side of the vault. The browser only ever talks to this server's own
 * routes; the Arcade key stays on the server and no route returns a URL.
 */

const MAX_TEXT = 80;
const MAX_BUDGET = 10_000;
const MAX_PROBE_BODY = 300;

export type VaultLoad = {
  context: PrivateContext;
  via: 'arcade' | 'fixture';
  reason?: string;
};

export type MerchantProbe = {
  sent: string;
  status: number;
  body: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function boundedText(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const text = value.trim();
  return text.length > 0 && text.length <= MAX_TEXT ? text : undefined;
}

/** Validate a server-supplied context before it enters page state. */
export function parsePrivateContext(value: unknown): PrivateContext | null {
  if (!isRecord(value)) return null;
  const recipient = boundedText(value.recipient);
  const relationship = boundedText(value.relationship);
  const destination = boundedText(value.destination);
  const dates = boundedText(value.dates);
  const weather = boundedText(value.weather);
  if (!recipient || !relationship || !destination || !dates || !weather) return null;

  const brief = parsePublicBrief({
    category: 'jacket',
    size: value.size,
    features: value.features,
    colors: value.colors,
  });
  if (!brief.ok) return null;

  const budgetUsd = value.budgetUsd;
  if (
    typeof budgetUsd !== 'number' ||
    !Number.isInteger(budgetUsd) ||
    budgetUsd < 1 ||
    budgetUsd > MAX_BUDGET
  ) {
    return null;
  }

  const context: PrivateContext = {
    recipient,
    relationship,
    destination,
    dates,
    weather,
    size: brief.brief.size,
    features: brief.brief.features,
    colors: brief.brief.colors,
    budgetUsd,
    source: 'arcade',
  };
  if (value.calendarSummary !== undefined) {
    const calendarSummary = boundedText(value.calendarSummary);
    if (!calendarSummary) return null;
    context.calendarSummary = calendarSummary;
  }
  return context;
}

function fixture(reason: string): VaultLoad {
  return { context: DAD_SCOTLAND_FIXTURE, via: 'fixture', reason };
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

/**
 * Read the shopper's gift notes through the server. Any failure falls back to the
 * labeled demo fixture so the judging path never needs credentials.
 */
export async function loadVault(fetchImpl: typeof fetch = fetch): Promise<VaultLoad> {
  let response: Response;
  try {
    response = await fetchImpl('/api/arcade/context', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });
  } catch {
    return fixture('Arcade not configured');
  }

  const payload = await readJson(response);
  if (response.status !== 200) {
    const error = isRecord(payload) && typeof payload.error === 'string' ? payload.error : null;
    return fixture(error ?? 'Arcade not configured');
  }

  const context = parsePrivateContext(isRecord(payload) ? payload.context : null);
  if (!context) return fixture('Arcade returned an unreadable context');
  return { context, via: 'arcade' };
}

/**
 * Booleans only. Returns the route's answer on 200, including `configured: false`
 * when the server has no Arcade key. Returns null when the route did not answer
 * (network error, 403/429 from the guard, 5xx, non-JSON body) so the page keeps
 * the status it already had instead of reporting "not configured" because of a
 * throttle.
 */
export async function fetchArcadeStatus(
  fetchImpl: typeof fetch = fetch,
): Promise<ArcadeStatus | null> {
  try {
    const response = await fetchImpl('/api/arcade/status');
    if (response.status !== 200) return null;
    const payload = await readJson(response);
    if (!isRecord(payload) || typeof payload.configured !== 'boolean') return null;
    return {
      configured: payload.configured,
      gmailRead: payload.gmailRead === true,
      calendar: payload.calendar === true,
      shopping: payload.shopping === true,
    };
  } catch {
    return null;
  }
}

/**
 * Send the private fields on purpose and report what the adapter answered.
 * Touches no page state; the caller renders the sent body and the status line.
 */
export async function probeMerchantRejection(
  brief: PublicBrief,
  context: PrivateContext | null,
  fetchImpl: typeof fetch = fetch,
): Promise<MerchantProbe> {
  const sent = JSON.stringify({
    ...brief,
    destination: context?.destination ?? 'Scotland',
    budgetUsd: context?.budgetUsd ?? 250,
  });
  try {
    const response = await fetchImpl('/api/catalog/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: sent,
    });
    const body = (await response.text()).slice(0, MAX_PROBE_BODY);
    return { sent, status: response.status, body };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'request failed';
    return { sent, status: 0, body: message.slice(0, MAX_PROBE_BODY) };
  }
}

/** One line for the activity log: the status and the adapter's error string. */
export function probeSummary(probe: MerchantProbe): string {
  let message = probe.body;
  try {
    const parsed = JSON.parse(probe.body) as { error?: unknown };
    if (typeof parsed.error === 'string') message = parsed.error;
  } catch {
    // The body was not JSON; show it as is.
  }
  return `${probe.status} ${message}`;
}
