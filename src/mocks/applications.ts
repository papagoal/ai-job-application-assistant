import type { ApplicationSummary } from '../types/application'

export const mockApplications: ApplicationSummary[] = [
  {
    id: 'northstar-frontend-developer',
    companyName: 'Northstar Labs',
    jobTitle: 'Frontend Developer',
    matchScore: 82,
    status: 'Draft',
    createdAt: 'Aug 15, 2026',
  },
  {
    id: 'acme-react-developer',
    companyName: 'Acme Studio',
    jobTitle: 'React Developer',
    matchScore: 74,
    status: 'Applied',
    createdAt: 'Aug 12, 2026',
  },
  {
    id: 'pixelworks-ui-engineer',
    companyName: 'Pixelworks',
    jobTitle: 'UI Engineer',
    matchScore: 91,
    status: 'Interview',
    createdAt: 'Aug 8, 2026',
  },
]
