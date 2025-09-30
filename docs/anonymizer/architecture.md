# Anonymizer Service Architecture

## Overview
The anonymizer service is a Python-based application exposed through a FastAPI
app served by Uvicorn. Its responsibility is to fetch records from production
systems, strip or synthesize protected health information (PHI) to satisfy
HIPAA Safe Harbor requirements, and load the sanitized results into an internal
PostgreSQL database for analytics and testing.

The service orchestrates three major subsystems:

1. **Ingestion** – Retrieves source documents from Firebase/Firestore and
   normalizes them into the internal patient domain model.
2. **De-identification** – Uses Microsoft Presidio augmented with OpenAI LLM
   powered synthesis to replace PHI while maintaining medical utility.
3. **Loading** – Applies DDL-driven mapping to insert transformed records into
   a target PostgreSQL instance.

Each subsystem is modular so that future collections (beyond `patients`) can be
added with minimal code duplication.

## Component Breakdown

### API Layer
- **FastAPI Application** (`app/main.py`): Provides REST endpoints to trigger
  anonymization jobs. Key route shape: `POST /anonymize/{collection}/{doc_id}`
  that accepts optional overrides such as target schema path or execution
  options.
- **Uvicorn Server**: Runs the FastAPI app. `.vscode/launch.json` and
  `.vscode/tasks.json` include configurations to start the service locally with
  live reload.
- **Job Controller**: Validates requests, resolves collection handlers, and
  delegates to the orchestration pipeline. Supports synchronous responses and
  optional asynchronous background execution (via `asyncio.create_task` or a
  task queue in later phases).

### Configuration & Secrets
- **Config Module**: Loads runtime settings (Firestore project ID, service
  account credentials, PostgreSQL DSN, OpenAI API key, Presidio model
  configuration). Supports environment variables and optional `.env` file.
- **Secret Management**: For local development, secrets can be supplied through
  `.env`; in production, leverage the hosting platform’s secret store (e.g.,
  Azure Key Vault, AWS Secrets Manager, or GCP Secret Manager).

### Ingestion Subsystem
- **Firestore Client Adapter**: Wraps the official Google Cloud Firestore
  client. Responsibilities:
  - Authenticate using service account credentials.
  - Fetch documents by collection name and document ID.
  - Deserialize Firestore types (timestamps, references) to Python-native
    structures.
  - Validate payloads against collection-specific schemas (Pydantic models).
- **Collection Registry**: Maps collection names (e.g., `patients`) to
  ingestion handlers. Facilitates adding new collections.
- **Source Snapshot Storage**: Optionally persists raw JSON snapshots for audit
  and troubleshooting (e.g., in cloud storage or local disk).

### De-identification Subsystem
- **PHI Detection Pipeline**:
  - Uses Presidio Analyzer with out-of-the-box recognizers (names, dates, IDs)
    plus custom recognizers for facility names, patient-specific identifiers,
    and organization-specific formats (member IDs, facility codes).
  - Supports contextual rules to avoid removing clinically relevant terms (for
    example, disease names that resemble person names).
- **Presidio Anonymizer**:
  - Applies transformation operators (`replace`, `mask`, `hash`, `redact`).
  - Uses consistent pseudonyms for the same entity category within a single
    record to maintain referential integrity.
- **LLM-assisted Synthesis**:
  - For complex fields (addresses, personal names) where simple masking reduces
    data utility, calls OpenAI GPT-3.5 Turbo Instruct through an adapter.
  - Prompts instruct the model to generate realistic but fictitious
    replacements matching required formats (e.g., US address, name with same
    gender).
  - Incorporates guardrails to prevent leaking source PHI (e.g., prompt
    templates that remind the model not to echo the original text).
- **De-identification Policy Engine**:
  - Encapsulates Safe Harbor rules plus project-specific requirements.
  - Maintains whitelist of medically relevant attributes that must stay (e.g.,
    gender, insurance type) but ensures identifiers are removed or generalized.
  - Handles age generalization for patients older than 89.
