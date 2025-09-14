/**
 * Token returned from authenticating with an external service.
 */
export interface ConnectorToken {
  /** Access token used for API requests. */
  accessToken: string;
  /** Optional refresh token for renewing access. */
  refreshToken?: string;
  /** Epoch timestamp when the access token expires. */
  expiresAt?: number;
}

/**
 * Generic connector interface for integrating external services.
 */
export interface Connector<T = unknown> {
  /** Authenticate with the external service and return credentials. */
  authenticate(): Promise<ConnectorToken>;

  /** Fetch data from the service using the provided token. */
  fetchData(token: ConnectorToken): Promise<T>;

  /** Send a message through the service using the provided token. */
  sendMessage(token: ConnectorToken, message: string): Promise<void>;
}
