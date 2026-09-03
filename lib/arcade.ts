import {
  ArcadeAuthorizationRequired,
  ArcadeContextError,
  isRecord,
  type ArcadeTools,
} from './arcade-client.ts';
import type { CatalogColor, CatalogFeature, CatalogSize, PrivateContext } from './vitrine.ts';

export {
  ArcadeAuthorizationRequired,
  ArcadeContextError,
  createArcadeTools,
  readArcadeConfig,
  DEFAULT_ARCADE_CONTEXT_QUERY,
  type ArcadeConfig,
  type ArcadeTools,
} from './arcade-client.ts';

export const ARCADE_CONTEXT_TOOL = 'Gmail.SearchEmailsByQuery';
export const ARCADE_CALENDAR_TOOL = 'GoogleCalendar.ListEvents';

export type ArcadeConnection = {
  connected: boolean;
  tokenStatus: 'not_started' | 'pending' | 'completed' | 'failed' | 'unknown';
};

const ALLOWED_SIZES: readonly CatalogSize[] = ['XS', 'S', 'M', 'L', 'XL'];
const ALLOWED_FEATURES: readonly CatalogFeature[] = ['waterproof', 'packable'];
const ALLOWED_COLORS: readonly CatalogColor[] = ['navy', 'olive'];
const MONTHS = [
  'january',
  'february',
  'march',
  'april',
  'may',
  'june',
  'july',
  'august',
  'september',
  'october',
  'november',
  'december',
] as const;

function boundedText(value: string | undefined, field: string): string {
  const text = value?.trim();
  if (!text || text.length > 80) {
    throw new ArcadeContextError(`${field} must be between 1 and 80 characters`);
  }
  return text;
}

function parseList<T extends string>(
  value: string | undefined,
  field: string,
  allowed: readonly T[],
): T[] {
  const entries = value
    ?.split(',')
    .map(entry => entry.trim().toLowerCase())
    .filter(Boolean);
  if (!entries?.length || entries.some(entry => !allowed.includes(entry as T))) {
    throw new ArcadeContextError(`${field} contains an unsupported value`);
  }
  return [...new Set(entries as T[])];
}

function extractLabeledFields(input: string): Map<string, string> {
  const fields = new Map<string, string>();
  for (const line of input.split(/\r?\n/)) {
    const match = /^([a-zA-Z]+)\s*:\s*(.+)$/.exec(line.trim());
    if (!match) continue;
    const key = match[1].toLowerCase();
    if (!fields.has(key)) fields.set(key, match[2].trim());
  }
  return fields;
}

function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

function extractNaturalFields(input: string): Partial<PrivateContext> {
  const text = input.replace(/\s+/g, ' ').trim();
  const lower = text.toLowerCase();
  const extracted: Partial<PrivateContext> = {};

  if (/\b(dad|father)\b/i.test(text)) {
    extracted.recipient = 'Dad';
    extracted.relationship = 'father';
  } else if (/\b(mom|mum|mother)\b/i.test(text)) {
    extracted.recipient = 'Mom';
    extracted.relationship = 'mother';
  }

  const tripMatch = /(?:trip to|going to|visit(?:ing)?)\s+([A-Z][A-Za-z]+)/.exec(text);
  if (tripMatch) {
    extracted.destination = tripMatch[1];
  } else if (/\bscotland\b/i.test(text)) {
    extracted.destination = 'Scotland';
  }

  for (const month of MONTHS) {
    if (lower.includes(month)) {
      extracted.dates = titleCase(month);
      break;
    }
  }

  if (/\b(rainy|raining|rain|wet)\b/i.test(text)) {
    extracted.weather = 'rainy';
  }

  const sizeMatch = /\b(XS|S|M|L|XL)\b/.exec(text);
  if (sizeMatch && ALLOWED_SIZES.includes(sizeMatch[1] as CatalogSize)) {
    extracted.size = sizeMatch[1] as CatalogSize;
  }

  const features: CatalogFeature[] = [];
  if (/\bwaterproof\b/i.test(text)) features.push('waterproof');
  if (/\bpackable\b/i.test(text)) features.push('packable');
  if (features.length) extracted.features = features;

  const colors: CatalogColor[] = [];
  if (/\bnavy\b/i.test(text)) colors.push('navy');
  if (/\bolive\b/i.test(text)) colors.push('olive');
  if (colors.length) extracted.colors = colors;

  const budgetMatch = /(?:under|below|budget(?:\s+of)?)\s+\$?(\d{2,5})|\$(\d{2,5})/.exec(lower);
  if (budgetMatch) {
    const amount = Number(budgetMatch[1] ?? budgetMatch[2]);
    if (Number.isInteger(amount) && amount >= 1 && amount <= 10_000) {
      extracted.budgetUsd = amount;
    }
  }

  return extracted;
}

