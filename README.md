This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Résumé-Driven Home Page

The landing page presents a résumé-focused portfolio with sections for summary,
competencies, projects, experience, education, recognition, and contact. A
drawer menu links to several demos and games:

- [GeneBoard](http://localhost:3000/dna)
- [Bookworm](http://localhost:3000/bookworm)
- [TalentForge](http://localhost:3000/talentforge)
- [Blackjack](http://localhost:3000/blackjack)
- [Warbirds](http://localhost:3000/warbirds)
- [ZombieFish](http://localhost:3000/zombiefish)

### Build Instructions

```bash
npm install
npm run build
npm start
```

During development, run `npm run dev` to start the local server.

## TalentForge Setup

TalentForge integrates with several external services. Copy `.env.local.example` to `.env.local` and provide the following values:

- `NEXT_PUBLIC_OPENAI_API_KEY` – OpenAI API key.
- `NEXT_PUBLIC_INDEED_API_KEY` – Indeed API key.
- `NEXT_PUBLIC_INDEED_API_URL` – Indeed API base URL.
- `NEXT_PUBLIC_LINKEDIN_API_KEY` – LinkedIn API key.
- `NEXT_PUBLIC_LINKEDIN_CLIENT_ID` – LinkedIn OAuth client ID.
- `NEXT_PUBLIC_LINKEDIN_API_URL` – LinkedIn API base URL.
- `NEXT_PUBLIC_GMAIL_CLIENT_ID` – Gmail OAuth client ID.
- `NEXT_PUBLIC_TALENTFORGE_STORAGE_API_URL` – TalentForge storage service endpoint.
- `NEXT_PUBLIC_OAUTH_TOKEN_ENDPOINT` – OAuth token endpoint.
- `NEXT_PUBLIC_OAUTH_REFRESH_ENDPOINT` – OAuth refresh endpoint.
- `NEXT_PUBLIC_BASE_PATH` – optional base path for deployment.

Launch the TalentForge page and follow the onboarding wizard for initial configuration steps.

For quick configuration, you can copy `talentforge.env.example` to `talentforge.env` and provide:

- `NEXT_PUBLIC_OPENAI_API_KEY` – OpenAI API key.
- `NEXT_PUBLIC_APP_NAME` – application name displayed in the UI.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `src/app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
