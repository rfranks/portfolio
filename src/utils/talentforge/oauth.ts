// Utility helpers for managing OAuth token exchange and refresh

const TOKEN_ENDPOINT =
  process.env.NEXT_PUBLIC_OAUTH_TOKEN_ENDPOINT || "/api/oauth/token";
const REFRESH_ENDPOINT =
  process.env.NEXT_PUBLIC_OAUTH_REFRESH_ENDPOINT || "/api/oauth/refresh";

export interface OAuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

const STORAGE_KEY_PREFIX = "talentforge_oauth_";

export function saveTokens(provider: string, tokens: OAuthTokens): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    `${STORAGE_KEY_PREFIX}${provider}`,
    JSON.stringify(tokens)
  );
}

export function getStoredTokens(provider: string): OAuthTokens | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${provider}`);
  return raw ? (JSON.parse(raw) as OAuthTokens) : null;
}

export function clearTokens(provider: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(`${STORAGE_KEY_PREFIX}${provider}`);
}

export async function exchangeCode(
  provider: string,
  code: string
): Promise<OAuthTokens | null> {
  try {
    const response = await fetch(
      `${TOKEN_ENDPOINT}?provider=${encodeURIComponent(provider)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      }
    );
    if (!response.ok) return null;
    const data = (await response.json()) as OAuthTokens;
    saveTokens(provider, data);
    return data;
  } catch {
    return null;
  }
}

export async function refreshAccessToken(
  provider: string,
  refreshToken: string
): Promise<OAuthTokens | null> {
  try {
    const response = await fetch(
      `${REFRESH_ENDPOINT}?provider=${encodeURIComponent(provider)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      }
    );
    if (!response.ok) return null;
    const data = (await response.json()) as OAuthTokens;
    saveTokens(provider, data);
    return data;
  } catch {
    return null;
  }
}
