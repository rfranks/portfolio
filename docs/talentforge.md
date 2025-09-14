# TalentForge

## Setup

1. Install dependencies and start the development server.
   ```bash
   npm install
   npm run dev
   ```
2. Copy `.env.local.example` to `.env.local` and provide the required API keys and endpoints for services such as OpenAI, Indeed, LinkedIn, Gmail, and the TalentForge storage API.
3. Visit `http://localhost:3000/talentforge` and follow the onboarding wizard.

## Data Model Overview

TalentForge uses TypeScript interfaces to describe core entities:

- **UserProfile** – user identifier, display name, email, and associated resumes.
- **Resume** – file metadata and optional tags for the uploaded resume.
- **JobListing** – title, company, location, URL, and source of a job post.
- **JobApplication** – extends `JobListing` with an `id` and an application status (`applied`, `interview`, `offer`, or `rejected`).
- **Message** – sender, recipient, timestamp, and message body.
- **Offer** – compensation details tied to a specific application.
- **ChatMessage** – conversational messages exchanged with the AI assistant.

## Connector Architecture

Connectors abstract external services behind a common interface defined in `src/types/connector.ts`. Each method accepts a `ConnectorToken` representing the authenticated account and implements:

- `authenticate(token)` – prepare access to the service.
- `fetchData(token)` – retrieve data such as profiles or job listings.
- `sendMessage(token, message)` – deliver outbound messages; the token identifies the connector account.

The repository includes mocked connectors for LinkedIn and Indeed in `src/utils/talentforge/connectors/` that return sample data so the application can run without live API access. Additional connectors can follow the same pattern.

## Mock Data Instructions

During development the connectors provide static responses. To adjust mock data:

1. Edit the connector files in `src/utils/talentforge/connectors/` (for example `connectors/linkedin.ts` or `connectors/indeed.ts`).
2. Update the returned objects or arrays to reflect the scenarios you want to test.
3. Restart the dev server to load the new mock data.

These mocks allow front‑end development and integration testing without relying on external APIs.
