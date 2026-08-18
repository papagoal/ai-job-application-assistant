import { expect, test } from '@playwright/test'

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
  tailoredResume: `PROFESSIONAL SUMMARY
Frontend developer experienced with React and TypeScript.

SKILLS
- React
- TypeScript`,
}

test('completes the profile-to-application workflow', async ({ page }) => {
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.route('**/api/analyze-job', async (route) => {
    expect(route.request().method()).toBe('POST')
    expect(route.request().postDataJSON()).toEqual({
      companyName: 'Northstar Labs',
      jobTitle: 'Frontend Developer',
      jobDescription: 'Build accessible React applications.',
      resumeText: 'React and TypeScript experience.',
    })
    await route.fulfill({ json: analysis })
  })

  await page.goto('/profile')
  await page.getByLabel('Full name').fill('Test Candidate')
  await page.getByLabel('Email').fill('candidate@example.com')
  await page.getByLabel('Professional summary').fill('Frontend developer')
  await page.getByLabel('Resume text').fill('React and TypeScript experience.')
  await page.getByRole('button', { name: 'Save profile' }).click()
  await expect(page.getByRole('status')).toHaveText('Profile saved.')

  await page.getByRole('link', { name: 'New Application' }).click()
  await expect(page.getByLabel('Resume text')).toHaveValue(
    'React and TypeScript experience.',
  )
  await page.getByLabel('Company name').fill('Northstar Labs')
  await page.getByLabel('Job title').fill('Frontend Developer')
  await page
    .getByLabel('Job description')
    .fill('Build accessible React applications.')
  await page.getByRole('button', { name: 'Analyze match' }).click()

  await expect(page).toHaveURL(/\/applications\/[0-9a-f-]+$/)
  await expect(
    page.getByRole('heading', { name: 'Frontend Developer', exact: true }).first(),
  ).toBeVisible()
  await expect(page.getByLabel('82 percent match')).toBeVisible()
  await expect(page.getByText('Strong overall match')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Job-targeted draft' })).toBeVisible()
  const tailoredResume = page.locator('.tailored-resume-document')
  await expect(tailoredResume.getByRole('heading', { name: 'Test Candidate' })).toBeVisible()
  await expect(tailoredResume.getByText('candidate@example.com')).toBeVisible()
  await expect(tailoredResume.getByRole('heading', { name: 'SKILLS' })).toBeVisible()
  await expect(tailoredResume.locator('li').filter({ hasText: /^React$/ })).toBeVisible()

  await page.evaluate(() => {
    window.print = () => document.body.setAttribute('data-print-invoked', 'true')
  })
  await page.locator('.tailored-resume-panel')
    .getByRole('button', { name: 'Print / Save as PDF' })
    .click()
  await expect.poll(() => page.evaluate(() => document.body.dataset.printTarget))
    .toBe('tailored-resume')
  await expect.poll(() => page.evaluate(() => document.body.dataset.printInvoked))
    .toBe('true')
  await page.emulateMedia({ media: 'print' })
  await expect(page.locator('.tailored-resume-panel')).toBeVisible()
  await expect(
    page.locator('.tailored-resume-document').getByRole('heading', {
      name: 'PROFESSIONAL SUMMARY',
    }),
  ).toBeVisible()
  await expect(page.locator('.cover-letter-panel')).toBeHidden()
  await page.emulateMedia({ media: 'screen' })

  await page.getByRole('button', { name: 'Edit tailored resume' }).click()
  await page
    .getByLabel('Tailored resume draft')
    .fill('TEST CANDIDATE\nFrontend Developer\n\nUpdated tailored resume')
  await page.getByRole('button', { name: 'Save tailored resume' }).click()
  await expect(page.getByRole('status')).toHaveText('Tailored resume saved.')

  await page.getByRole('button', { name: 'Copy tailored resume' }).click()
  await expect(page.getByRole('button', { name: 'Copied!' })).toBeVisible()
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toContain('Updated tailored resume')

  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download tailored resume' }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toBe(
    'Northstar-Labs-Frontend-Developer-tailored-resume.txt',
  )

  await page.reload()
  await expect(page.getByText('Updated tailored resume')).toBeVisible()

  await page.getByRole('link', { name: 'Back to Dashboard' }).click()
  await expect(page.getByRole('heading', { name: 'Your applications' })).toBeVisible()
  await expect(page.getByText('Northstar Labs')).toBeVisible()
  await expect(
    page.getByRole('link', { name: 'View Frontend Developer at Northstar Labs' }),
  ).toBeVisible()
})
