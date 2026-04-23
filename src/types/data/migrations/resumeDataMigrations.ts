export type ResumeDataMigrationPayload = Record<string, unknown>;

export type MigrationFn = (input: ResumeDataMigrationPayload) => ResumeDataMigrationPayload;

export type ResumeDataMigrationWarning = {
  code: string;
  message: string;
  path: string;
};
