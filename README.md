# AI Job Application Assistant

A React application that compares a job description with a resume, produces an AI match analysis, and tracks saved applications.

## Features

- Candidate profile and reusable resume
- Job-to-resume match analysis
- Matching and missing skills
- Resume suggestions and cover-letter draft
- Saved application dashboard
- Local browser persistence for profiles and applications
- Mock and DeepSeek AI providers

## Local development

```bash
npm install
cp .env.example .env.local
npm run dev
```

The default `AI_PROVIDER=mock` mode works without an external AI key.

## DeepSeek setup

To use live AI analysis, configure server environment variables:

```dotenv
AI_PROVIDER=deepseek
DEEPSEEK_API_KEY=your-key
DEEPSEEK_MODEL=deepseek-v4-flash
```

Keep `DEEPSEEK_API_KEY` server-side. Variables prefixed with `VITE_` are bundled into the browser and must not contain secrets.

## Verification

```bash
npm run build
npm run lint
```
