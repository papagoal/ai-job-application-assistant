import { expect, test } from '@playwright/test'
import { readFile } from 'node:fs/promises'

const analysis = {
  companyName: 'Northstar Labs',
  jobTitle: 'Frontend Developer',
  matchScore: 82,
  scoreSummary: 'Strong overall match',
  scoreDescription: 'Your React experience aligns with the role.',
  matchingSkills: ['React', 'TypeScript'],
  missingSkills: ['Playwright'],
  suggestions: ['Highlight automated testing experience.'],
  coverLetter: 'Dear Hiring Manager, I am excited to apply.',
  outputLanguage: 'en' as const,
  aiModel: 'deepseek-v4-pro' as const,
  tailoredResume: `PROFESSIONAL SUMMARY
Frontend developer experienced with React and TypeScript.

SKILLS
- React
- TypeScript`,
}

const regeneratedResume = `PROFESSIONAL SUMMARY
Newly regenerated resume for testing with role-specific React and TypeScript experience.

SKILLS
- React
- TypeScript
- Playwright`

const interviewPrep = {
  technicalQuestions: Array.from({ length: 5 }, (_, index) => ({
    question: `How would you test an accessible React workflow ${index + 1}?`,
    answerFocus: [
      'Use the verified React and TypeScript experience.',
      'Explain testing choices and measurable validation.',
    ],
  })),
  behavioralQuestions: Array.from({ length: 3 }, (_, index) => ({
    question: `Tell us about a collaborative delivery challenge ${index + 1}.`,
    answerFocus: [
      'Clarify personal responsibility in a real project.',
      'Structure the example around situation, action, and result.',
    ],
  })),
}