function labeledSize(fields: Map<string, string>): CatalogSize | undefined {
  const size = fields.get('size')?.toUpperCase();
  return size && ALLOWED_SIZES.includes(size as CatalogSize) ? (size as CatalogSize) : undefined;
}

export function parseArcadeContextRecord(input: string): PrivateContext {
  if (!input.trim() || input.length > 8_000) {
    throw new ArcadeContextError('Arcade context record is empty or too large');
  }

  const labeled = extractLabeledFields(input);
  const natural = extractNaturalFields(input);

  const size = labeledSize(labeled) ?? natural.size;
  if (!size) {
    throw new ArcadeContextError('size must be a listed catalog size');
  }

  const labeledBudget = labeled.get('budgetusd') ?? labeled.get('budget');
  const budgetUsd = labeledBudget ? Number(labeledBudget) : natural.budgetUsd;
  if (!Number.isInteger(budgetUsd) || (budgetUsd ?? 0) < 1 || (budgetUsd ?? 0) > 10_000) {
    throw new ArcadeContextError('budgetUsd must be an integer between 1 and 10000');
  }

  const features = labeled.has('features')
    ? parseList<CatalogFeature>(labeled.get('features'), 'features', ALLOWED_FEATURES)
    : natural.features;
  const colors = labeled.has('colors')
    ? parseList<CatalogColor>(labeled.get('colors'), 'colors', ALLOWED_COLORS)
    : natural.colors;
  if (!features?.length) {
    throw new ArcadeContextError('features contains an unsupported value');
  }
  if (!colors?.length) {
    throw new ArcadeContextError('colors contains an unsupported value');
  }

  return {
    recipient: boundedText(labeled.get('recipient') ?? natural.recipient, 'recipient'),
    relationship: boundedText(labeled.get('relationship') ?? natural.relationship, 'relationship'),
    destination: boundedText(labeled.get('destination') ?? natural.destination, 'destination'),
    dates: boundedText(labeled.get('dates') ?? natural.dates, 'dates'),
    weather: boundedText(labeled.get('weather') ?? natural.weather, 'weather'),
    size,
    features,
    colors,
    budgetUsd: budgetUsd as number,
    source: 'arcade',
  };
}

export async function getArcadeConnection(
  tools: ArcadeTools,
  userId: string,
): Promise<ArcadeConnection> {
  const tool = await tools.get(ARCADE_CONTEXT_TOOL, { user_id: userId });
  const tokenStatus = tool.requirements?.authorization?.token_status ?? 'unknown';
  return {
    connected: tool.requirements?.met === true && tokenStatus === 'completed',
    tokenStatus,
  };
}

export async function beginArcadeAuthorization(
  tools: ArcadeTools,
  userId: string,
): Promise<{ status: string; url?: string }> {
  const authorization = await tools.authorize({
    tool_name: ARCADE_CONTEXT_TOOL,
    user_id: userId,
  });
  return {
    status: authorization.status ?? 'pending',
    url: authorization.url,
  };
}

