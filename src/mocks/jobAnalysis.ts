import type { JobAnalysis } from '../types/jobAnalysis'

export const mockJobAnalysis: JobAnalysis = {
  companyName: 'Northstar Labs',
  jobTitle: 'Frontend Developer',
  matchScore: 82,
  scoreSummary: 'Strong overall match',
  scoreDescription:
    'Your frontend experience aligns well with the core requirements for this role.',
  matchingSkills: ['React', 'TypeScript', 'Responsive design', 'Git'],
  missingSkills: ['Jest', 'CI/CD', 'Accessibility testing'],
  suggestions: [
    'Highlight measurable impact from your React projects.',
    'Add examples of automated testing or quality assurance work.',
    'Mention accessibility practices used in production interfaces.',
  ],
  coverLetter: `Dear Hiring Manager,

I am excited to apply for the Frontend Developer role at Northstar Labs. My experience building responsive React and TypeScript applications aligns closely with the needs described in this position.

I would welcome the opportunity to bring my frontend development skills and product-focused approach to your team.

Sincerely,
Your Name`,
}
