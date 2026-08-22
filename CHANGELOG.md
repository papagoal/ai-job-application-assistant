# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.0] - 2026-08-21

### Added

- A compact left sidebar with responsive mobile navigation, a persistent new-application action, and signed-in user details.
- A bottom-left account popover with account navigation, safe sign-out behavior, outside-click dismissal, and keyboard dismissal.
- A concise application table view alongside the existing dashboard cards.
- A dashboard version badge sourced automatically from the package version.
- RoleLumi search, Open Graph, and social-sharing metadata, plus a public sitemap and privacy-conscious crawler rules.

### Changed

- Rebranded the product as RoleLumi with the supplied logo, favicon, browser title, and documentation updates.
- Redesigned the dashboard, profile, new-application, analysis, and account pages around a consistent black, white, soft-gray, and restrained beige visual system.
- Improved card depth, content hierarchy, form alignment, responsive layouts, empty states, and analysis-section presentation.
- Established `https://rolelumi.com` as the canonical production domain with `www` redirection.

### Security

- Kept account, profile, and private application routes out of search-engine crawling instructions.
- Preserved the existing Supabase project reference, Row Level Security, authentication callbacks, and server-only AI credentials throughout the domain and brand migration.

### Quality

- Expanded automated coverage to 113 unit, component, API, authentication, and end-to-end tests.
- Verified the RoleLumi custom domain, Magic Link flow, Google sign-in, sitemap submission, and production indexing request manually.

## [1.2.0] - 2026-08-21

### Added

- AI-generated interview preparation with likely questions, answer guidance, and questions for the interviewer.
- Per-application DeepSeek V4 Flash and V4 Pro model selection reused across analysis, resume regeneration, and interview preparation.
- A compact dashboard table view for company, role, private note, status, and creation date.
- Google OAuth sign-in with identity linking for existing guest and Magic Link accounts.

### Changed

- Made analysis sections independently collapsible to keep long result pages easier to scan.
- Aligned the AI language and model controls for a cleaner application form layout.

### Security

- Preserved the existing Supabase user ID and cloud data when connecting Google to an active account.
- Kept the Google Client Secret in Supabase rather than exposing it to the browser or repository.

### Quality

- Expanded automated coverage to 106 unit, component, API, authentication, and end-to-end tests.
- Verified the Google OAuth flow manually from account linking through sign-out and Google sign-in.

## [1.1.0] - 2026-08-21

### Added

- English and Simplified Chinese AI output for match analysis, tailored resumes, and cover letters.
- One-click tailored-resume regeneration with automatic saving and a single-session undo action.
- Public job-listing link import for editable company, role, and job-description fields.

### Changed

- Required every generated tailored resume to begin with a newly written, role-specific professional summary based only on verified resume facts.
- Separated tailored-resume actions into copy, direct A4 PDF download, and print workflows.
- Improved one-page resume PDF typography, spacing, page usage, and Chinese text rendering.

### Fixed

- Routed direct `/account` visits through the Vercel SPA so email Magic Links no longer land on a platform 404.
- Retried and rejected AI responses with an empty professional summary instead of saving incomplete resumes.
- Removed browser-generated dates, URLs, titles, and page numbers from direct resume PDF downloads.

### Security

- Treated imported job pages as untrusted AI input and strictly validated the extracted fields.
- Blocked job imports from localhost, private or reserved network addresses, unsafe redirects, unsupported content, oversized pages, and timed-out requests.

### Quality

- Expanded unit, component, API, security, and end-to-end coverage to 85 automated tests.

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

[1.3.0]: https://github.com/papagoal/ai-job-application-assistant/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/papagoal/ai-job-application-assistant/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/papagoal/ai-job-application-assistant/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/papagoal/ai-job-application-assistant/releases/tag/v1.0.0