function textFromEmail(email: Record<string, unknown>): string | null {
  const parts = [
    email.subject,
    email.snippet,
    email.body,
    email.plain_text,
    email.text,
    email.html_body,
  ];
  const chunks = parts.filter(
    (part): part is string => typeof part === 'string' && part.trim().length > 0,
  );
  return chunks.length > 0 ? chunks.join('\n') : null;
}

function contextRecordFromToolValue(value: unknown, contextQuery: string): string {
  if (typeof value === 'string' && value.trim()) return value;
  if (!isRecord(value)) {
    throw new ArcadeContextError(`No Gmail message matched ${contextQuery}`);
  }

  const collections = [value.emails, value.messages, value.threads, value.items];
  for (const collection of collections) {
    if (!Array.isArray(collection) || collection.length === 0) continue;
    const texts: string[] = [];
    for (const entry of collection) {
      if (!isRecord(entry)) continue;
      const text = textFromEmail(entry);
      if (text) texts.push(text);
      if (Array.isArray(entry.messages)) {
        for (const message of entry.messages) {
          if (isRecord(message)) {
            const nested = textFromEmail(message);
            if (nested) texts.push(nested);
          }
        }
      }
    }
    if (texts.length > 0) return texts.join('\n');
  }

  throw new ArcadeContextError(`No Gmail message matched ${contextQuery}`);
}

function calendarSummaryFromValue(value: unknown): string | undefined {
  if (!isRecord(value)) return undefined;
  const events = Array.isArray(value.events)
    ? value.events
    : Array.isArray(value.items)
      ? value.items
      : [];
  for (const event of events) {
    if (!isRecord(event)) continue;
    const summary = typeof event.summary === 'string' ? event.summary.trim() : '';
    const location = typeof event.location === 'string' ? event.location.trim() : '';
    const start =
      firstEventStart(event.start) ??
      (typeof event.start_datetime === 'string' ? event.start_datetime : '');
    const bits = [summary, location, start].filter(Boolean);
    if (bits.length > 0) return bits.join(' · ').slice(0, 80);
  }
  return undefined;
}

function firstEventStart(value: unknown): string | undefined {
  if (typeof value === 'string') return value;
  if (isRecord(value) && typeof value.dateTime === 'string') return value.dateTime;
  if (isRecord(value) && typeof value.date === 'string') return value.date;
  return undefined;
}

async function loadCalendarSummary(
  tools: ArcadeTools,
  userId: string,
): Promise<string | undefined> {
  const now = new Date();
  const later = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 180);
  const minEnd = now.toISOString().slice(0, 19);
  const maxStart = later.toISOString().slice(0, 19);

  try {
    const response = await tools.execute({
      tool_name: ARCADE_CALENDAR_TOOL,
      user_id: userId,
      input: {
        calendar_id: 'primary',
        min_end_datetime: minEnd,
        max_start_datetime: maxStart,
      },
    });
    const authorization = response.output?.authorization;
    if (authorization && authorization.status !== 'completed') return undefined;
    if (response.success !== true) return undefined;
    return calendarSummaryFromValue(response.output?.value);
  } catch {
    return undefined;
  }
}

export async function loadPrivateContextFromArcade(
  tools: ArcadeTools,
  config: { contextQuery: string; userId: string },
): Promise<PrivateContext> {
  const response = await tools.execute({
    tool_name: ARCADE_CONTEXT_TOOL,
    user_id: config.userId,
    input: {
      query: config.contextQuery,
      result_detail: 'full',
      max_results: 5,
    },
  });

  const authorization = response.output?.authorization;
  if (authorization && authorization.status !== 'completed') {
    throw new ArcadeAuthorizationRequired(authorization.url);
  }
  if (response.success !== true) {
    throw new ArcadeContextError('Arcade could not read the shopping context');
  }

  const context = parseArcadeContextRecord(
    contextRecordFromToolValue(response.output?.value, config.contextQuery),
  );
  const calendarSummary = await loadCalendarSummary(tools, config.userId);
  return calendarSummary ? { ...context, calendarSummary } : context;
}
