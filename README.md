# AI Job Application Assistant

A React application that compares a job description with a resume, produces an AI match analysis, and tracks saved applications.

## Features

- Candidate profile with reusable resume and optional phone/location details
- Job-to-resume match analysis
- Matching and missing skills
- Resume suggestions and cover-letter draft
- Editable tailored-resume drafts with copy, download, and print-ready PDF export
- Editable saved cover-letter drafts
- One-click copying for generated cover letters
- Plain-text downloads for generated cover letters
- Print-friendly cover letters with browser PDF saving
- Saved application dashboard
- Persistent application status tracking (Draft, Applied, Interview, Offer, and Rejected)
- Dashboard filtering by application status
- Dashboard search by company and job title
- Dashboard sorting by creation order and match score
- Dashboard summary metrics for saved applications
- CSV export for application tracking data
- Private notes for contacts, follow-ups, and interview feedback
- Confirmed deletion of saved applications
- Local browser persistence for profiles and applications
- Optional Supabase cloud persistence with per-user Row Level Security
- Email account connection, Magic Link sign-in, and sign-out
- Mock and DeepSeek AI providers

## Local development

```bash
npm install
cp .env.example .env.local
npx vercel dev
```

Open the URL printed by Vercel CLI, normally `http://localhost:3000`. This runs both the Vite frontend and the `/api` functions. The default `AI_PROVIDER=mock` mode works without an external AI key.

Use `npm run dev` only when working on the frontend without the analysis API.

## Supabase setup

1. Create a Supabase project.
2. Run the files in `supabase/migrations` in filename order in its SQL Editor.
3. Enable anonymous sign-ins and the Email provider under Authentication settings.
4. Enable manual identity linking so a guest account can be connected to an email.
5. Add `http://localhost:3000/account` and your deployed `/account` URL to the allowed redirect URLs.
6. Add the project URL and publishable key to `.env.local`:

```dotenv
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

When these variables are absent, the app keeps using browser storage. When they are added, existing local data is copied to Supabase once. Never expose a Supabase secret or service-role key in `VITE_` variables.

## DeepSeek setup

To use live AI analysis, configure server environment variables:

```dotenv
AI_PROVIDER=deepseek
DEEPSEEK_API_KEY=your-key
DEEPSEEK_MODEL=deepseek-v4-flash
```

Keep `DEEPSEEK_API_KEY` server-side. Variables prefixed with `VITE_` are bundled into the browser and must not contain secrets.

## Testing

Run the Vitest unit and component test suite:

```bash
npm test
```

Install Playwright's Chromium browser once, then run the end-to-end application flow:

```bash
npx playwright install chromium
npm run test:e2e
```

The end-to-end test starts the Vite development server automatically. It disables Supabase configuration and mocks the AI response, so it uses isolated browser storage and does not write to a configured Supabase project or call a real AI provider.

## Full verification

```bash
npm ci
npm test
npm run test:e2e
npm run lint
npm run build
```

GitHub Actions runs dependency installation, the Vitest suite, the Playwright Chromium end-to-end test, linting, and the production build for every pull request and every push to `main`.
