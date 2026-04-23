export interface Versioned<T> {
  version: number;
  data: T;
}
