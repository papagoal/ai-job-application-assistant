# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-08-18

### Added

- Candidate profiles with reusable resumes and optional phone and location details.
- AI job-to-resume analysis with match scoring, skill comparison, and improvement suggestions.
- Mock and DeepSeek AI providers behind a shared provider interface.
- Editable tailored-resume drafts with a professional summary, copy, download, and one-page print-ready PDF output.
- Editable cover-letter drafts with copy, download, and print-ready PDF output.
- Application tracking with Draft, Applied, Interview, Offer, and Rejected statuses.
- Dashboard search, filtering, sorting, summary metrics, and CSV export.
- Private application notes and confirmed application deletion.
- Local browser persistence with optional Supabase cloud persistence and per-user Row Level Security.
- Anonymous guest accounts, email Magic Link sign-in, identity linking, and sign-out.
- Responsive application pages with a subtle dotted background and print-safe styling.

### Security

- Kept AI credentials in server-only environment variables.
- Treated resume and job-description content as untrusted prompt input.
- Restricted generated resume claims to facts found in the supplied resume.

### Quality

- Added unit, component, API, persistence, and Playwright end-to-end coverage.
- Added GitHub Actions checks for tests, linting, end-to-end verification, and production builds.
- Added Vercel SPA routing and serverless runtime compatibility.

[1.0.0]: https://github.com/papagoal/ai-job-application-assistant/releases/tag/v1.0.0
