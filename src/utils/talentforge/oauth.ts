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

interface OAuthProviderConfig {
  authUrl: string;
  clientId: string;
  scope: string;
  extraParams?: Record<string, string>;
}

export const OAUTH_PROVIDERS: Record<string, OAuthProviderConfig> = {
  gmail: {
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    clientId: process.env.NEXT_PUBLIC_GMAIL_CLIENT_ID || "",
    scope: "https://www.googleapis.com/auth/gmail.readonly",
    extraParams: { access_type: "offline", prompt: "consent" },
  },
  linkedin: {
    authUrl: "https://www.linkedin.com/oauth/v2/authorization",
    clientId: process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID || "",
    scope: "r_liteprofile r_emailaddress w_member_social",
  },
};

export function getAuthUrl(
  provider: keyof typeof OAUTH_PROVIDERS,
  redirectUri: string,
  state = ""
): string {
  const config = OAUTH_PROVIDERS[provider];
  const params = new URLSearchParams({
    response_type: "code",
    client_id: config.clientId,
    redirect_uri: redirectUri,
    scope: config.scope,
    ...(state ? { state } : {}),
    ...config.extraParams,
  });
  return `${config.authUrl}?${params.toString()}`;
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
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error exchanging code", err);
    }
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
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error refreshing access token", err);
    }
    return null;
  }
}