- **Audit Logging**:
  - Records which fields were transformed, transformation type, timestamp, and
    processor identity for compliance tracking.

### Mapping & Transformation
- **Domain Models**: Pydantic models capturing the normalized schema for each
  collection (e.g., `PatientRecord`). These models define which fields must be
  persisted and enforce data types after anonymization.
- **Field Mapper**: Converts domain model instances into key/value pairs that
  correspond to target database columns. Handles nested structures (addresses)
  and JSON columns (e.g., `legal_mailing_address`).
- **DDL Parser**:
  - Reads the collection-specific DDL file (e.g., `patients.ddl`).
  - Extracts table name, column names, data types, default values, constraints.
  - Produces a mapping contract used by the field mapper and loader to ensure
    only valid columns are targeted.

### Loading Subsystem
- **PostgreSQL Client Adapter**:
  - Uses `asyncpg` or SQLAlchemy to manage connections.
  - Applies migrations (e.g., `uuid-ossp` extension) if required by the DDL.
  - Executes parameterized `INSERT` or `UPSERT` statements. Optionally supports
    bulk operations for batching.
- **Transaction Manager**: Wraps insertions within transactions. On failure,
  logs the error, rolls back, and exposes failure metrics.
- **Idempotency Support**: Provides strategies to avoid duplicate rows (e.g.,
  using natural keys from Firestore or hashed identifiers) and to update
  existing rows when necessary.

### Orchestration Pipeline
- **Workflow Coordinator**: A service class that ties ingestion,
  de-identification, and loading together. Steps:
  1. Fetch document from Firestore.
  2. Normalize into a domain model.
  3. Run PHI detection/synthesis to produce sanitized record.
  4. Validate sanitized record against domain model.
  5. Read the relevant DDL to confirm target schema.
  6. Map sanitized record to SQL columns.
  7. Execute insert/update on PostgreSQL.
  8. Emit audit log and metrics.
- **Error Handling & Retries**: Categorizes failures (network, validation,
  PHI processing). Supports retry policies and dead-letter queues for manual
  review.
- **Metrics & Observability**: Integrates with logging/metrics stack (e.g.,
  OpenTelemetry, Prometheus) for tracing pipeline execution times and PHI
  removal counts.

### Storage & Artifacts
- **Repository Layer**: Abstracts Firestore, PostgreSQL, and file storage.
- **Artifact Store**: Optionally stores anonymized datasets (CSV/JSON exports)
  for downstream loading or QA.
- **Schema Repository**: Directory containing DDL files and mapping templates.

### Security & Compliance Considerations
- Enforce principle of least privilege for Firestore and PostgreSQL service
  accounts.
- Use TLS for all network connections.
- Store audit logs securely and ensure they do not contain raw PHI.
- Implement configuration flags to disable LLM usage in restricted
  environments.
- Include consent for OpenAI usage if required by organizational policy.

## Development Workflow
- **Local Development**: Run the FastAPI/Uvicorn service with hot reload via
  VS Code launch configuration. Use mock Firestore/PostgreSQL backends for
  integration testing.
- **Testing**: Unit tests for recognizers, mapping logic, and loaders. End-to-
  end tests using fixture Firestore documents and ephemeral PostgreSQL
  containers (e.g., Testcontainers).
- **CI/CD**: Pipeline runs linting, tests, and builds Docker image. Deployment
  target (e.g., Azure App Service, AWS ECS) provisions secrets and environment
  variables.

## Extensibility
- Adding new collections requires implementing:
  - Ingestion schema/model for the new collection.
  - De-identification policy configuration.
  - DDL mapping file and column mapping logic.
- The modular registry pattern allows plugging in these components without
  modifying core orchestration.

## Future Enhancements
- Introduce message queue ingestion for bulk anonymization jobs.
- Support differential privacy techniques for aggregate analytics.
- Add a UI dashboard to monitor job status and review anonymization diffs.
- Enable Expert Determination workflows for cases requiring more nuanced risk
  assessment.
