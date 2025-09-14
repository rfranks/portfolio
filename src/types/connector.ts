export interface Connector {
  /** Authenticate with the external service. */
  authenticate(): Promise<void>;

  /** Fetch data from the service. */
  fetchData(): Promise<unknown>;

  /** Send a message through the service. */
  sendMessage(message: string): Promise<void>;
}
