# RoleLumi

RoleLumi is a React application that compares a job description with a resume, produces an AI match analysis, and tracks saved applications.

## Features

- Candidate profile with reusable resume and optional phone/location details
- Public job-listing link import for company, role, and job-description fields
- Job-to-resume match analysis
- English and Simplified Chinese AI output
- Per-application DeepSeek V4 Flash or V4 Pro model selection
- Matching and missing skills
- Resume suggestions and cover-letter draft
- Editable tailored-resume drafts with copy, download, and print-ready PDF export
- One-click AI resume regeneration with automatic saving and undo
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
- Google OAuth sign-in with guest-account identity linking
- Mock and DeepSeek AI providers

## Local development

```bash
npm install
cp .env.example .env.local
npx vercel dev
```

Open the URL printed by Vercel CLI, normally `http://localhost:3000`. This runs both the Vite frontend and the `/api` functions. The default `AI_PROVIDER=mock` mode works without an external AI key.

Use `npm run dev` only when working on the frontend without the analysis API.

Job-link import works with publicly accessible listing pages. Pages that require sign-in, rely entirely on protected client-side rendering, or block automated requests must be entered manually.

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

`DEEPSEEK_MODEL` is the server fallback. New applications can choose V4 Flash
or V4 Pro in the form, and that choice is reused for resume regeneration and
interview preparation. Public job-listing extraction always uses V4 Flash.

Keep `DEEPSEEK_API_KEY` server-side. Variables prefixed with `VITE_` are bundled into the browser and must not contain secrets.

## Google sign-in setup

1. Create a Google OAuth client with the **Web application** type.
2. Add the application origins for local development and production.
3. Add `https://<project-ref>.supabase.co/auth/v1/callback` as an authorized redirect URI.
4. Paste the Google Client ID and Client Secret into the Google provider settings in Supabase Auth.
5. Add local, preview, and production `/account` URLs to the Supabase redirect allow list.

The Google Client Secret belongs only in Supabase. Do not add it to this repository or to a
`VITE_` environment variable. Manual identity linking must remain enabled so a guest user can
connect Google without changing the user ID that owns the existing cloud data.

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