test('completes the profile-to-application workflow', async ({ page }) => {
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.route('**/api/import-job', async (route) => {
    expect(route.request().method()).toBe('POST')
    expect(route.request().postDataJSON()).toEqual({
      url: 'https://jobs.example.com/frontend-developer',
    })
    await route.fulfill({
      json: {
        companyName: 'Northstar Labs',
        jobTitle: 'Frontend Developer',
        jobDescription: 'Build accessible React applications.',
      },
    })
  })
  await page.route('**/api/analyze-job', async (route) => {
    expect(route.request().method()).toBe('POST')
    expect(route.request().postDataJSON()).toEqual({
      companyName: 'Northstar Labs',
      jobTitle: 'Frontend Developer',
      jobDescription: 'Build accessible React applications.',
      resumeText: 'React and TypeScript experience.',
      outputLanguage: 'en',
      aiModel: 'deepseek-v4-pro',
    })
    await route.fulfill({ json: analysis })
  })
  await page.route('**/api/regenerate-resume', async (route) => {
    expect(route.request().method()).toBe('POST')
    expect(route.request().postDataJSON()).toEqual({
      companyName: 'Northstar Labs',
      jobTitle: 'Frontend Developer',
      jobDescription: 'Build accessible React applications.',
      resumeText: 'React and TypeScript experience.',
      currentTailoredResume: analysis.tailoredResume,
      outputLanguage: 'en',
      aiModel: 'deepseek-v4-pro',
    })
    await route.fulfill({ json: { tailoredResume: regeneratedResume } })
  })
  await page.route('**/api/generate-interview-prep', async (route) => {
    expect(route.request().method()).toBe('POST')
    expect(route.request().postDataJSON()).toEqual({
      companyName: 'Northstar Labs',
      jobTitle: 'Frontend Developer',
      jobDescription: 'Build accessible React applications.',
      resumeText: 'React and TypeScript experience.',
      outputLanguage: 'en',
      aiModel: 'deepseek-v4-pro',
    })
    await route.fulfill({ json: interviewPrep })
  })

  await page.goto('/profile')
  await expect.poll(() => page.locator('body').evaluate(
    (body) => window.getComputedStyle(body).backgroundImage,
  )).toContain('radial-gradient')
  await expect.poll(() => page.locator('.page-description').evaluate(
    (description) => window.getComputedStyle(description).color,
  )).toBe('rgb(71, 84, 103)')
  await page.getByLabel('Full name').fill('Test Candidate')
  await page.getByLabel('Email').fill('candidate@example.com')
  await page.getByLabel(/Phone/).fill('+1 416 555 0123')
  await page.getByLabel(/Location/).fill('Toronto, ON')
  await page.getByLabel('Professional summary').fill('Frontend developer')
  await page.getByLabel('Resume text').fill('React and TypeScript experience.')
  await page.getByRole('button', { name: 'Save profile' }).click()
  await expect(page.getByRole('status')).toHaveText('Profile saved.')
  await page.reload()
  await expect(page.getByLabel(/Phone/)).toHaveValue('+1 416 555 0123')
  await expect(page.getByLabel(/Location/)).toHaveValue('Toronto, ON')

  await page.getByRole('link', { name: 'New Application' }).click()
  await expect(page.getByLabel('Resume text')).toHaveValue(
    'React and TypeScript experience.',
  )
  const languageSelectBox = await page.getByLabel('AI output language').boundingBox()
  const modelSelectBox = await page.getByLabel('AI model').boundingBox()
  expect(languageSelectBox?.y).toBe(modelSelectBox?.y)
  expect(languageSelectBox?.height).toBe(modelSelectBox?.height)
  await page.getByLabel(/Job listing link/).fill(
    'https://jobs.example.com/frontend-developer',
  )
  await page.getByRole('button', { name: 'Import job details' }).click()
  await expect(page.getByRole('status')).toHaveText(
    'Job details imported. Review them before analyzing.',
  )
  await expect(page.getByLabel('Company name')).toHaveValue('Northstar Labs')
  await expect(page.getByLabel('Job title')).toHaveValue('Frontend Developer')
  await expect(page.getByLabel('Job description')).toHaveValue(
    'Build accessible React applications.',
  )
  await page.getByLabel('AI model').selectOption('deepseek-v4-pro')
  await page.getByRole('button', { name: 'Analyze match' }).click()

  await expect(page).toHaveURL(/\/applications\/[0-9a-f-]+$/)
  await expect(
    page.getByRole('heading', { name: 'Frontend Developer', exact: true }).first(),
  ).toBeVisible()
  await expect(page.getByLabel('82 percent match')).toBeVisible()
  await expect(page.getByText('Strong overall match')).toBeVisible()
  await expect(page.getByText(/DeepSeek V4 Pro/)).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Job-targeted draft' })).toBeVisible()
  const analysisPanelHeadings = await page
    .locator('.analysis-content > .analysis-panel h2')
    .allTextContents()
  expect(analysisPanelHeadings.at(-1)).toBe('Private notes')
  const tailoredResume = page.locator('.tailored-resume-document')
  const skillsPanelToggle = page.getByRole('button', {
    name: 'What matches and what is missing',
  })
  const tailoredResumePanel = page.locator('.tailored-resume-panel')
  const tailoredResumePanelToggle = tailoredResumePanel.getByRole('button', {
    name: 'Job-targeted draft',
  })
  const resumeImprovementsToggle = page.getByRole('button', {
    name: 'Suggestions for this application',
  })
  const privateNotesToggle = page.getByRole('button', { name: 'Private notes' })
  await expect(skillsPanelToggle).toHaveAttribute('aria-expanded', 'true')
  await expect(tailoredResumePanelToggle).toHaveAttribute('aria-expanded', 'false')
  await expect(tailoredResume).toBeHidden()

  await page.getByRole('button', { name: 'Expand all' }).click()
  await expect(tailoredResume).toBeVisible()
  await page.getByRole('button', { name: 'Collapse all' }).click()
  await expect(skillsPanelToggle).toHaveAttribute('aria-expanded', 'false')
  await expect(page.locator('.suggestion-list')).toBeHidden()
  await expect(page.locator('.notes-editor')).toBeHidden()
  await resumeImprovementsToggle.click()
  await privateNotesToggle.click()
  await expect(page.locator('.suggestion-list')).toBeVisible()
  await expect(page.locator('.notes-editor')).toBeVisible()
  await tailoredResumePanelToggle.click()

  await expect(tailoredResume.getByRole('heading', { name: 'Test Candidate' })).toBeVisible()
  await expect(tailoredResume.getByText('candidate@example.com')).toBeVisible()
  await expect(tailoredResume.getByText('+1 416 555 0123')).toBeVisible()
  await expect(tailoredResume.getByText('Toronto, ON')).toBeVisible()
  await expect(tailoredResume.getByRole('heading', { name: 'SKILLS' })).toBeVisible()
  await expect(tailoredResume.locator('li').filter({ hasText: /^React$/ })).toBeVisible()

  await tailoredResumePanel.getByRole('button', { name: 'Regenerate with AI' }).click()
  await expect(page.getByRole('status')).toHaveText('New AI resume generated and saved.')
  await expect(tailoredResume.getByText(/Newly regenerated resume/)).toBeVisible()
  await tailoredResumePanel.getByRole('button', { name: 'Undo regeneration' }).click()
  await expect(page.getByRole('status')).toHaveText('Previous resume restored.')
  await expect(tailoredResume.getByText(/Frontend developer experienced/)).toBeVisible()

  const interviewPrepPanel = page.locator('.interview-prep-panel')
  await interviewPrepPanel.getByRole('button', {
    name: 'Role-specific practice questions',
  }).click()
  await interviewPrepPanel.getByRole('button', { name: 'Generate interview prep' }).click()
  await expect(interviewPrepPanel.getByRole('status')).toHaveText(
    'Interview preparation generated and saved.',
  )
  await expect(
    interviewPrepPanel.getByRole('heading', { name: 'Technical questions' }),
  ).toBeVisible()
  await expect(interviewPrepPanel.locator('.interview-prep-group').first()
    .locator('.interview-question-list > li')).toHaveCount(5)
  await expect(interviewPrepPanel.getByText(/How would you test an accessible React/).first())
    .toBeVisible()

  await page.evaluate(() => {
    window.print = () => document.body.setAttribute('data-print-invoked', 'true')
  })
  await tailoredResumePanel
    .getByRole('button', { name: 'Print', exact: true })
    .click()
  await expect.poll(() => page.evaluate(() => document.body.dataset.printTarget))
    .toBe('tailored-resume')
  await expect.poll(() => page.evaluate(() => document.body.dataset.printInvoked))
    .toBe('true')
  await page.emulateMedia({ media: 'print' })
  await expect.poll(() => page.locator('body').evaluate(
    (body) => window.getComputedStyle(body).backgroundImage,
  )).toBe('none')
  await expect(page.locator('.tailored-resume-panel')).toBeVisible()
  await expect(
    page.locator('.tailored-resume-document').getByRole('heading', {
      name: 'PROFESSIONAL SUMMARY',
    }),
  ).toBeVisible()
  await expect(page.locator('.cover-letter-panel')).toBeHidden()
  const resumePdf = await page.pdf({ format: 'Letter', printBackground: true })
  const resumePageCount = resumePdf.toString('latin1').match(/\/Type\s*\/Page\b/g)?.length ?? 0
  expect(resumePageCount).toBe(1)
  await page.emulateMedia({ media: 'screen' })

  await page.getByRole('button', { name: 'Edit tailored resume' }).click()
  await page
    .getByLabel('Tailored resume draft')
    .fill(`PROFESSIONAL SUMMARY
Updated tailored resume for testing. Frontend-focused developer experienced in building responsive, user-centered applications with React, TypeScript, and GraphQL. Brings practical experience across product delivery, testing, API integration, and cloud deployment for teams seeking reliable, maintainable software.

TECHNICAL SKILLS
- Frontend: React, TypeScript, JavaScript, HTML, CSS, responsive design
- Backend: Node.js, REST APIs, GraphQL, PostgreSQL, authentication
- Testing: Vitest, Testing Library, Playwright, automated regression testing
- Delivery: Git, GitHub Actions, Docker, AWS, Vercel, CI workflows

PROFESSIONAL EXPERIENCE
- Developed and maintained full-stack product features using React, TypeScript, Node.js, GraphQL, and PostgreSQL, supporting customer-facing workflows and internal operational tools.
- Built reusable interface components, integrated REST and GraphQL services, and diagnosed issues across frontend, backend, database, and third-party integrations.
- Added automated unit and end-to-end testing to improve regression coverage, validate critical application flows, and support safer feature delivery.
- Implemented authentication, authorization, and protected data access using secure session handling and role-aware application behavior.
- Containerized application environments and used cloud deployment tools, logs, and monitoring workflows to validate production behavior.

SELECTED PROJECT
- Built an AI job application assistant with React, TypeScript, Vite, Supabase, and Vercel Functions, including resume analysis, job-specific summaries, cover letters, application tracking, authentication, and direct PDF export.
- Used feature branches, conventional commits, draft pull requests, automated checks, and manual acceptance testing to deliver changes incrementally.

EDUCATION
University degree with continued practical development in modern web engineering.`)
  await page.getByRole('button', { name: 'Save tailored resume' }).click()
  await expect(tailoredResumePanel.getByRole('status')).toHaveText(
    'Tailored resume saved.',
  )

  await page.getByRole('button', { name: 'Copy as text' }).click()
  await expect(page.getByRole('button', { name: 'Copied!' })).toBeVisible()
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toContain('Updated tailored resume')

  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download PDF' }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toBe(
    'Northstar-Labs-Frontend-Developer-tailored-resume.pdf',
  )
  const downloadPath = await download.path()
  if (!downloadPath) throw new Error('Downloaded PDF path is unavailable.')
  const downloadedPdf = (await readFile(downloadPath)).toString('latin1')
  expect(downloadedPdf).toMatch(/\/MediaBox \[0 0 595\.\d+ 841\.\d+\]/)
  expect(downloadedPdf.match(/\/Type \/Page\b/g)).toHaveLength(1)

  await page.reload()
  await page.getByRole('button', { name: 'Job-targeted draft' }).click()
  await page.getByRole('button', { name: 'Role-specific practice questions' }).click()
  await expect(page.getByText('Updated tailored resume')).toBeVisible()
  await expect(page.getByText(/How would you test an accessible React/).first()).toBeVisible()

  await page.getByRole('link', { name: 'Back to Dashboard' }).click()
  await expect(page.getByRole('heading', { name: 'Your applications' })).toBeVisible()
  await expect(page.getByText('Northstar Labs')).toBeVisible()
  await expect(
    page.getByRole('link', { name: 'View Frontend Developer at Northstar Labs' }),
  ).toBeVisible()
})
