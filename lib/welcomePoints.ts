export const WELCOME_POINT_SIGNUP_SETTING_KEY = "WELCOME_POINT_SIGNUP";
export const WELCOME_POINT_SIGNUP_REF_TYPE = "signup_welcome";

export type WelcomePointSignupConfig = {
  enabled: boolean;
  points: number;
  startAt: Date | null;
  endAt: Date | null;
  expiresInDays: number;
};

type RawSettingValue = unknown;
type WelcomePointSettingShape = {
  enabled?: unknown;
  points?: unknown;
  startAt?: unknown;
  endAt?: unknown;
  expiresInDays?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function hasTimezoneSuffix(value: string) {
  // Matches 'Z' or '+07:00'/'-05:30' at the end.
  return /([zZ]|[+-]\d{2}:\d{2})$/.test(value);
}

function parseBangkokDate(input: unknown): Date | null {
  if (typeof input !== "string") return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  const iso = hasTimezoneSuffix(trimmed) ? trimmed : `${trimmed}+07:00`;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function safeJsonParse(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function normalizeSettingValue(raw: RawSettingValue): unknown {
  if (typeof raw === "string") {
    return safeJsonParse(raw);
  }

  if (!isRecord(raw)) return raw;

  // CMS Web Settings UI stores JSON string under { json: "<string>" }.
  if ("json" in raw) {
    if (typeof raw.json === "string") return safeJsonParse(raw.json);
    if (isRecord(raw.json)) return raw.json;
  }

  // Be tolerant of manual settings created as Text or wrapped payloads.
  if (typeof raw.text === "string") {
    return safeJsonParse(raw.text);
  }
  if (isRecord(raw.value)) {
    return normalizeSettingValue(raw.value);
  }

  return raw;
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function asBoolean(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const v = value.trim().toLowerCase();
    if (v === "true") return true;
    if (v === "false") return false;
  }
  return null;
}

export function parseWelcomePointSignupConfig(rawSettingValue: RawSettingValue): WelcomePointSignupConfig | null {
  const normalized = normalizeSettingValue(rawSettingValue);
  if (!isRecord(normalized)) return null;
  const value = normalized as WelcomePointSettingShape;

  const enabled = asBoolean(value.enabled) ?? false;
  const points = asNumber(value.points) ?? 0;
  const expiresInDays = asNumber(value.expiresInDays) ?? 365;

  const startAt = parseBangkokDate(value.startAt);
  const endAt = parseBangkokDate(value.endAt);

  return {
    enabled,
    points: Math.trunc(points),
    startAt,
    endAt,
    expiresInDays: Math.max(1, Math.trunc(expiresInDays)),
  };
}

export function isDateWithinWindow(date: Date, startAt: Date | null, endAt: Date | null) {
  if (startAt && date < startAt) return false;
  if (endAt && date > endAt) return false;
  return true;
}

export function isNowWithinWindow(now: Date, startAt: Date | null, endAt: Date | null) {
  return isDateWithinWindow(now, startAt, endAt);
}

export function welcomeSignupTxId(memberCode: string) {
  return `${WELCOME_POINT_SIGNUP_REF_TYPE}:${memberCode}`;
}
