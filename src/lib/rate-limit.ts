import { env } from "@/lib/env";

type RateLimitOptions = {
  key: string;
  prefix: string;
  limit: number;
  windowMs: number;
};

type RateLimitResult = {
  limited: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
};

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

type RateLimitGlobalState = typeof globalThis & {
  __gorilaRateLimitStore?: Map<string, RateLimitEntry>;
  __gorilaRateLimitWarnings?: Set<string>;
};

type UpstashExecResponse = Array<{
  result?: unknown;
  error?: string;
}>;

const globalRateLimitState = globalThis as RateLimitGlobalState;
const rateLimitStore =
  globalRateLimitState.__gorilaRateLimitStore ??
  (globalRateLimitState.__gorilaRateLimitStore = new Map<string, RateLimitEntry>());
const rateLimitWarnings =
  globalRateLimitState.__gorilaRateLimitWarnings ??
  (globalRateLimitState.__gorilaRateLimitWarnings = new Set<string>());

function warnRateLimit(message: string) {
  if (rateLimitWarnings.has(message)) {
    return;
  }

  rateLimitWarnings.add(message);
  console.warn("[rate_limit]", { message });
}

function isUpstashConfigured() {
  return Boolean(env.upstashRedisRestUrl && env.upstashRedisRestToken);
}

function buildRateLimitKey(prefix: string, key: string) {
  return `gorila:rate-limit:${prefix}:${key}`;
}

function consumeMemoryRateLimit(options: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const rateLimitKey = buildRateLimitKey(options.prefix, options.key);
  const current = rateLimitStore.get(rateLimitKey);

  if (!current || current.resetAt <= now) {
    const resetAt = now + options.windowMs;

    rateLimitStore.set(rateLimitKey, {
      count: 1,
      resetAt
    });

    return {
      limited: false,
      limit: options.limit,
      remaining: Math.max(options.limit - 1, 0),
      resetAt,
      retryAfterSeconds: Math.max(Math.ceil(options.windowMs / 1000), 1)
    };
  }

  current.count += 1;
  rateLimitStore.set(rateLimitKey, current);

  return {
    limited: current.count > options.limit,
    limit: options.limit,
    remaining: Math.max(options.limit - current.count, 0),
    resetAt: current.resetAt,
    retryAfterSeconds: Math.max(
      Math.ceil((current.resetAt - now) / 1000),
      1
    )
  };
}

async function executeUpstash(commands: Array<Array<string>>) {
  const response = await fetch(`${env.upstashRedisRestUrl}/multi-exec`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.upstashRedisRestToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(commands),
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("upstash_request_failed");
  }

  const payload = (await response.json().catch(() => null)) as
    | UpstashExecResponse
    | null;

  if (!Array.isArray(payload)) {
    throw new Error("upstash_invalid_payload");
  }

  for (const command of payload) {
    if (typeof command?.error === "string" && command.error.length > 0) {
      throw new Error("upstash_command_failed");
    }
  }

  return payload;
}

function toFiniteNumber(value: unknown, fallback: number) {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : NaN;

  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function consumeRateLimit(
  options: RateLimitOptions
): Promise<RateLimitResult> {
  if (!isUpstashConfigured()) {
    warnRateLimit("Upstash no configurado. Se usa rate limit local no persistente.");
    return consumeMemoryRateLimit(options);
  }

  try {
    const rateLimitKey = buildRateLimitKey(options.prefix, options.key);
    const results = await executeUpstash([
      ["INCR", rateLimitKey],
      ["PEXPIRE", rateLimitKey, `${options.windowMs}`, "NX"],
      ["PTTL", rateLimitKey]
    ]);
    const count = toFiniteNumber(results[0]?.result, 0);
    const ttlMs = Math.max(toFiniteNumber(results[2]?.result, options.windowMs), 0);
    const resetAt = Date.now() + ttlMs;

    return {
      limited: count > options.limit,
      limit: options.limit,
      remaining: Math.max(options.limit - count, 0),
      resetAt,
      retryAfterSeconds: Math.max(Math.ceil(ttlMs / 1000), 1)
    };
  } catch {
    warnRateLimit("Upstash no respondió. Se usa rate limit local no persistente.");
    return consumeMemoryRateLimit(options);
  }
}

export function getRequestIp(headers: Headers) {
  const forwardedFor = headers.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  return headers.get("x-real-ip")?.trim() || "unknown";
}
